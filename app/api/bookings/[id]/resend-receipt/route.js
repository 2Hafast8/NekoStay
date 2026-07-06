import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Cek sesi user & role (Hanya admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Ambil booking + profil user
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, profiles (full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    if (booking.status !== 'Aktif') {
      return NextResponse.json(
        { error: 'Hanya booking dengan status Aktif yang dapat mengirim ulang bukti pembayaran' },
        { status: 400 }
      );
    }

    // 3. Generate token baru jika belum ada, atau regenerate jika sudah expired/used
    let token = booking.offline_payment_token;
    const needsNewToken = !token || booking.offline_token_used;

    if (needsNewToken) {
      token = crypto.randomUUID();
      await supabase
        .from('bookings')
        .update({
          offline_payment_token: token,
          offline_token_created_at: new Date().toISOString(),
          offline_token_used: false,
        })
        .eq('id', id);

      // Update local booking object for PDF generation
      booking.offline_payment_token = token;
    } else {
      // Refresh the token timestamp for a fresh 24h window
      await supabase
        .from('bookings')
        .update({
          offline_token_created_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    // 4. Send email with PDF attachment containing QR code
    const userEmail = booking.profiles?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email user tidak ditemukan' }, { status: 400 });
    }

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
      message: `Bukti pemesanan dengan QR Code berhasil dikirim ulang ke ${userEmail}`,
    });

  } catch (error) {
    console.error('Resend receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengirim ulang bukti pemesanan' },
      { status: 500 }
    );
  }
}
