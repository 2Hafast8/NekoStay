import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generatePDFBuffer } from '@/lib/email/resend';

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 1. Fetch booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, profiles:user_id (full_name, email, phone)')
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const userName = booking.profiles?.full_name || 'Pelanggan NekoStay';
    const pdfBuffer = await generatePDFBuffer(booking, userName);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Bukti_Pemesanan_${id.substring(0, 8)}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Download receipt error:', error);
    return NextResponse.json({ error: 'Gagal memuat struk PDF' }, { status: 500 });
  }
}
