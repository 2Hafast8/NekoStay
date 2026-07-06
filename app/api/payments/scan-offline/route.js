import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Parse request body
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token pembayaran wajib disertakan' }, { status: 400 });
    }

    // Validasi format UUID sederhana
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return NextResponse.json({ error: 'Format token tidak valid' }, { status: 400 });
    }

    // 2. Inisialisasi Supabase Admin Client (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Cari booking berdasarkan token
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, profiles (full_name, email)')
      .eq('offline_payment_token', token)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Kode QR tidak dikenali atau salah' }, { status: 404 });
    }

    // 4. Cek satu kali pakai (one-time use)
    if (booking.offline_token_used) {
      return NextResponse.json({
        error: 'Kode QR sudah pernah digunakan sebelumnya. Pembayaran untuk pesanan ini telah selesai.'
      }, { status: 400 });
    }

    // 5. Cek batas waktu 24 jam
    const createdTime = new Date(booking.offline_token_created_at).getTime();
    const currentTime = Date.now();
    const diffHours = (currentTime - createdTime) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return NextResponse.json({
        error: 'Kode QR telah kedaluwarsa. Masa berlaku kode QR bukti pemesanan hanya 24 jam dari waktu persetujuan admin.'
      }, { status: 400 });
    }

    // 6. Update status pembayaran menjadi lunas dan tandai token telah digunakan
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'Paid',
        offline_token_used: true
      })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    // 7. Kirim notifikasi in-app sukses ke pengguna
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        title: 'Pembayaran Offline Berhasil',
        message: `Terima kasih! Pembayaran offline (di tempat) untuk penitipan ${booking.cat_name} telah kami terima dan diverifikasi.`,
        type: 'success',
        booking_id: booking.id,
        is_read: false
      });
    } catch (notifErr) {
      console.warn('Notification insert failed:', notifErr.message);
    }

    // Hitung total akhir pembayaran
    const finalTotal = (booking.estimated_total || 0) - (booking.discount_amount || 0) + (booking.late_fee_total || 0) - (booking.refund_amount || 0);

    return NextResponse.json({
      success: true,
      message: 'Pembayaran offline berhasil diproses dan diverifikasi',
      booking: {
        id: booking.id,
        catName: booking.cat_name,
        customerName: booking.profiles?.full_name || 'Pelanggan',
        amount: finalTotal
      }
    });

  } catch (error) {
    console.error('Scan offline payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses verifikasi scan pembayaran offline' },
      { status: 500 }
    );
  }
}
