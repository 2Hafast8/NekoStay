import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Missing required webhook fields' }, { status: 400 });
    }

    // 1. Verifikasi Signature Key Midtrans untuk keamanan
    // signature_key = SHA512(order_id + status_code + gross_amount + server_key)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const signatureSource = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const computedSignature = createHash('sha512').update(signatureSource).digest('hex');

    if (computedSignature !== signature_key) {
      console.error('Midtrans Webhook: Invalid Signature Key');
      return NextResponse.json({ error: 'Invalid signature key' }, { status: 400 });
    }

    // 2. Ekstrak Booking ID dari order_id (36 karakter pertama karena format UUID)
    const bookingId = order_id.substring(0, 36);

    // 3. Inisialisasi Supabase Admin Client dengan Service Role Key untuk melewati RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Periksa apakah booking valid
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, profiles(full_name)')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error(`Midtrans Webhook: Booking with ID ${bookingId} not found`);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 5. Tentukan status pembayaran baru berdasarkan Midtrans transaction_status
    let paymentStatus = 'Unpaid';
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'Paid';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'Failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'Unpaid';
    } else if (transaction_status === 'refund') {
      paymentStatus = 'Refunded';
    }

    // 6. Update status pembayaran di database
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ payment_status: paymentStatus })
      .eq('id', bookingId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Midtrans Webhook: Booking ${bookingId} updated payment_status to ${paymentStatus}`);

    // 7. Masukkan notifikasi in-app untuk pengguna
    let title = '';
    let message = '';
    let type = 'info'; // 'info' | 'warning' | 'success' | 'error'

    if (paymentStatus === 'Paid') {
      title = 'Pembayaran Online Berhasil';
      message = `Pembayaran online untuk penitipan ${booking.cat_name} telah berhasil kami terima. Terima kasih!`;
      type = 'success';
    } else if (paymentStatus === 'Failed') {
      title = 'Pembayaran Online Gagal';
      message = `Pembayaran online untuk penitipan ${booking.cat_name} gagal atau kedaluwarsa. Silakan coba lagi.`;
      type = 'error';
    } else if (paymentStatus === 'Refunded') {
      title = 'Pembayaran Di-refund';
      message = `Pembayaran untuk penitipan ${booking.cat_name} telah berhasil di-refund.`;
      type = 'info';
    }

    if (paymentStatus !== 'Unpaid') {
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          title,
          message,
          type,
          booking_id: bookingId,
          is_read: false
        });

      if (notifError) {
        console.warn('Failed to insert user notification from webhook:', notifError.message);
      }
    }

    return NextResponse.json({ success: true, paymentStatus });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
