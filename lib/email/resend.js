import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'NekoStay <onboarding@resend.dev>'

/**
 * Kirim email konfirmasi pemesanan ke user
 */
export async function sendBookingConfirmation(
  userEmail, userName, catName, bookingId, checkIn, checkOut, className, totalCost
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `✅ Pesanan Penitipan ${catName} Telah Diterima`,
      html: emailTemplate({
        title: 'Pesanan Berhasil Dibuat! 🐱',
        content: `
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Pesanan penitipan kucing <strong>${catName}</strong> Anda telah berhasil dibuat.</p>
          <table style="width:100%; border-collapse:collapse; margin:16px 0;">
            <tr><td style="padding:8px; border-bottom:1px solid #e2e8f0;">Kelas</td><td style="padding:8px; border-bottom:1px solid #e2e8f0; font-weight:bold;">${className}</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #e2e8f0;">Tanggal Masuk</td><td style="padding:8px; border-bottom:1px solid #e2e8f0;">${checkIn}</td></tr>
            <tr><td style="padding:8px; border-bottom:1px solid #e2e8f0;">Tanggal Keluar</td><td style="padding:8px; border-bottom:1px solid #e2e8f0;">${checkOut}</td></tr>
            <tr><td style="padding:8px;">Estimasi Biaya</td><td style="padding:8px; font-weight:bold; color:#f97316;">Rp ${totalCost.toLocaleString('id-ID')}</td></tr>
          </table>
          <p style="color:#64748b; font-size:14px;">💡 Pembayaran dilakukan saat pengantaran kucing ke lokasi kami.</p>
        `,
        buttonText: 'Lihat Detail Pesanan',
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}`,
      }),
    })
  } catch (error) {
    console.error('[Email Error] sendBookingConfirmation:', error)
  }
}

/**
 * Kirim email update status pesanan
 */
export async function sendBookingStatusUpdate(
  userEmail, userName, catName, bookingId, newStatus
) {
  const statusMessages = {
    'Aktif': `Pesanan penitipan <strong>${catName}</strong> Anda telah <strong style="color:#22c55e;">dikonfirmasi</strong>. Kucing Anda siap diantar ke NekoStay!`,
    'Selesai': `Penitipan <strong>${catName}</strong> telah <strong>selesai</strong>. Terima kasih telah mempercayakan kucing Anda kepada kami!`,
    'Dibatalkan': `Pesanan penitipan <strong>${catName}</strong> telah <strong style="color:#ef4444;">dibatalkan</strong>.`,
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Update Pesanan ${catName} — Status: ${newStatus}`,
      html: emailTemplate({
        title: `Status Pesanan: ${newStatus}`,
        content: `
          <p>Halo <strong>${userName}</strong>,</p>
          <p>${statusMessages[newStatus] || `Status pesanan berubah menjadi ${newStatus}.`}</p>
        `,
        buttonText: 'Lihat Detail Pesanan',
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}`,
      }),
    })
  } catch (error) {
    console.error('[Email Error] sendBookingStatusUpdate:', error)
  }
}

/**
 * Kirim email penolakan pesanan
 */
export async function sendBookingRejected(
  userEmail, userName, catName, bookingId, rejectReason
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `❌ Pesanan ${catName} Ditolak`,
      html: emailTemplate({
        title: 'Pesanan Ditolak 😿',
        content: `
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Mohon maaf, pesanan penitipan <strong>${catName}</strong> tidak dapat kami proses.</p>
          <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:12px; border-radius:4px; margin:16px 0;">
            <strong>Alasan Penolakan:</strong>
            <p style="margin:4px 0;">${rejectReason}</p>
          </div>
          <p>Silakan hubungi admin kami untuk informasi lebih lanjut.</p>
        `,
        buttonText: 'Lihat Detail',
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}`,
      }),
    })
  } catch (error) {
    console.error('[Email Error] sendBookingRejected:', error)
  }
}

/**
 * Kirim email laporan kondisi kucing
 */
export async function sendCatReport(
  userEmail, userName, catName, healthStatus, notes, photoUrl, reportDate, bookingId
) {
  const healthColor = {
    'Sehat': '#22c55e',
    'Kurang Fit': '#f59e0b',
    'Perlu Perhatian': '#ef4444',
  }[healthStatus] || '#64748b'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `🐾 Laporan Kondisi ${catName} — ${reportDate}`,
      html: emailTemplate({
        title: 'Laporan Kondisi Kucing 🐾',
        content: `
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Berikut laporan kondisi <strong>${catName}</strong> pada ${reportDate}:</p>
          <div style="background:${healthColor}15; border-left:4px solid ${healthColor}; padding:12px; border-radius:4px; margin:16px 0;">
            <strong>Status Kesehatan:</strong>
            <span style="color:${healthColor}; font-weight:bold; margin-left:8px;">${healthStatus}</span>
          </div>
          ${photoUrl ? `<img src="${photoUrl}" alt="Foto ${catName}" style="width:100%; max-width:400px; border-radius:8px; display:block; margin:16px auto;" />` : ''}
          ${notes ? `<div style="background:#f8fafc; padding:12px; border-radius:4px; margin:16px 0;"><strong>Catatan:</strong><p style="margin:4px 0;">${notes}</p></div>` : ''}
        `,
        buttonText: 'Lihat Detail Pesanan',
        buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}`,
      }),
    })
  } catch (error) {
    console.error('[Email Error] sendCatReport:', error)
  }
}

/**
 * Kirim email peringatan keterlambatan
 */
export async function sendLateWarning(userEmail, catName, lateDaysCount, additionalFee) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `⚠️ Peringatan Keterlambatan Pengambilan ${catName}`,
      html: emailTemplate({
        title: 'Peringatan Keterlambatan ⚠️',
        content: `
          <p>Kucing <strong>${catName}</strong> belum diambil selama <strong>${lateDaysCount} hari</strong> dari jadwal yang ditentukan.</p>
          <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
            <strong>Biaya tambahan hari ini:</strong>
            <span style="font-weight:bold; margin-left:8px;">Rp ${additionalFee.toLocaleString('id-ID')}</span>
          </div>
          <p>Mohon segera hubungi kami untuk mengambil kucing Anda.</p>
        `,
      }),
    })
  } catch (error) {
    console.error('[Email Error] sendLateWarning:', error)
  }
}

/**
 * Base email template
 */
function emailTemplate({ title, content, buttonText, buttonUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:0 auto; padding:0; background:#f8fafc;">
      <div style="background:linear-gradient(135deg, #f97316, #ea6c0d); padding:32px 20px; text-align:center; border-radius:0 0 16px 16px;">
        <h1 style="color:white; margin:0; font-size:28px;">🐱 NekoStay</h1>
        <p style="color:rgba(255,255,255,0.9); margin:8px 0 0; font-size:14px;">Penitipan Kucing Terpercaya</p>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#0f172a; margin:0 0 16px; font-size:22px;">${title}</h2>
        ${content}
        ${buttonText && buttonUrl ? `
          <div style="text-align:center; margin-top:24px;">
            <a href="${buttonUrl}" style="display:inline-block; background:#f97316; color:white; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">${buttonText}</a>
          </div>
        ` : ''}
      </div>
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:0 24px;" />
      <p style="color:#94a3b8; font-size:12px; text-align:center; padding:16px 24px;">
        NekoStay — Platform Penitipan Kucing Terpercaya<br/>
        Email ini dikirim otomatis, mohon jangan dibalas.
      </p>
    </body>
    </html>
  `
}

export default resend
