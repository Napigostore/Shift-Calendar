// Điền thông tin dự án Firebase của bạn (Firebase Console → Project settings → General).
// Bật Authentication → Email/Password và tạo Realtime Database.
// Rules gợi ý cho Realtime Database:
// { "rules": { "users": { "$uid": { ".read": "$uid === auth.uid", ".write": "$uid === auth.uid" } } } }
export const FIREBASE = {
  apiKey: '',
  databaseURL: '', // VD: https://shift-calendar-default-rtdb.asia-southeast1.firebasedatabase.app
};

// Đăng nhập Google: tạo OAuth Client ID tại console.cloud.google.com (cùng project Firebase)
// — loại Web, iOS (bundle com.napigo.shiftcalendar) và Android (package + SHA-1 từ `eas credentials`).
// Bật provider Google và Apple trong Firebase → Authentication → Sign-in method.
export const GOOGLE = {
  webClientId: '',
  iosClientId: '',
  androidClientId: '',
};

// Gói PRO qua RevenueCat (app.revenuecat.com): tạo sản phẩm trên App Store Connect / Google Play,
// gắn vào entitlement "pro" và offering mặc định gồm 3 gói: Monthly, Annual, Lifetime.
export const REVENUECAT = {
  iosApiKey: '',
  androidApiKey: '',
  entitlement: 'pro',
};

// Đường dẫn pháp lý hiển thị trên màn hình mua PRO (Apple bắt buộc có).
export const LEGAL = {
  termsUrl: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  privacyUrl: 'https://napigostore.github.io/Shift-Calendar/docs/privacy.html',
};

// AdMob — đang dùng ID test của Google. Thay bằng ID thật trước khi phát hành.
export const ADMOB = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
};
