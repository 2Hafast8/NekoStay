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
      .select('*, profiles (full_name, email, phone)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // 4. Pastikan pesanan sudah disetujui admin (status Aktif atau Selesai)
    if (booking.status === 'Menunggu' || booking.status === 'Dibatalkan') {
      return NextResponse.json(
        { error: 'Pesanan belum disetujui admin. Bukti pemesanan hanya tersedia setelah pesanan aktif.' },
        { status: 400 }
      );
    }

    // 5. Refresh token QR: generate baru jika belum ada/sudah dipakai, atau refresh 24 jam
    if (!booking.offline_payment_token || booking.offline_token_used) {
      const crypto = await import('crypto');
      const newToken = crypto.randomUUID();
      await supabase
        .from('bookings')
        .update({
          offline_payment_token: newToken,
          offline_token_created_at: new Date().toISOString(),
          offline_token_used: false,
        })
        .eq('id', bookingId);
      booking.offline_payment_token = newToken;
    } else {
      await supabase
        .from('bookings')
        .update({ offline_token_created_at: new Date().toISOString() })
        .eq('id', bookingId);
    }

    // 6. Ambil email user
    const userEmail = booking.profiles?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email pengguna tidak ditemukan' }, { status: 400 });
    }

    // 7. Generate dan kirim PDF receipt via email
    const { sendBookingStatusUpdate } = await import('@/lib/email/resend');
    await sendBookingStatusUpdate(
      userEmail,
      booking.profiles.full_name,
      booking.cat_name,
      booking.id,
      'Aktif',
      booking
    );

    return NextResponse.json({
      success: true,
      message: 'Bukti pemesanan PDF telah dikirim ke email Anda'
    });

  } catch (error) {
    console.error('Send receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengirim bukti pemesanan' },
      { status: 500 }
    );
  }
}
