import { NextResponse } from "next/server";

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Status keberhasilan request
 * @property {T} [data] - Data payload respons
 * @property {string} [message] - Pesan informasi ramah pengguna
 * @property {string} [error] - Pesan kesalahan jika gagal
 * @property {Record<string, string[]>} [details] - Rincian error validasi form jika ada
 */

/**
 * Mengirimkan respons sukses JSON terstandarisasi.
 *
 * @template T
 * @param {T} [data=null] - Data yang ingin dikirimkan ke klien
 * @param {string} [message="Berhasil"] - Pesan sukses
 * @param {number} [status=200] - HTTP Status code (default 200)
 * @param {HeadersInit} [headers={}] - Custom headers tambahan
 * @returns {NextResponse<ApiResponse<T>>}
 */
export function apiSuccess(data = null, message = "Berhasil", status = 200, headers = {}) {
  const payload = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    if (typeof data === "object" && !Array.isArray(data)) {
      Object.assign(payload, data);
    } else {
      payload.data = data;
    }
  }

  return NextResponse.json(payload, { status, headers });
}

/**
 * Mengirimkan respons error JSON terstandarisasi.
 *
 * @param {string} [message="Terjadi kesalahan pada server"] - Pesan error
 * @param {number} [status=500] - HTTP Status code
 * @param {Record<string, string[]>} [details=null] - Detail error validasi
 * @returns {NextResponse<ApiResponse<null>>}
 */
export function apiError(message = "Terjadi kesalahan pada server", status = 500, details = null) {
  const payload = {
    success: false,
    error: message,
  };

  if (details) {
    payload.details = details;
  }

  return NextResponse.json(payload, { status });
}

/**
 * Respons 400 Bad Request
 * @param {string} [message="Permintaan tidak valid"]
 * @param {Record<string, string[]>} [details=null]
 */
export function apiBadRequest(message = "Permintaan tidak valid", details = null) {
  return apiError(message, 400, details);
}

/**
 * Respons 401 Unauthorized (Belum login / token tidak valid)
 * @param {string} [message="Autentikasi diperlukan. Silakan login terlebih dahulu."]
 */
export function apiUnauthorized(message = "Autentikasi diperlukan. Silakan login terlebih dahulu.") {
  return apiError(message, 401);
}

/**
 * Respons 403 Forbidden (Tidak memiliki hak akses / role tidak sesuai)
 * @param {string} [message="Akses ditolak. Anda tidak memiliki izin untuk tindakan ini."]
 */
export function apiForbidden(message = "Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.") {
  return apiError(message, 403);
}

/**
 * Respons 404 Not Found (Data tidak ditemukan)
 * @param {string} [message="Data tidak ditemukan"]
 */
export function apiNotFound(message = "Data tidak ditemukan") {
  return apiError(message, 404);
}

/**
 * Respons 422 / 400 Validation Error dari Zod
 * @param {import("zod").ZodError} zodError
 */
export function apiValidationError(zodError) {
  const flattened = zodError.flatten();
  const firstError = zodError.errors?.[0]?.message || "Validasi input gagal";
  return NextResponse.json(
    {
      success: false,
      error: firstError,
      details: flattened.fieldErrors,
    },
    { status: 400 }
  );
}

