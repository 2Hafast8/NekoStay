import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Cek sesi user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { bookingId } = body;
    if (!bookingId) {
      return NextResponse.json({ error: 'ID Booking wajib diisi' }, { status: 400 });
    }

    // 3. Ambil detail booking dan profile
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, profiles:user_id (full_name, email, phone)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // 4. Pastikan pesanan tidak dibatalkan
    if (booking.status === 'Dibatalkan') {
      return NextResponse.json(
        { error: 'Pesanan telah dibatalkan. Bukti pemesanan tidak tersedia.' },
        { status: 400 }
      );
    }

    // 5. Refresh token QR: generate baru jika belum ada/sudah dipakai, atau refresh 24 jam
    let token = booking.offline_payment_token;
    if (!token || booking.offline_token_used) {
      const crypto = await import('crypto');
      token = crypto.randomUUID();
      await supabase
        .from('bookings')
        .update({
          offline_payment_token: token,
          offline_token_created_at: new Date().toISOString(),
          offline_token_used: false,
        })
        .eq('id', bookingId);
      booking.offline_payment_token = token;
    } else {
      await supabase
        .from('bookings')
        .update({ offline_token_created_at: new Date().toISOString() })
        .eq('id', bookingId);
    }

    // 6. Generate QR Code Data URL untuk respons langsung di web
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const qrUrl = `${appUrl}/scan-verify?token=${token}`;
    let qrDataUrl = null;
    try {
      const QRCodeLib = await import('qrcode');
      const qrcode = QRCodeLib.default || QRCodeLib;
      qrDataUrl = await qrcode.toDataURL(qrUrl, { margin: 2, width: 320 });
    } catch (qrErr) {
      console.warn('[Send Receipt] QR generation warning:', qrErr.message);
    }

    // 7. Ambil email user & kirim PDF receipt via email
    const userEmail = booking.profiles?.email;
    if (userEmail) {
      const { sendBookingStatusUpdate } = await import('@/lib/email/resend');
      const sendResult = await sendBookingStatusUpdate(
        userEmail,
        booking.profiles.full_name,
        booking.cat_name,
        booking.id,
        booking.status || 'Aktif',
        booking
      );

      if (sendResult && sendResult.success === false) {
        return NextResponse.json(
          { error: `Gagal mengirim email: ${sendResult.error?.message || sendResult.error || 'Layanan email bermasalah'}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      token,
      qrDataUrl,
      qrUrl,
      message: 'Bukti pemesanan PDF telah dikirim ke email Anda dan kode QR siap digunakan'
    });

  } catch (error) {
    console.error('Send receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengirim bukti pemesanan' },
      { status: 500 }
    );
  }
}
