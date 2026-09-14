import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId, orderId } = body;
    if (!bookingId) {
      return NextResponse.json({ error: 'ID Booking wajib diisi' }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi untuk pengecekan status' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, cat_name, payment_status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (booking.payment_status === 'Paid') {
      return NextResponse.json({ success: true, paymentStatus: 'Paid', alreadyPaid: true });
    }

    // Direct Midtrans REST API verification: GET /v2/{order_id}/status
    const baseUrl = isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    const authString = Buffer.from(`${serverKey}:`).toString('base64');

    let transactionData;
    try {
      const midtransRes = await fetch(`${baseUrl}/v2/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        signal: AbortSignal.timeout(10000),
      });

      transactionData = await midtransRes.json();

      // Midtrans returns HTTP 200 with status_code "404" if the transaction was not yet initiated
      if (transactionData.status_code === '404' || transactionData.status_message === "Transaction doesn't exist.") {
        return NextResponse.json({
          success: true,
          paymentStatus: booking.payment_status,
          message: 'Transaksi belum ditemukan di Midtrans (belum dibayar)'
        });
      }

      if (!midtransRes.ok) {
        console.error('Midtrans status API error:', transactionData);
        return NextResponse.json(
          { error: 'Gagal mengecek status transaksi ke Midtrans' },
          { status: 502 }
        );
      }
    } catch (fetchErr) {
      console.error('Midtrans fetch error:', fetchErr);
      return NextResponse.json(
        { error: 'Gagal menghubungi server Midtrans', paymentStatus: booking.payment_status },
        { status: 502 }
      );
    }

    const { transaction_status, fraud_status } = transactionData;
    let paymentStatus = 'Unpaid';

    if (transaction_status === 'capture') {
      // Capture hanya untuk kartu kredit: evaluasi fraud_status
      paymentStatus = fraud_status === 'accept' ? 'Paid' : 'Failed';
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'Paid';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'Failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'Unpaid';
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      paymentStatus = 'Refunded';
    }

    if (paymentStatus !== booking.payment_status) {
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({ payment_status: paymentStatus })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to update payment_status:', updateError);
      }

      if (paymentStatus === 'Paid' || paymentStatus === 'Failed' || paymentStatus === 'Refunded') {
        let title = '';
        let message = '';
        let type = 'info';

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

        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: booking.user_id,
            title,
            message,
            type,
            booking_id: bookingId,
            is_read: false
          });
        } catch (notifErr) {
          console.warn('Notification insert failed:', notifErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus,
      transactionStatus: transaction_status,
      changed: paymentStatus !== booking.payment_status
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memeriksa status pembayaran' },
      { status: 500 }
    );
  }
}
