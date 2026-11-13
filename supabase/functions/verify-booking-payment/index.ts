import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const payChanguSecret = Deno.env.get("PAYCHANGU_SECRET_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !payChanguSecret) {
      console.error("Missing required server environment configuration.");
      return json({ error: "Payment verification is not configured." }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid or expired session." }, 401);

    const body = await req.json().catch(() => ({}));
    const txRef = typeof body.tx_ref === "string" ? body.tx_ref.trim() : "";
    if (!txRef || !txRef.startsWith(`LAKE-${user.id}-`)) return json({ error: "Invalid transaction reference." }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: booking, error: bookingError } = await admin.from("lakeshore")
      .select("id, booking_amount, payment_status, payment_reference")
      .eq("id", user.id)
      .maybeSingle();

    if (bookingError) throw bookingError;
    if (!booking) return json({ error: "Booking record not found." }, 404);
    if (booking.payment_status === "PAID" && booking.payment_reference === txRef) {
      return json({ success: true, already_verified: true, tx_ref: txRef });
    }
    if (booking.payment_status !== "PENDING" || booking.payment_reference !== txRef) {
      return json({ error: "This transaction is not the active pending payment for your booking." }, 409);
    }

    const expectedAmount = Number(booking.booking_amount);
    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) return json({ error: "Invalid booking amount." }, 409);

    const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${payChanguSecret}` },
    });
    const verification = await response.json().catch(() => null);
    if (!response.ok || verification?.status !== "success") {
      console.error("PayChangu verification rejected.", { status: response.status, txRef });
      return json({ error: "PayChangu could not confirm this transaction." }, 502);
    }

    const transaction = verification.data?.data ?? verification.data;
    const paidAmount = Number(transaction?.amount);
    if (transaction?.status !== "success" || transaction?.tx_ref !== txRef || transaction?.currency !== "MWK" || paidAmount !== expectedAmount) {
      return json({ error: "Payment status, reference, currency or amount did not match the booking." }, 409);
    }

    const { data: updated, error: updateError } = await admin.from("lakeshore").update({
      payment_status: "PAID",
      payment_reference: txRef,
      payment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", user.id).eq("payment_status", "PENDING").eq("payment_reference", txRef).select("id").maybeSingle();

    if (updateError) throw updateError;
    if (!updated) {
      const { data: current } = await admin.from("lakeshore").select("payment_status, payment_reference").eq("id", user.id).maybeSingle();
      if (current?.payment_status === "PAID" && current?.payment_reference === txRef) return json({ success: true, already_verified: true, tx_ref: txRef });
      return json({ error: "Booking payment state changed before verification could be committed." }, 409);
    }

    return json({ success: true, tx_ref: txRef, amount: paidAmount, currency: "MWK" });
  } catch (error) {
    console.error("Booking payment verification failed:", error instanceof Error ? error.message : error);
    return json({ error: "Payment verification failed. Contact support with your transaction reference." }, 500);
  }
});
