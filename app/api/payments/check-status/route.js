import { NextResponse } from "next/server";
import { PaymentsService } from "@/lib/modules/payments/payments.service";

/**
 * POST /api/payments/check-status
 * Controller: Check transaction status directly against Midtrans REST API and sync DB
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { bookingId, orderId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "ID Booking wajib diisi" }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID wajib diisi untuk pengecekan status" },
        { status: 400 }
      );
    }

    const result = await PaymentsService.checkAndSyncStatus({ bookingId, orderId });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Check Payment Status Controller Error]:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memeriksa status pembayaran" },
      { status: error.status || 500 }
    );
  }
}
