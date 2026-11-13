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
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Booking payment is not configured." }, 503);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid or expired session." }, 401);

    const body = await req.json().catch(() => ({}));
    const walletDigits = typeof body.momo_number === "string" ? body.momo_number.replace(/\D/g, "") : "";
    const provider = body.momo_provider === "tnm" ? "TNM Mpamba" : body.momo_provider === "airtel" ? "Airtel Money" : "";
    if (!/^(265)?0?[0-9]{9}$/.test(walletDigits) || !provider) return json({ error: "A valid Malawi mobile money number and provider are required." }, 400);
    const normalizedWallet = `+265${walletDigits.slice(-9)}`;

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: booking, error: bookingError } = await admin.from("lakeshore")
      .select("id, full_name, booking_email, booking_amount, selected_seat, departing_center, payment_status")
      .eq("id", user.id)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking || !booking.selected_seat) return json({ error: "Complete passenger details and reserve a seat before paying." }, 409);
    if (booking.payment_status === "PAID" || booking.payment_status === "SUCCESSFUL") return json({ error: "This booking is already paid." }, 409);

    const amount = Number(booking.booking_amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) return json({ error: "Booking amount is invalid." }, 409);

    const txRef = `LAKE-${user.id}-${crypto.randomUUID()}`;
    const { error: updateError } = await admin.from("lakeshore").update({
      payment_status: "PENDING",
      payment_reference: txRef,
      momo_number: normalizedWallet,
      momo_provider: provider,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (updateError) throw updateError;

    return json({
      tx_ref: txRef,
      amount,
      full_name: booking.full_name || user.user_metadata?.full_name || "Passenger",
      email: booking.booking_email || user.email || "",
      seat: booking.selected_seat,
      departing_center: booking.departing_center || "",
    });
  } catch (error) {
    console.error("Could not prepare booking payment:", error instanceof Error ? error.message : error);
    return json({ error: "Unable to prepare payment. Please try again or contact support." }, 500);
  }
});
