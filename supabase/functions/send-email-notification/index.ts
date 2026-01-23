import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_booking" | "cancellation";
  client_name: string;
  barber: string;
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
    const { type, client_name, barber, services, date, time }: NotificationRequest = await req.json();

    const servicesList = services.join(", ");
    
    let subject: string;
    let htmlContent: string;
    
    if (type === "new_booking") {
      subject = `✂️ Nouvelle Réservation - ${client_name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2d3748;">✂️ Nouvelle Réservation</h1>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>👤 Client:</strong> ${client_name}</p>
            <p style="margin: 10px 0;"><strong>💈 Coiffeur:</strong> ${barber}</p>
            <p style="margin: 10px 0;"><strong>✂️ Service(s):</strong> ${servicesList}</p>
            <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 10px 0;"><strong>🕐 Heure:</strong> ${time}</p>
          </div>
        </div>
      `;
    } else {
      subject = `❌ Annulation - ${client_name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e53e3e;">❌ Réservation Annulée</h1>
          <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>👤 Client:</strong> ${client_name}</p>
            <p style="margin: 10px 0;"><strong>💈 Coiffeur:</strong> ${barber}</p>
            <p style="margin: 10px 0;"><strong>✂️ Service(s):</strong> ${servicesList}</p>
            <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 10px 0;"><strong>🕐 Heure:</strong> ${time}</p>
          </div>
        </div>
      `;
    }

    console.log("Sending email notification via Brevo:", { type, client_name, barber, services, date, time });

    // Send email using Brevo API
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: {
          name: "Amine Barbershop",
          email: "beaziz022@gmail.com",
        },
        to: [
          {
            email: "beaziz022@gmail.com",
            name: "Admin",
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Brevo API error:", responseData);
      return new Response(
        JSON.stringify({ error: responseData }),
        { status: emailResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully via Brevo:", responseData);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
