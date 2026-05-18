/**
 * Format angka ke format Rupiah Indonesia
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0'
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Format nomor telepon untuk display
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '-'
  return phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
}

/**
 * Generate WhatsApp link with pre-filled message
 * @param {string} phone - nomor WA format 628xxx
 * @param {string} message - pesan template
 * @returns {string}
 */
export function getWhatsAppLink(phone, message = '') {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encodedMessage}`
}
