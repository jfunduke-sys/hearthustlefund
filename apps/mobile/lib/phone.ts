export function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function isPlausiblePhoneDigits(digits: string) {
  return digits.length >= 10;
}
