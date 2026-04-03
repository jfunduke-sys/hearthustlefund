export function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isPlausiblePhoneDigits(digits: string) {
  return digits.length >= 10;
}

/** Device contact rows: must have enough digits to be a real phone (not email-only / empty). */
export function hasListablePhoneDigits(digits: string) {
  return digits.length >= 7;
}
