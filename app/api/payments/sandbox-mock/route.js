import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (isProduction) {
      return NextResponse.json({ error: 'Not allowed in production mode' }, { status: 403 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch booking details first
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('user_id, cat_name, payment_status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only update if not already Paid
    if (booking.payment_status !== 'Paid') {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status: 'Paid' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Insert success notification
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        title: 'Simulasi Pembayaran Berhasil',
        message: `Pembayaran online (Sandbox) untuk penitipan ${booking.cat_name} telah berhasil disimulasikan secara otomatis.`,
        type: 'success',
        booking_id: bookingId,
        is_read: false
      }).catch(err => console.warn('Notification insert failed:', err.message));
    }

    return NextResponse.json({ success: true, paymentStatus: 'Paid' });
  } catch (error) {
    console.error('Sandbox mock pay error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses simulasi pembayaran' },
      { status: 500 }
    );
  }
}
