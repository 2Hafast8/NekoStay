import { Resend } from "resend";

// Lazily initialize Resend to avoid compile-time environment variable errors
let resendInstance = null;

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_build";
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export default getResend();

export async function sendBookingConfirmation(
  userEmail,
  userName,
  catName,
  bookingId,
  checkIn,
  checkOut,
  className,
  totalCost,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Pesanan Penitipan ${catName} Telah Diterima`,
    html: `
      <h2>Halo ${userName}! 🐱</h2>
      <p>Pesanan penitipan kucing <strong>${catName}</strong> Anda telah berhasil dibuat.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Kelas</strong></td><td style="padding: 8px 0;">${className}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Tanggal Masuk</strong></td><td style="padding: 8px 0;">${checkIn}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Tanggal Keluar</strong></td><td style="padding: 8px 0;">${checkOut}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Estimasi Biaya</strong></td><td style="padding: 8px 0;">Rp ${totalCost.toLocaleString("id-ID")}</td></tr>
      </table>
      <p>Pembayaran dilakukan saat pengantaran kucing.</p>
      <a href="${appUrl}/booking/${bookingId}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Lihat Detail Pesanan</a>
    `,
  });
}

export async function sendBookingStatusUpdate(
  userEmail,
  userName,
  catName,
  bookingId,
  status,
) {
  const appUrl =
    process.env.NEXT_env_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Update Status Pesanan Penitipan ${catName} — ${status}`,
    html: `
      <h2>Halo ${userName}! 🐱</h2>
      <p>Status pesanan penitipan kucing <strong>${catName}</strong> Anda telah diperbarui menjadi <strong>${status}</strong>.</p>
      <a href="${appUrl}/booking/${bookingId}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Lihat Detail Pesanan</a>
    `,
  });
}

export async function sendBookingRejected(
  userEmail,
  userName,
  catName,
  bookingId,
  reason,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Pesanan Penitipan ${catName} Ditolak`,
    html: `
      <h2>Halo ${userName},</h2>
      <p>Mohon maaf, pesanan penitipan kucing <strong>${catName}</strong> Anda ditolak oleh admin dengan alasan:</p>
      <div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; border-radius: 4px;">
        <strong>Alasan Penolakan:</strong>
        <p style="margin: 4px 0;">${reason}</p>
      </div>
      <p>Silakan ajukan pesanan baru dengan data yang disesuaikan atau hubungi admin.</p>
      <a href="${appUrl}/dashboard" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Kembali ke Dashboard</a>
    `,
  });
}

export async function sendCatReport(
  userEmail,
  { catName, ownerName, healthStatus, notes, photoUrl, reportDate, bookingUrl },
) {
  const healthColor =
    {
      Sehat: "#22c55e",
      "Kurang Fit": "#f59e0b",
      "Perlu Perhatian": "#ef4444",
    }[healthStatus] || "#94a3b8";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Laporan Kondisi ${catName} — ${reportDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f97316; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🐱 NekoStay</h1>
          <p style="color: white; margin: 4px 0;">Laporan Kondisi Kucing</p>
        </div>

        <div style="padding: 24px 0;">
          <p>Halo <strong>${ownerName}</strong>,</p>
          <p>Berikut laporan kondisi <strong>${catName}</strong> pada ${reportDate}:</p>

          <div style="background: ${healthColor}20; border-left: 4px solid ${healthColor}; padding: 12px; border-radius: 4px;">
            <strong>Status Kesehatan:</strong>
            <span style="color: ${healthColor}; font-weight: bold; margin-left: 8px;">${healthStatus}</span>
          </div>

          ${
            photoUrl
              ? `
            <div style="margin: 16px 0;">
              <img src="${photoUrl}" alt="Foto ${catName}"
                style="width: 100%; max-width: 400px; border-radius: 8px; display: block; margin: 0 auto;" />
            </div>
          `
              : ""
          }

          ${
            notes
              ? `
            <div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin: 16px 0;">
              <strong>Catatan:</strong>
              <p style="margin: 4px 0;">${notes}</p>
            </div>
          `
              : ""
          }

          <a href="${bookingUrl}"
            style="display: inline-block; background: #f97316; color: white; padding: 12px 24px;
                   border-radius: 6px; text-decoration: none; margin-top: 16px;">
            Lihat Detail Pesanan
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          NekoStay — Platform Penitipan Kucing Terpercaya
        </p>
      </body>
      </html>
    `,
  });
}

export async function sendLateWarning(
  userEmail,
  catName,
  lateDays,
  additionalFee,
) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `⚠️ Peringatan Keterlambatan Pengambilan ${catName}`,
    html: `
      <h2>Peringatan Keterlambatan</h2>
      <p>Kucing <strong>${catName}</strong> belum diambil selama <strong>${lateDays} hari</strong> dari jadwal yang ditentukan.</p>
      <p>Biaya tambahan hari ini: <strong>Rp ${additionalFee.toLocaleString("id-ID")}</strong></p>
    `,
  });
}

export async function sendBookingEditNotification(
  userEmail,
  userName,
  catName,
  bookingId,
  oldDetails,
  newDetails,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Perubahan Detail Pesanan Penitipan ${catName}`,
    html: `
      <h2>Halo ${userName}! 🐱</h2>
      <p>Detail pesanan penitipan kucing <strong>${catName}</strong> Anda telah diperbarui oleh Admin.</p>
      
      <h3>Detail Sebelumnya:</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0; color: #666;">Kelas</td><td style="padding: 8px 0;">${oldDetails.className}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0; color: #666;">Check-In</td><td style="padding: 8px 0;">${oldDetails.checkIn}</td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0; color: #666;">Check-Out</td><td style="padding: 8px 0;">${oldDetails.checkOut}</td></tr>
      </table>

      <h3>Detail Baru:</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Kelas</strong></td><td style="padding: 8px 0;"><strong>${newDetails.className}</strong></td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Check-In</strong></td><td style="padding: 8px 0;"><strong>${newDetails.checkIn}</strong></td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Check-Out</strong></td><td style="padding: 8px 0;"><strong>${newDetails.checkOut}</strong></td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Total Hari</strong></td><td style="padding: 8px 0;"><strong>${newDetails.totalDays} Hari</strong></td></tr>
        <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 8px 0;"><strong>Estimasi Biaya</strong></td><td style="padding: 8px 0;"><strong>Rp ${newDetails.estimatedTotal.toLocaleString("id-ID")}</strong></td></tr>
      </table>

      <p>Jika Anda memiliki pertanyaan mengenai perubahan ini, silakan hubungi admin.</p>
      <a href="${appUrl}/booking/${bookingId}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Lihat Detail Pesanan</a>
    `,
  });
}

