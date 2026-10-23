# ⚡ Shift Calendar

App lịch ca làm việc phong cách công nghiệp (dark / xanh điện / cam cảnh báo) — Expo SDK 58 + React Native + TypeScript. Chạy Android, iOS và web.

## Chạy thử

```bash
npm install
npx expo start          # quét QR bằng Expo Go
npx expo start --web    # xem nhanh trên trình duyệt
```

## Tính năng đã có

| Nhóm | Chi tiết |
|---|---|
| 📅 Lịch tháng | Chuyển tháng, highlight cuối tuần, ngày hôm nay, chọn T2/CN đầu tuần, kiểu Đầy đủ/Gọn |
| 🌙 Âm lịch | Thuật toán Hồ Ngọc Đức (GMT+7), ngày âm nhỏ mờ trong ô, can chi năm, tháng nhuận |
| 🎉 Ngày lễ | Tết Dương, Giao thừa, Mùng 1–4 Tết, Giỗ Tổ 10/3 ÂL, 30/4, 1/5, 2/9, Trung thu, Noel… + ngày lễ riêng (dương/âm) |
| 👷 Ca làm | Day / Night / OT / Off / Holiday / Sick + tạo ca mới: tên, ký hiệu, màu, giờ, số giờ, lương ca, lương OT/giờ, ghi chú, báo thức |
| 🖌 Nhập nhanh | Chọn “cọ” ca rồi chạm các ngày; hoặc chạm 1 ngày để chọn nhiều ca, giờ OT, ghi chú |
| 🤖 Tự chia ca | Chu kỳ 2D-2N-2O, 3-3-3, D-N-O-O, 4D-4O hoặc tự ghép; lịch hành chính T2–T6; tự đánh dấu ngày lễ; 1/3/6 tháng |
| 🔔 Báo thức | Thông báo thật qua `expo-notifications`, kênh Android ưu tiên MAX + âm thanh + rung, `alarmClock` (không bị trì hoãn), giờ báo riêng từng ca, tự lên lịch 30 ngày tới |
| 📊 Thống kê | Tháng: ngày làm, giờ làm, OT, ca đêm, nghỉ, ốm. Năm: tổng công, tổng lương, biểu đồ hiệu suất 12 tháng |
| 💰 Lương | Lương từng ca + OT theo giờ + phụ cấp ca đêm; ngày nhận lương (💰 trên lịch) |
| 📤 Excel | Bảng lương, bảng công, báo cáo tháng (.xlsx) — 1 người hoặc toàn bộ nhân viên, chia sẻ qua Zalo/Gmail/Drive |
| 👥 Nhân viên | Thêm/sửa/xoá, mỗi người lịch riêng, bộ lọc nhân viên, lọc theo nhà máy (Multi factory) |
| ☁️ Cloud | Firebase Auth email/password + Realtime Database qua REST (chạy được trong Expo Go), sao lưu/khôi phục, xuất file JSON |
| ⚙️ Cài đặt | Ca, Lịch, Lương, Giao diện (dark/light, 4 màu nhấn, icon lễ), Widget, Hệ thống (Việt/English/中文, định dạng ngày, 12/24h, xoay màn hình) |
| 💾 Dữ liệu | Lưu local bằng AsyncStorage |

## Cấu hình cần làm

### Firebase (Cloud Sync)
1. Tạo project tại console.firebase.google.com → bật **Authentication → Email/Password**.
2. Tạo **Realtime Database**, đặt rules:
   ```json
   { "rules": { "users": { "$uid": { ".read": "$uid === auth.uid", ".write": "$uid === auth.uid" } } } }
   ```
3. Điền `apiKey` và `databaseURL` vào [`src/config.ts`](src/config.ts).

### Đăng nhập Apple / Google
1. Firebase → Authentication → Sign-in method: bật **Apple** và **Google**.
2. Google: tạo OAuth Client ID (Web, iOS bundle `com.napigo.shiftcalendar`, Android package + SHA-1 lấy từ `eas credentials`) rồi điền vào `GOOGLE` trong [`src/config.ts`](src/config.ts). Chưa điền thì nút Google hiện mờ và báo chưa cấu hình.
3. Apple: chỉ cần bản build iOS (đã bật `usesAppleSignIn` trong `app.json`); nút chỉ hiện trên iPhone/iPad.

### Thời tiết, thuỷ triều, con nước
Dùng Open-Meteo (miễn phí, không cần khoá). Vị trí lấy từ GPS hoặc thành phố chọn trong Cài đặt → Thời tiết. Con nước và pha trăng tính offline từ âm lịch.

### Gói PRO (RevenueCat)
| | Miễn phí | PRO |
|---|---|---|
| Quảng cáo | Có | Không |
| Loại ca / nhân viên / kỳ nghỉ | 8 / 2 / 2 | Không giới hạn |
| Thống kê năm, mục tiêu thu nhập | — | ✓ |
| Xuất Excel, PDF, lịch .ics (Google/Apple Calendar) | — | ✓ |
| Sao lưu cloud | — | ✓ |
| Thuỷ triều, cảnh báo bão, chủ đề màu, toàn bộ sticker, tự chia ca 3–6 tháng | — | ✓ |

Thiết lập:
1. Tạo 3 sản phẩm trên App Store Connect và Google Play: gói tháng, gói năm (dùng thử 7 ngày) và gói trọn đời.
2. Tại app.revenuecat.com: thêm các sản phẩm, gắn vào entitlement `pro`, tạo offering mặc định gồm các gói Monthly / Annual / Lifetime.
3. Điền `iosApiKey`, `androidApiKey` vào `REVENUECAT` và `privacyUrl` vào `LEGAL` trong [`src/config.ts`](src/config.ts).
4. Cần bản build (EAS); Expo Go không mua được. Khi đang phát triển, màn hình mua có nút "DEV: bật PRO để thử".

Giới hạn bản miễn phí nằm trong [`src/pro.ts`](src/pro.ts).

### Quảng cáo AdMob
[`src/services/ads.ts`](src/services/ads.ts) đang là bản no-op (đã gọi sẵn ở: mở app, sau khi xuất file, sau khi tự chia ca). Để bật thật:
```bash
npx expo install react-native-google-mobile-ads
```
Thêm plugin vào `app.json` với App ID trong `src/config.ts` (đang dùng ID test của Google), rồi thay thân các hàm trong `ads.ts`. Quảng cáo chỉ chạy trên bản build (APK/AAB), không chạy trong Expo Go.

### Widget màn hình chính
Phần cài đặt + xem trước widget đã có (Cài đặt → Widget). Widget Android thật cần thư viện native, ví dụ:
```bash
npx expo install react-native-android-widget
```
rồi render lại giao diện từ `src/components/WidgetPreview.tsx` theo API của thư viện.

## Build & phát hành CH Play

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview      # APK để cài thử
eas build -p android --profile production   # AAB để upload CH Play
eas submit -p android --profile production  # cần play-service-account.json
```

Package: `com.napigo.shiftcalendar` (đổi trong `app.json` nếu cần). Nội dung trang CH Play: [`store/metadata.md`](store/metadata.md).

## Cấu trúc

```
App.tsx                     # khung app, tab bar, lên lịch báo thức, khoá xoay màn hình
src/
  store.tsx                 # state + lưu AsyncStorage
  types.ts, defaults.ts     # kiểu dữ liệu, ca mặc định
  lunar.ts, holidays.ts     # âm lịch, ngày lễ
  stats.ts                  # tính công / lương
  i18n.ts, theme.ts, utils.ts
  services/                 # notifications, export (xlsx), cloud (Firebase), ads
  components/               # ui, DayEditor, AutoSchedule, ShiftEditor, HolidayEditor, WidgetPreview
  screens/                  # Calendar, Stats, Staff, Settings
```

## Lộ trình nâng cao
Chấm công GPS (`expo-location`), Face ID check-in (`expo-local-authentication`), đồng bộ Google Calendar (`expo-calendar`), báo cáo PDF (`expo-print`), dashboard quản lý nhân sự.
