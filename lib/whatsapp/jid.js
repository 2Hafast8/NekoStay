/**
 * Resolves a target phone or ID into a valid WhatsApp JID.
 * Handles:
 * - Standard Phone Numbers (e.g. 0823..., 62823...) -> <phone>@s.whatsapp.net
 * - WhatsApp Linked Identity (LID) (e.g. 37486524936348) -> <id>@lid
 * - Existing JIDs (e.g. ...@s.whatsapp.net or ...@lid)
 * - Metadata overrides (e.g. metadata?.remote_jid)
 */
export function resolveRemoteJid(target, metadata = {}) {
  if (metadata?.remote_jid && String(metadata.remote_jid).includes("@")) {
    return String(metadata.remote_jid).trim();
  }

  const raw = String(target || "").trim();
  if (raw.includes("@")) {
    return raw;
  }

  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // WhatsApp LID (Linked Identity):
  // Typically 14-16 digits and do NOT start with country code '62'
  if (digits.length >= 14 && !digits.startsWith("62")) {
    return `${digits}@lid`;
  }

  let phone = digits;
  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  }

  return `${phone}@s.whatsapp.net`;
}

