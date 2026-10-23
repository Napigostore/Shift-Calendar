// Lớp quảng cáo. Mặc định là no-op để app chạy được trong Expo Go.
// Bật AdMob thật (cần development build / APK):
//   1. npx expo install react-native-google-mobile-ads
//   2. Thêm plugin vào app.json:
//      ["react-native-google-mobile-ads", { "androidAppId": ADMOB.androidAppId, "iosAppId": ADMOB.iosAppId }]
//   3. Thay phần thân các hàm dưới đây bằng code trong khối ví dụ.
//
// Ví dụ:
//   import { InterstitialAd, RewardedAd, AppOpenAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
//   const inter = InterstitialAd.createForAdRequest(ADMOB.interstitial);
//   inter.addAdEventListener(AdEventType.LOADED, () => inter.show()); inter.load();

let opens = 0;
let actions = 0;
let enabled = true;

/** PRO = không quảng cáo. */
export function setAdsEnabled(v: boolean) {
  enabled = v;
}

/** Gọi khi mở app (App Open Ad). */
export async function showAppOpenAd(): Promise<void> {
  if (!enabled) return;
  opens++;
}

/** Interstitial: hiện sau mỗi N thao tác (VD: xuất file, tự chia ca). */
export async function maybeShowInterstitial(every = 3): Promise<void> {
  if (!enabled) return;
  actions++;
  if (actions % every !== 0) return;
}

/** Reward Ad: trả về true khi người dùng xem xong quảng cáo. */
export async function showRewarded(): Promise<boolean> {
  return true;
}

export const adStats = () => ({ opens, actions });
