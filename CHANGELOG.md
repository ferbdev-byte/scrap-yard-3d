# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [SemVer](https://semver.org/lang/vi/).

## [0.1.0] - 2026-11-24

### Thêm
- Cảnh 3D bãi phế liệu dựng bằng React Three Fiber: đống ngoài trời, thùng chứa, cầu cân, văn phòng và xe tải chạy vòng.
- Chiều cao đống theo căn bậc ba khối lượng (thể tích hình nón), mức hàng trong thùng theo tỉ lệ sức chứa.
- Bố cục tự động giữ lối xe trống và không để đống chồng lên nhau, có unit test.
- Bảng danh sách dùng được hoàn toàn bằng bàn phím, thẻ chi tiết khối lượng / giá vốn / giá trị / tỉ trọng.
- Chế độ giảm hiệu ứng (tự bật theo `prefers-reduced-motion`, nhớ qua lần tải sau): tắt bóng đổ, chuyển động và chỉ vẽ lại khi cần.
- Bố cục riêng cho điện thoại, ảnh xem trước Open Graph.
- CI: lint, unit test, build, E2E Playwright (máy tính + điện thoại, WebGL qua SwiftShader), tự deploy GitHub Pages.

[0.1.0]: https://github.com/ferbdev-byte/scrap-yard-3d/releases/tag/v0.1.0
