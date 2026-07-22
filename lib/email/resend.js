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

/**
 * Safe email sending wrapper.
 * Catches Resend testing mode restrictions and domain verification errors
 * without crashing API routes or blocking user transactions.
 */
async function safeSendEmail(emailPayload) {
  try {
    const resend = getResend();
    const res = await resend.emails.send(emailPayload);

    if (res?.error) {
      console.warn(
        `[Resend Warning] Failed to send email to ${emailPayload.to}:`,
        res.error.message || res.error
      );
      if (res.error.message?.includes("testing emails")) {
        console.warn(
          `[Resend Notice] You are using onboarding@resend.dev which only permits sending emails to your registered owner email. To send emails to all recipients, verify a custom domain on Resend.com and set RESEND_FROM_EMAIL.`
        );
      }
      return { success: false, error: res.error };
    }
    return { success: true, data: res.data };
  } catch (err) {
    console.warn(
      `[Resend Error] Caught exception when sending email to ${emailPayload.to}:`,
      err.message || err
    );
    return { success: false, error: err };
  }
}

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
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";
  return await safeSendEmail({
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
  booking = null
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";

  const emailData = {
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Update Status Pesanan Penitipan ${catName} — ${status}`,
    html: `
      <h2>Halo ${userName}! 🐱</h2>
      <p>Status pesanan penitipan kucing <strong>${catName}</strong> Anda telah diperbarui menjadi <strong>${status}</strong>.</p>
      ${status === 'Aktif' 
        ? `<p>Pesanan Anda telah disetujui dan aktif. Silakan bawa kucing Anda ke NekoStay sesuai jadwal.</p>
           <p>Jika Anda memilih pembayaran secara <strong>offline (di tempat)</strong>, silakan tunjukkan <strong>Bukti Pemesanan PDF</strong> yang terlampir pada email ini kepada admin/kasir kami saat Anda check-in.</p>`
        : ''
      }
      <a href="${appUrl}/booking/${bookingId}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Lihat Detail Pesanan</a>
    `,
  };

  if (status === 'Aktif' && booking) {
    try {
      const pdfBuffer = await generatePDFBuffer(booking, userName);
      emailData.attachments = [
        {
          filename: `Bukti_Pemesanan_${bookingId.substring(0, 8)}.pdf`,
          content: pdfBuffer,
        }
      ];
    } catch (pdfErr) {
      console.error("Failed to generate and attach PDF receipt:", pdfErr);
    }
  }

  return await safeSendEmail(emailData);
}

export async function sendBookingRejected(
  userEmail,
  userName,
  catName,
  bookingId,
  reason,
) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";
  return await safeSendEmail({
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

  return await safeSendEmail({
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
  return await safeSendEmail({
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
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";
  return await safeSendEmail({
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

export async function sendReviewReply(
  userEmail,
  userName,
  catName,
  reviewText,
  replyText
) {
  return await safeSendEmail({
    from: FROM_EMAIL,
    to: userEmail,
    subject: `Tanggapan Admin NekoStay untuk Review Penitipan ${catName}`,
    html: `
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background: #f97316; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="color: white; margin: 0;">🐱 NekoStay</h1>
          <p style="color: white; margin: 4px 0;">Balasan Ulasan Penitipan Kucing</p>
        </div>

        <div style="padding: 24px 0;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Terima kasih banyak atas ulasan Anda untuk penitipan kucing <strong>${catName}</strong>.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #94a3b8; padding: 12px; margin: 16px 0; border-radius: 4px; font-style: italic;">
            "${reviewText || 'Tidak ada teks ulasan'}"
          </div>

          <p><strong>Tanggapan Admin NekoStay:</strong></p>
          <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
            ${replyText}
          </div>

          <p style="margin-top: 24px;">Kami selalu berkomitmen memberikan pelayanan terbaik untuk kucing kesayangan Anda.</p>
          <p>Salam hangat,<br/><strong>Tim NekoStay</strong></p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          NekoStay — Platform Penitipan Kucing Terpercaya
        </p>
      </body>
    `,
  });
}

async function generatePDFBuffer(booking, userName) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Generate QR code data URL if offline payment token exists
  let qrCodeDataUrl = null;
  if (booking.offline_payment_token) {
    try {
      const QRCodeLib = await import("qrcode");
      const qrcode = QRCodeLib.default || QRCodeLib;
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://nekostay.vercel.app";
      const qrUrl = `${appUrl}/scan-verify?token=${booking.offline_payment_token}`;
      qrCodeDataUrl = await qrcode.toDataURL(qrUrl, { margin: 1, width: 150 });
    } catch (qrErr) {
      console.warn("Failed to generate QR Code for booking receipt PDF:", qrErr.message);
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(234, 88, 12); // Brand orange (#ea580c)
  doc.text("NekoStay", 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Bukti Pemesanan Penitipan Kucing (Receipt)", 20, 26);

  // Divider line
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Draw QR code on top-right if present
  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, "PNG", 145, 38, 38, 38);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("SCAN UNTUK BAYAR", 145, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("(Hanya untuk Admin)", 145, 83);
    } catch (imgErr) {
      console.warn("Failed to add QR image to PDF:", imgErr.message);
    }
  }

  // Booking Info
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL PEMESANAN", 20, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const labelX = 20;
  const valueX = 65;
  let y = 50;

  const formatDateString = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", { dateStyle: "long" });
    } catch {
      return dateStr || "-";
    }
  };

  const rows = [
    ["ID Booking", booking.id],
    ["Nama Pemilik", userName || "-"],
    ["Nama Kucing", booking.cat_name],
    ["Kelas Kamar", booking.class],
    ["Check-In", formatDateString(booking.check_in_date)],
    ["Check-Out", formatDateString(booking.check_out_date)],
    ["Durasi", `${booking.total_days || 0} Hari`],
    ["Tarif per Hari", `Rp ${(booking.price_per_day || 0).toLocaleString("id-ID")}`],
    ["Estimasi Total", `Rp ${(booking.estimated_total || 0).toLocaleString("id-ID")}`],
  ];

  if (booking.discount_amount > 0) {
    rows.push(["Diskon Referral", `-Rp ${(booking.discount_amount || 0).toLocaleString("id-ID")}`]);
  }
  if (booking.late_fee_total > 0) {
    rows.push(["Denda Terlambat", `+Rp ${(booking.late_fee_total || 0).toLocaleString("id-ID")}`]);
  }
  if (booking.refund_amount > 0) {
    rows.push(["Refund Cepat", `-Rp ${(booking.refund_amount || 0).toLocaleString("id-ID")}`]);
  }

  const finalTotal = (booking.estimated_total || 0) - (booking.discount_amount || 0) + (booking.late_fee_total || 0) - (booking.refund_amount || 0);
  rows.push(["Total Pembayaran", `Rp ${finalTotal.toLocaleString("id-ID")}`]);

  rows.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.text(`:  ${val}`, valueX, y);
    y += 8;
  });

  // Note
  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, 170, 32, 3, 3, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(234, 88, 12);
  doc.text("PENTING:", 25, y + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("1. Harap tunjukkan dokumen PDF/bukti ini saat mengantar kucing Anda.", 25, y + 16);
  doc.text("2. Untuk pembayaran offline (di tempat), silakan bayar di kasir saat check-in.", 25, y + 22);
  doc.text("3. Untuk pembayaran online, Anda dapat membayar melalui menu Detail Booking di aplikasi.", 25, y + 28);

  // Footer stamp
  y += 45;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dibuat otomatis oleh sistem NekoStay pada ${new Date().toLocaleString("id-ID")}`, 20, y);

  return Buffer.from(doc.output("arraybuffer"));
}
