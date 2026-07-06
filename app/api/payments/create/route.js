import midtransClient from 'midtrans-client';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
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

    // 4. Cek apakah sudah lunas
    if (booking.payment_status === 'Paid') {
      return NextResponse.json({ error: 'Pesanan ini sudah lunas' }, { status: 400 });
    }

    // 5. Inisialisasi Midtrans Snap Client
    //    Gunakan env variable MIDTRANS_IS_PRODUCTION untuk menentukan mode (default: sandbox)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
    });

    // 6. Hitung nominal pembayaran akhir
    const finalAmount = 
      booking.estimated_total - 
      (booking.discount_amount || 0) + 
      (booking.late_fee_total || 0) - 
      (booking.refund_amount || 0);

    if (finalAmount <= 0) {
      return NextResponse.json({ error: 'Total nominal pembayaran tidak valid' }, { status: 400 });
    }

    // Gunakan order_id unik dengan timestamp untuk menghindari error Duplicated Order ID di Midtrans
    const orderId = `${booking.id}-${Date.now()}`;

    // 7. Siapkan parameter Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount
      },
      customer_details: {
        first_name: booking.profiles?.full_name || 'Customer',
        email: booking.profiles?.email || user.email,
        phone: booking.profiles?.phone || ''
      },
      item_details: [
        {
          id: booking.class,
          price: finalAmount,
          quantity: 1,
          name: `NekoStay: Kelas ${booking.class} (${booking.cat_name})`
        }
      ],
      // Callback URLs: redirect kembali ke halaman booking detail setelah selesai
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/${bookingId}?payment=finish&order_id=${orderId}`,
        unfinish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/${bookingId}?payment=unfinish&order_id=${orderId}`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/${bookingId}?payment=error&order_id=${orderId}`
      }
    };

    // 8. Buat transaksi Snap di Midtrans
    const transaction = await snap.createTransaction(parameter);

    if (!transaction || !transaction.token) {
      throw new Error('Gagal mendapatkan token transaksi dari Midtrans');
    }

    // 9. Simpan token & orderId ke database Supabase menggunakan Admin Client (bypass RLS)
    //    karena role user biasa tidak diizinkan untuk update token pembayaran
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_token: transaction.token,
        payment_link_url: orderId
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking payment token:', updateError);
    }

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId
    });

  } catch (error) {
    console.error('Create payment token error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pembayaran online' },
      { status: 500 }
    );
  }
}
