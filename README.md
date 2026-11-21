# Memelis' RPG ~Nữ Thánh, Gacha và Hầm Ngục Nguy Hiểm~ (Cute, Broke, and Dungeon Bound)

Phiên bản **Việt Hóa 100% Toàn Diện**, đã sửa toàn bộ lỗi crash trên Web & Di Động, hỗ trợ chơi trực tiếp trên **Android (JoiPlay / APK)**, **iOS (Safari PWA)** và **Windows PC**.

---

## 🎮 1. Giới Thiệu & Các Điểm Nổi Bật Của Bản Port / Mod

- **Dịch Thuật 100% Tiếng Việt:**
  - Toàn bộ 99 bản đồ, cốt truyện chính, nhiệm vụ phụ, sự kiện H, lời thoại NPC và hệ thống Gacha.
  - Toàn bộ Database (Vật phẩm, Trang bị, Kỹ năng, Trạng thái, Kẻ địch, Hệ thống).
  - Tối ưu bảng trạng thái trinh tiết / dâm loạn (CBR EroStatus) bằng tiếng Việt hoàn chỉnh.
  - Hệ thống hiển thị Unicode mượt mà với font `Segoe UI` chuẩn không lỗi dấu.
- **Sửa Lỗi Tương Thích Mobile / Web:**
  - Đã khắc phục triệt để lỗi crash `ReferenceError: require is not defined` trong `Wataridori_AddFileSystem.js` khi chạy trên trình duyệt Web, WebView di động hoặc JoiPlay.
  - Khắc phục xung đột crash giữa `Mano_InputConfig` và `Mano2_InputConfig`.
- **Auto-Mod & Bonus Có Sẵn:**
  - Tự động bảo lưu vàng tối thiểu 99,999.
  - Mở khóa phòng kỷ niệm (Memory Room) và toàn bộ hoạt cảnh hồi tưởng.

---

## 📱 2. Hướng Dẫn Chơi Trên Android (Khuyên Dùng: JoiPlay)

Game được phát triển trên RPG Maker MV (HTML5 / WebGL) nên tương thích hoàn hảo 100% với **JoiPlay**:

1. **Cài đặt ứng dụng:**
   - Tải và cài đặt **JoiPlay** cùng **RPG Maker Plugin for JoiPlay** (từ Google Play hoặc trang chủ JoiPlay).
2. **Chép Game vào Điện Thoại:**
   - Sao chép toàn bộ thư mục game vào bộ nhớ điện thoại (ví dụ: `Download/MemelisRPG`).
3. **Thêm Game vào JoiPlay:**
   - Mở ứng dụng JoiPlay, nhấn nút **`+`** (Thêm game).
   - Đặt tên: `Memelis RPG Tiếng Việt`.
   - Mục **Executable File**: Chọn đến file `Game.exe` hoặc `www/index.html`.
   - Mục Icon: Chọn `www/icon/icon.png`.
   - Nhấn **Choose** -> **Add**.
4. **Khởi chạy:**
   - Bấm vào icon game trên JoiPlay để vào chơi ngay với 60 FPS, đầy đủ âm thanh và cụm nút ảo trên màn hình!

---

## 🍎 3. Hướng Dẫn Chơi Trên iPhone / iPad (iOS)

Game chạy mượt mà trên Safari iOS thông qua tính năng **PWA (Progressive Web App)**:

1. Chạy máy chủ nội bộ trên máy tính (dùng script `server.ps1` hoặc `npx http-server www -p 8080`).
2. Mở trình duyệt Safari trên iPhone/iPad và truy cập địa chỉ: `http://<IP_MÁY_TÍNH>:8080`.
3. Nhấn vào nút **Chia sẻ** (Share) ở dưới thanh công cụ Safari.
4. Chọn **"Thêm vào MH chính"** (**Add to Home Screen**).
5. Mở game từ màn hình chính để chơi toàn màn hình không có viền trình duyệt.

---

## 💻 4. Hướng Dẫn Chơi Trên Máy Tính Windows

- Nhấp đúp trực tiếp vào file **`Game.exe`** để vào chơi ngay lập tức.
- Toàn bộ runtime NW.js, thư viện âm thanh và file save đều đã được tích hợp sẵn 100% trong repository.
