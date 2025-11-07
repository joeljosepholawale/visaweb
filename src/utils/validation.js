// Validation utilities for form fields

export function validatePhone(value) {
  if (!value) return null
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length !== 11) {
    return 'Phone number must be exactly 11 digits'
  }
  return null
}

export function validateNIN(value) {
  if (!value) return null
  const cleaned = value.replace(/\s/g, '')
  // Nigerian NIN format: 11 digits only
  const ninPattern = /^\d{11}$/
  if (!ninPattern.test(cleaned)) {
    return 'NIN must be 11 digits (e.g., 12345678901)'
  }
  return null
}

export function validatePassportMatch(passport, confirm) {
  if (!passport || !confirm) return null
  if (passport !== confirm) {
    return 'Passport numbers do not match'
  }
  return null
}

export function validateNIDMatch(nid, confirm) {
  if (!nid || !confirm) return null
  if (nid !== confirm) {
    return 'Document numbers do not match'
  }
  return null
}

export function validateEmail(value) {
  if (!value) return null
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(value)) {
    return 'Please enter a valid email address'
  }
  return null
}

export function formatPhone(value) {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  return cleaned.slice(0, 11)
}

export function formatNIN(value) {
  if (!value) return ''
  // Nigerian NIN: allow only digits, max 11
  const cleaned = value.replace(/\D/g, '')
  return cleaned.slice(0, 11)
}

export function validatePhoneMatch(phone1, phone2) {
  if (!phone1 || !phone2) return null
  const clean1 = phone1.replace(/\D/g, '')
  const clean2 = phone2.replace(/\D/g, '')
  if (clean1 !== clean2) {
    return '❌ Phone numbers do not match. Please check and re-enter.'
  }
  return null
}

export function validateNINMatch(nin1, nin2) {
  if (!nin1 || !nin2) return null
  const clean1 = nin1.replace(/\s/g, '').toUpperCase()
  const clean2 = nin2.replace(/\s/g, '').toUpperCase()
  if (clean1 !== clean2) {
    return '❌ National ID numbers do not match. Please check and re-enter.'
  }
  return null
}
