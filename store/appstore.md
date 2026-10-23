# App Store Connect — nội dung điền sẵn

## Thông tin app (App Information)
| Trường | Giá trị |
|---|---|
| Name (≤30) | Shift Calendar - Lịch Ca Làm |
| Subtitle (≤30) | Lịch ca, âm lịch, tính lương |
| Bundle ID | com.napigo.shiftcalendar |
| SKU | shiftcalendar-001 |
| Primary language | Vietnamese |
| Category | Productivity (phụ: Business) |
| Age rating | 4+ (trả lời "None" cho tất cả câu hỏi) |
| Price | Free |

## Promotional text (≤170)
Xếp ca nhanh, báo thức đi làm, tự tính công và lương OT. Có âm lịch và đầy đủ ngày lễ Việt Nam.

## Description
⚡ Shift Calendar — lịch ca làm việc cho công nhân nhà máy, kỹ sư vận hành, y tá, bảo vệ và mọi người làm theo ca.

📅 LỊCH CA THÔNG MINH
• Lịch tháng rõ ràng, tô màu cuối tuần
• Âm lịch Việt Nam ngay trong từng ô ngày
• Ngày lễ: Tết, Giỗ Tổ, 30/4, 1/5, Quốc khánh, Trung thu, Noel… và ngày lễ riêng
• Tự chia ca theo chu kỳ (2 ngày – 2 đêm – 2 nghỉ…) chỉ với 1 chạm

👷 CA LÀM TUỲ CHỈNH
• Ca ngày, ca đêm, tăng ca, nghỉ, nghỉ lễ, nghỉ ốm
• Đặt tên, màu, giờ làm, lương ca, lương OT cho từng ca

🔔 NHẮC GIỜ ĐI LÀM
• Thông báo trước giờ vào ca, có âm thanh
• Giờ nhắc riêng cho từng loại ca

📊 THỐNG KÊ & TÍNH LƯƠNG
• Tổng ngày công, giờ làm, giờ OT, số ca đêm
• Tính lương tự động: lương ca + OT + phụ cấp đêm
• Biểu đồ hiệu suất cả năm
• Xuất Excel bảng lương, bảng công, báo cáo tháng

👥 QUẢN LÝ NHIỀU NHÂN VIÊN
• Mỗi người một lịch riêng, lọc theo nhà máy / bộ phận

☁️ SAO LƯU ĐÁM MÂY (tuỳ chọn)
• Đăng nhập để sao lưu và khôi phục khi đổi máy

🌐 Tiếng Việt · English · 中文

## Keywords (≤100 ký tự, phân cách bằng dấu phẩy, không dấu cách)
lịch ca,chấm công,tính lương,âm lịch,ca đêm,tăng ca,OT,công nhân,shift,lịch làm việc

## URL bắt buộc
- Support URL: (trang web hoặc Google Sites/Notion công khai có email liên hệ)
- Privacy Policy URL: (bắt buộc — có thể dùng mẫu bên dưới, đăng lên Google Sites/Notion/GitHub Pages)

## App Privacy (Data collection)
- **Vị trí:** app gửi toạ độ (GPS hoặc thành phố đã chọn) tới Open-Meteo để lấy thời tiết → khai báo Location → Coarse Location — App Functionality — Not linked to user — No tracking. Nếu tắt ô thời tiết thì không gửi.
- Nếu **chưa bật Firebase** (và tắt thời tiết): chọn **"Data Not Collected"**.
- Nếu **bật Firebase**: khai báo
  - Contact Info → Email Address — App Functionality — Linked to user — No tracking
  - User Content → Other User Content (lịch ca sao lưu) — App Functionality — Linked to user — No tracking

## App Review Information
- Sign-in required: **No** (app dùng đầy đủ không cần đăng nhập; đăng nhập chỉ để sao lưu cloud).
- Notes: "All features work offline without an account. Cloud backup (Settings → Cloud sync) is optional; accounts can be deleted in-app at Settings → Cloud sync → Delete account."

## Ảnh chụp màn hình bắt buộc
- iPhone 6.9" (1320 × 2868) — tối thiểu 1, tối đa 10. Gợi ý 4 ảnh: Lịch ca, Tự chia ca, Thống kê, Cài đặt ca.
- iPad 13" (2064 × 2752): workflow chụp tự động (supportsTablet = true). App cũng chạy trên Mac Apple Silicon.

## Mẫu chính sách quyền riêng tư
> Shift Calendar lưu lịch ca, cài đặt và thông tin nhân viên trên thiết bị của bạn. Ứng dụng không thu thập dữ liệu cá nhân, không theo dõi người dùng và không chia sẻ dữ liệu cho bên thứ ba.
> Nếu bạn chủ động đăng nhập Sao lưu đám mây, email và bản sao lưu dữ liệu được lưu trên Google Firebase chỉ để phục vụ khôi phục dữ liệu. Bạn có thể xoá tài khoản và toàn bộ bản sao lưu bất cứ lúc nào trong Cài đặt → Đồng bộ đám mây → Xoá tài khoản.
> Liên hệ: <email của bạn>

## Gói đăng ký (In-App Purchases)
- Tạo 1 Subscription Group "Shift Calendar PRO" gồm: `pro_monthly` (1 tháng), `pro_yearly` (1 năm, Introductory Offer: dùng thử miễn phí 7 ngày).
- 1 Non-Consumable: `pro_lifetime`.
- Màn hình mua đã có: giá, chu kỳ, nút khôi phục giao dịch, link Điều khoản (EULA chuẩn của Apple) và Quyền riêng tư (điền `LEGAL.privacyUrl`).
- Trong phần mô tả App Store cần ghi rõ: giá, thời hạn gói, tự động gia hạn và cách huỷ.
- App Review Notes: "PRO can be tested with a Sandbox account. Restore Purchases is on the paywall (Settings → Upgrade to PRO)."
