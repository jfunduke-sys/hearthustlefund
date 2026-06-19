/** Public store links — env override with live defaults for Twilio / participant comms. */
export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() ||
  "https://apps.apple.com/us/app/heart-hustle/id6763072369";

export const ANDROID_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL?.trim() ||
  "https://play.google.com/store/apps/details?id=com.hearthustlefund.app";
