import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const className = searchParams.get("class");
    const total = parseInt(searchParams.get("total") || "0", 10);

    if (!code) {
      return NextResponse.json({ valid: false, message: "Kode promo wajib diisi" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Query active promo code
    const { data: promos, error } = await adminDb
      .from("promos")
      .select("*")
      .ilike("code", code)
      .limit(1);

    const promo = promos && promos.length > 0 ? promos[0] : null;

    if (error || !promo) {
      return NextResponse.json({ valid: false, message: "Kode promo tidak ditemukan" });
    }

    if (!promo.is_active) {
      return NextResponse.json({ valid: false, message: "Kode promo ini sudah tidak aktif" });
    }

    // Check usage limit
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return NextResponse.json({ valid: false, message: "Kuota pemakaian kode promo telah habis" });
    }

    // Check minimum spend
    if (promo.min_spend && total < promo.min_spend) {
      return NextResponse.json({
        valid: false,
        message: `Minimal total transaksi untuk promo ini adalah Rp ${promo.min_spend.toLocaleString("id-ID")}`
      });
    }

    // Check applicable class rule
    if (promo.applicable_class && promo.applicable_class !== "all" && className) {
      if (promo.applicable_class.toLowerCase() !== className.toLowerCase()) {
        return NextResponse.json({
          valid: false,
          message: `Kode promo ini khusus berlaku untuk kelas ${promo.applicable_class}`
        });
      }
    }

    // Calculate discount value
    let discountAmount = 0;
    if (promo.discount_type === "percentage") {
      discountAmount = Math.floor((total * promo.discount_value) / 100);
      if (promo.max_discount && discountAmount > promo.max_discount) {
        discountAmount = promo.max_discount;
      }
    } else {
      discountAmount = promo.discount_value;
    }

    // Cap discount to total
    if (discountAmount > total) {
      discountAmount = total;
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      title: promo.title,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount,
      message: `Kode promo "${promo.title}" berhasil diterapkan! Diskon Rp ${discountAmount.toLocaleString("id-ID")}`
    });
  } catch (err) {
    console.error("Promo verify error:", err);
    return NextResponse.json({ valid: false, message: "Gagal memverifikasi kode promo" }, { status: 500 });
  }
}
