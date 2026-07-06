import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
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
      return NextResponse.json({ error: 'Hanya Administrator yang diizinkan mengubah status pembayaran' }, { status: 403 });
    }

    // 2. Parse request body
    const { paymentStatus } = await request.json();
    const validStatuses = ['Unpaid', 'Paid', 'Failed', 'Refunded'];

    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return NextResponse.json({
        error: `Status pembayaran tidak valid. Pilihan: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // 3. Ambil booking saat ini
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, profiles (full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
    }

    // 4. Update payment_status & sinkronkan offline token jika perlu
    const updateData = { payment_status: paymentStatus };

    if (paymentStatus === 'Paid' && booking.offline_payment_token) {
      updateData.offline_token_used = true;
    } else if (paymentStatus === 'Unpaid' && booking.offline_payment_token) {
      updateData.offline_token_used = false;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Kirim notifikasi in-app ke pemilik kucing
    const statusLabels = {
      'Unpaid': 'Belum Dibayar',
      'Paid': 'Lunas',
      'Failed': 'Gagal',
      'Refunded': 'Dikembalikan',
    };

    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Status Pembayaran Diperbarui',
      message: `Status pembayaran untuk penitipan ${booking.cat_name} telah diperbarui menjadi "${statusLabels[paymentStatus]}" oleh admin.`,
      type: paymentStatus === 'Paid' ? 'success' : 'info',
      booking_id: booking.id,
      is_read: false,
    }).catch(err => console.warn('Notification insert failed:', err.message));

    return NextResponse.json({
      success: true,
      message: `Status pembayaran berhasil diubah menjadi "${statusLabels[paymentStatus]}"`,
      booking: updatedBooking,
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui status pembayaran' },
      { status: 500 }
    );
  }
}
