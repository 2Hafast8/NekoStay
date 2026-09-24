/**
 * lib/utils/errors.js
 * Centralized, secure, and user-centric error formatting for NekoStay.
 *
 * Implements:
 * - backend-security-coder: Zero sensitive data leakage in production (OWASP A04/A05).
 * - ui-ux-pro-max: Empathetic, actionable, bilingual (ID/EN) user messages with tips.
 * - clean-code: DRY, declarative rules, single responsibility.
 */

export const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Rules for translating technical & security errors into user-friendly messages.
 */
export const ERROR_RULES = [
  // 1. CAPTCHA & BOT PROTECTION
  {
    pattern: /captcha.*(?:disallowed|no captcha_token|failed|invalid|missing)|no captcha_token|request disallowed/i,
    code: "CAPTCHA_REQUIRED",
    category: "security",
    id: {
      message: "Silakan selesaikan verifikasi keamanan (Captcha) terlebih dahulu.",
      tip: "Centang kotak verifikasi keamanan sebelum menekan tombol.",
    },
    en: {
      message: "Please complete the security verification (Captcha) before proceeding.",
      tip: "Check the security verification box before clicking submit.",
    },
    devHint:
      "Supabase Captcha Protection aktif di Supabase Dashboard namun tidak menerima token valid. Pastikan NEXT_PUBLIC_TURNSTILE_SITE_KEY diatur di .env.local dan widget Turnstile diverifikasi.",
  },
  {
    pattern: /captcha/i,
    code: "CAPTCHA_ERROR",
    category: "security",
    id: {
      message: "Verifikasi keamanan (Captcha) tidak valid atau kedaluwarsa. Silakan coba lagi.",
      tip: "Muat ulang halaman atau centang ulang kotak captcha jika tidak merespons.",
    },
    en: {
      message: "Security verification (Captcha) was invalid or has expired. Please try again.",
      tip: "Reload the page or re-verify the captcha box if it does not respond.",
    },
    devHint:
      "Periksa konfigurasi Cloudflare Turnstile / hCaptcha di Supabase Dashboard (Auth > Attack Protection) dan .env.local.",
  },

  // 2. AUTHENTICATION & CREDENTIALS
  {
    pattern: /invalid (?:login )?credentials|invalid_grant|invalid_credentials|invalid email or password|user not found/i,
    code: "INVALID_CREDENTIALS",
    category: "auth",
    id: {
      message: "Email atau password yang Anda masukkan tidak sesuai. Silakan periksa kembali.",
      tip: "Pastikan tombol Caps Lock mati dan tidak ada salah ketik pada alamat email.",
    },
    en: {
      message: "The email or password you entered is incorrect. Please try again.",
      tip: "Ensure Caps Lock is off and check for typos in your email address.",
    },
  },
  {
    pattern: /konfirmasi password tidak cocok|password.*not match|passwords do not match/i,
    code: "PASSWORD_MISMATCH",
    category: "warning",
    id: {
      message: "Konfirmasi kata sandi tidak cocok dengan kata sandi baru.",
      tip: "Ketik ulang kata sandi dan konfirmasi kata sandi dengan teliti.",
    },
    en: {
      message: "Password confirmation does not match.",
      tip: "Please retype both password fields carefully.",
    },
  },
  {
    pattern: /email not confirmed|email_not_confirmed/i,
    code: "EMAIL_NOT_CONFIRMED",
    category: "auth",
    id: {
      message: "Email Anda belum dikonfirmasi.",
      tip: "Silakan periksa kotak masuk atau folder spam email Anda untuk mengaktifkan akun.",
    },
    en: {
      message: "Your email address has not been confirmed yet.",
      tip: "Please check your inbox or spam folder to activate your account.",
    },
  },
  {
    pattern: /user already registered|email.*already in use|already registered/i,
    code: "USER_ALREADY_EXISTS",
    category: "auth",
    id: {
      message: "Alamat email ini sudah terdaftar.",
      tip: "Silakan masuk menggunakan akun Anda atau gunakan fitur 'Lupa Password' jika Anda lupa kata sandi.",
    },
    en: {
      message: "This email address is already registered.",
      tip: "Please log in using your account or use 'Forgot Password' if needed.",
    },
  },
  {
    pattern: /password.*(?:at least|short|weak|character|length)/i,
    code: "WEAK_PASSWORD",
    category: "auth",
    id: {
      message: "Password belum memenuhi kriteria keamanan (minimal 8 karakter).",
      tip: "Gunakan kombinasi huruf besar, huruf kecil, dan angka.",
    },
    en: {
      message: "Password does not meet security criteria (at least 8 characters).",
      tip: "Combine uppercase, lowercase letters, and numbers.",
    },
  },
  {
    pattern: /rate limit|too many requests|over_email_send_rate_limit|once every \d+ seconds/i,
    code: "RATE_LIMITED",
    category: "warning",
    id: {
      message: "Terlalu banyak percobaan dalam waktu singkat demi keamanan.",
      tip: "Harap tunggu 1-2 menit sebelum mencoba kembali.",
    },
    en: {
      message: "Too many attempts in a short period for your security.",
      tip: "Please wait 1-2 minutes before trying again.",
    },
  },
  {
    pattern: /token.*expired|otp_expired|jwt expired|auth session missing|session.*expired/i,
    code: "SESSION_EXPIRED",
    category: "auth",
    id: {
      message: "Sesi login atau tautan verifikasi telah kedaluwarsa.",
      tip: "Silakan minta tautan baru atau login kembali ke akun Anda.",
    },
    en: {
      message: "Your session or verification link has expired.",
      tip: "Please request a new link or log in again.",
    },
  },

  // 3. NETWORK & CONNECTION
  {
    pattern: /failed to fetch|networkerror|network error|fetch failed|timeout|connection refused/i,
    code: "NETWORK_ERROR",
    category: "network",
    id: {
      message: "Koneksi ke server terputus.",
      tip: "Pastikan perangkat Anda terhubung ke internet dan coba kembali.",
    },
    en: {
      message: "Connection to server was lost.",
      tip: "Ensure your device is connected to the internet and try again.",
    },
  },

  // 4. DATABASE & INTERNAL SENSITIVE STRINGS (Redact in production)
  {
    pattern: /duplicate key|violates unique constraint|23505/i,
    code: "DUPLICATE_DATA",
    category: "error",
    id: {
      message: "Data yang Anda masukkan sudah terdaftar dalam sistem.",
      tip: "Gunakan data unik lain atau periksa kembali isian formulir Anda.",
    },
    en: {
      message: "The entered data already exists in the system.",
      tip: "Please enter a unique value or check your entries.",
    },
    devHint: "Database unique constraint violation (PostgreSQL 23505).",
  },
  {
    pattern: /violates foreign key|foreign key constraint|23503/i,
    code: "REFERENCE_ERROR",
    category: "error",
    id: {
      message: "Data referensi terkait tidak ditemukan atau telah dihapus.",
      tip: "Muat ulang halaman untuk memperbarui data terkini.",
    },
    en: {
      message: "Referenced data was not found or has been removed.",
      tip: "Refresh the page to sync with latest data.",
    },
    devHint: "Database foreign key constraint violation (PostgreSQL 23503).",
  },
  {
    pattern: /generated column|428c9|syntax error|relation.*does not exist|column.*does not exist|pgrst/i,
    code: "DATABASE_INTERNAL_ERROR",
    category: "error",
    id: {
      message: "Terjadi kendala teknis pada sistem database.",
      tip: "Tim teknis kami telah mencatat kendala ini. Silakan coba beberapa saat lagi.",
    },
    en: {
      message: "A technical issue occurred with the system.",
      tip: "Our technical team has logged this issue. Please try again in a few moments.",
    },
    devHint: "PostgreSQL internal schema/syntax error. Periksa payload query Supabase.",
  },

  // 5. BOOKING, ROOM CAPACITY & DATES
  {
    pattern: /kamar penuh|kapasitas penuh|room.*full|capacity.*full|no available rooms|fully booked/i,
    code: "ROOM_CAPACITY_FULL",
    category: "warning",
    id: {
      message: "Kapasitas ruangan atau kamar untuk tipe ini sudah penuh pada tanggal yang dipilih.",
      tip: "Pilih tanggal lain atau pilih tipe ruangan/kelas kamar lain yang masih tersedia.",
    },
    en: {
      message: "The room capacity for this type is fully booked on the selected dates.",
      tip: "Please choose different dates or select another available room class.",
    },
  },
  {
    pattern: /check-?out.*after.*check-?in|tanggal.*keluar.*setelah.*masuk|invalid date range/i,
    code: "INVALID_DATE_RANGE",
    category: "warning",
    id: {
      message: "Rentang tanggal reservasi tidak valid.",
      tip: "Pastikan tanggal check-out minimal 1 hari setelah tanggal check-in dan bukan tanggal lampau.",
    },
    en: {
      message: "The reservation date range is invalid.",
      tip: "Ensure check-out date is at least 1 day after check-in and not in the past.",
    },
  },
  {
    pattern: /unauthorized|forbidden|tidak memiliki izin|permission denied|access denied/i,
    code: "FORBIDDEN_ACCESS",
    category: "security",
    id: {
      message: "Anda tidak memiliki akses untuk melakukan tindakan ini.",
      tip: "Pastikan Anda masuk dengan akun yang memiliki hak akses yang sesuai.",
    },
    en: {
      message: "You are not authorized to perform this action.",
      tip: "Ensure you are signed in with an account having proper permissions.",
    },
  },
  {
    pattern: /user.*disabled|account.*disabled|akun dinonaktifkan/i,
    code: "ACCOUNT_DISABLED",
    category: "security",
    id: {
      message: "Akun Anda saat ini dinonaktifkan.",
      tip: "Silakan hubungi tim dukungan NekoStay untuk verifikasi dan pemulihan akun.",
    },
    en: {
      message: "Your account is currently disabled.",
      tip: "Please contact NekoStay support for verification and recovery.",
    },
  },

  // 6. PAYMENT & SCANNER ERRORS
  {
    pattern: /token scan.*(?:tidak valid|kedaluwarsa|invalid|expired)|qr.*kedaluwarsa/i,
    code: "SCAN_TOKEN_INVALID",
    category: "warning",
    id: {
      message: "Kode QR pembayaran tidak valid atau telah kedaluwarsa.",
      tip: "Minta pelanggan untuk membuat ulang kode QR dari halaman rincian pesanan.",
    },
    en: {
      message: "Payment QR code is invalid or has expired.",
      tip: "Ask the customer to regenerate the QR code from their booking details page.",
    },
  },
  {
    pattern: /midtrans.*(?:error|fail|invalid)|transaksi gagal/i,
    code: "PAYMENT_GATEWAY_ERROR",
    category: "warning",
    id: {
      message: "Layanan pembayaran sedang mengalami kendala. Silakan coba lagi.",
      tip: "Pilih metode pembayaran lain atau hubungi admin jika saldo telah terpotong.",
    },
    en: {
      message: "Payment service is currently experiencing issues. Please try again.",
      tip: "Choose another payment method or contact admin if funds were deducted.",
    },
  },
];

/**
 * Menghasilkan struktur error ramah pengguna dengan tips mitigasi dan informasi debug mode dev.
 *
 * @param {Error|string|object} err - Objek error asli
 * @param {object} [options]
 * @param {"id"|"en"} [options.language="id"] - Bahasa antarmuka
 * @param {string} [options.fallback] - Pesan fallback khusus
 * @returns {{
 *   message: string,
 *   tip: string|null,
 *   code: string,
 *   category: "security"|"auth"|"network"|"warning"|"error",
 *   raw: string|null,
 *   devInfo: string|null
 * }}
 */
export function formatUserError(err, options = {}) {
  if (err && typeof err === "object" && err._isFormatted === true) {
    return err;
  }

  const language = options.language || "id";

  // Ekstraksi pesan mentah dari berbagai bentuk error (string, Error, Postgres/Supabase object, dsb)
  let rawMessage = "";
  if (typeof err === "string") {
    rawMessage = err;
  } else if (Array.isArray(err)) {
    rawMessage = err
      .map((item) => (typeof item === "string" ? item : item?.message || JSON.stringify(item)))
      .filter(Boolean)
      .join(", ");
  } else if (err && typeof err === "object") {
    rawMessage =
      err.message ||
      err.error_description ||
      (typeof err.error === "string" ? err.error : err.error?.message) ||
      err.details ||
      err.msg ||
      "";
  }

  const searchTarget = `${rawMessage} ${err?.code || ""}`.trim();

  if (!rawMessage || typeof rawMessage !== "string") {
    return {
      _isFormatted: true,
      message:
        options.fallback ||
        (language === "en"
          ? "An unexpected error occurred. Please try again."
          : "Terjadi kesalahan sistem. Silakan coba lagi."),
      tip: null,
      code: "UNKNOWN_ERROR",
      category: "error",
      raw: null,
      devInfo: null,
    };
  }

  // 1. Cek terhadap aturan terdaftar (cocokkan pesan dan/atau kode error)
  for (const rule of ERROR_RULES) {
    if (rule.pattern.test(searchTarget)) {
      const content = language === "en" ? rule.en : rule.id;
      return {
        _isFormatted: true,
        message: content.message,
        tip: content.tip || null,
        code: rule.code,
        category: rule.category,
        raw: rawMessage,
        devInfo: IS_DEV
          ? rule.devHint
            ? `${rule.devHint} [Raw: "${rawMessage}"]`
            : `Raw Error: "${rawMessage}"`
          : null,
      };
    }
  }

  // 2. Deteksi kebocoran internal (SQL, stack trace, server path, column, table)
  const isLikelySensitive =
    /sql|select\s+|insert\s+|update\s+|delete\s+|table\s+|column\s+|token|secret|stack|at\s+\w+|postgres|supabase|relation/i.test(
      searchTarget
    );

  if (isLikelySensitive && !IS_DEV) {
    return {
      _isFormatted: true,
      message:
        language === "en"
          ? "A technical system issue occurred. Please try again later."
          : "Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.",
      tip: null,
      code: "SENSITIVE_REDACTED",
      category: "error",
      raw: rawMessage,
      devInfo: null,
    };
  }

  // 3. Fallback pesan kustom
  return {
    _isFormatted: true,
    message: rawMessage,
    tip: null,
    code: "CUSTOM_ERROR",
    category: "error",
    raw: rawMessage,
    devInfo: IS_DEV ? `Raw Error: "${rawMessage}"` : null,
  };
}

/**
 * Helper ringkas untuk mendapatkan string pesan ramah pengguna saja.
 *
 * @param {Error|string|object} err
 * @param {"id"|"en"} [language="id"]
 * @returns {string}
 */
export function getUserFriendlyMessage(err, language = "id") {
  return formatUserError(err, { language }).message;
}

/**
 * Sanitasi pesan error server sebelum dikirimkan ke respon API klien.
 *
 * @param {string} rawMessage - Pesan mentah dari exception server
 * @param {number} status - HTTP status code
 * @returns {{ sanitizedMessage: string, debugInfo: object|null }}
 */
export function sanitizeApiError(rawMessage = "", status = 500) {
  const isSensitive =
    status >= 500 &&
    /sql|select|insert|update|delete|table|column|token|secret|postgres|supabase|relation|generated column|428c9|syntax error/i.test(
      rawMessage
    );

  if (isSensitive) {
    if (!IS_DEV) {
      return {
        sanitizedMessage: "Terjadi kendala teknis pada server. Silakan coba beberapa saat lagi.",
        debugInfo: null,
      };
    }
    return {
      sanitizedMessage: "Terjadi kendala teknis pada server. (Detail tersedia dalam mode dev)",
      debugInfo: { rawMessage },
    };
  }

  return {
    sanitizedMessage: rawMessage || "Terjadi kesalahan pada server",
    debugInfo: IS_DEV ? { rawMessage } : null,
  };
}
