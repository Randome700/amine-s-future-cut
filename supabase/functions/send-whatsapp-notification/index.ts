import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_booking" | "cancellation";
  client_name: string;
  services: string[];
  date: string;
  time: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, client_name, services, date, time }: NotificationRequest = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
    // Sanitize phone number - remove all spaces for E.164 format
    const ADMIN_WHATSAPP_NUMBER = Deno.env.get("ADMIN_WHATSAPP_NUMBER")?.replace(/\s/g, '');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !ADMIN_WHATSAPP_NUMBER) {
      console.error("Missing Twilio configuration");
      return new Response(
        JSON.stringify({ error: "Missing Twilio configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const servicesList = services.join(", ");
    
    let message: string;
    if (type === "new_booking") {
      message = `✂️ *New Booking*\n\n👤 Name: ${client_name}\n💈 Service: ${servicesList}\n📅 Date: ${date}\n🕐 Time: ${time}`;
    } else {
      message = `❌ *Booking Cancelled*\n\n👤 Name: ${client_name}\n💈 Service: ${servicesList}\n📅 Date: ${date}\n🕐 Time: ${time}`;
    }

    console.log("Sending WhatsApp message:", message);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("From", `whatsapp:${TWILIO_WHATSAPP_FROM}`);
    formData.append("To", `whatsapp:${ADMIN_WHATSAPP_NUMBER}`);
    formData.append("Body", message);

    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseData = await twilioResponse.json();
    console.log("Twilio response:", responseData);

    if (!twilioResponse.ok) {
      console.error("Twilio error:", responseData);
      return new Response(
        JSON.stringify({ error: "Failed to send WhatsApp message", details: responseData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: responseData.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
