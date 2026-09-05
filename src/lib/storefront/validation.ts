export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'mail',
  'smtp',
  'ftp',
  'dashboard',
  'login',
  'signup',
  'auth',
  'store',
  'stores',
  'help',
  'support',
  'cdn',
  'static',
  'assets',
  'blog',
  'docs',
  'dev',
  'staging',
  'webhook',
  'webhooks',
  'status',
  'billing',
  'account',
  'accounts',
  'crm',
  'mkwacrm',
])

export const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/

export function validateSubdomain(raw: string): {
  valid: boolean
  reason?: string
  normalized: string
} {
  const normalized = (raw || '').trim().toLowerCase()

  if (!normalized) {
    return { valid: false, reason: 'اسم النطاق الفرعي مطلوب', normalized }
  }

  if (normalized.length < 3) {
    return { valid: false, reason: 'يجب ألا يقل اسم النطاق عن 3 أحرف', normalized }
  }

  if (normalized.length > 63) {
    return { valid: false, reason: 'يجب ألا يتجاوز اسم النطاق 63 حرفاً', normalized }
  }

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      valid: false,
      reason: 'يسمح فقط بالأحرف الإنجليزية الصغيرة والأرقام والشرطة (-) بشرط ألا تبدأ أو تنتهي بشرطة',
      normalized,
    }
  }

  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return {
      valid: false,
      reason: 'هذا الاسم محجوز للنظام ولا يمكن اختياره',
      normalized,
    }
  }

  return { valid: true, normalized }
}
