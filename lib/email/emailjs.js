/**
 * EmailJS REST API Client for Server-Side execution in Next.js
 * Sends emails to ANY recipient address via configured EmailJS Service (e.g. Gmail)
 * Supports Base64 Data URI file attachments for PDF receipts.
 */
export async function sendViaEmailJS({
  to_email,
  to_name,
  subject,
  html,
  attachmentDataUri = null,
  customParams = {},
}) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!serviceId || !templateId || !publicKey) {
    console.warn(
      "[EmailJS Warning] Kunci konfigurasi EmailJS belum lengkap di .env (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY)."
    );
    return {
      success: false,
      error: "Konfigurasi EmailJS belum lengkap di environment variable.",
    };
  }

  // Provide all common placeholder aliases so template matching succeeds regardless of variable naming in EmailJS dashboard
  const templateParams = {
    // Recipient Aliases
    to_email: to_email,
    email: to_email,
    user_email: to_email,
    recipient_email: to_email,
    recipient: to_email,
    reply_to: to_email,

    // Name Aliases
    to_name: to_name || "Pengguna NekoStay",
    name: to_name || "Pengguna NekoStay",
    user_name: to_name || "Pengguna NekoStay",

    // Subject / Title Aliases
    subject: subject || "Notifikasi NekoStay",
    title: subject || "Notifikasi NekoStay",

    // Content Aliases
    message: html,
    content: html,
    html_content: html,

    // Attachment Data URIs (for EmailJS template attachment variable)
    ...(attachmentDataUri
      ? {
          attachment: attachmentDataUri,
          pdf_attachment: attachmentDataUri,
          file: attachmentDataUri,
          pdf_file: attachmentDataUri,
        }
      : {}),

    ...customParams,
  };

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: templateParams,
  };

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "origin": appUrl,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[EmailJS Error] HTTP ${res.status}:`, errorText);
      return { success: false, error: errorText };
    }

    console.log(`[EmailJS Success] Email & PDF berhasil terkirim ke target: ${to_email}`);
    return { success: true, data: "OK" };
  } catch (err) {
    console.error("[EmailJS Exception] Gagal mengirim email via EmailJS:", err);
    return { success: false, error: err.message || err };
  }
}
