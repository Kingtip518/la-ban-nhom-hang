# La Bàn Nhóm Hàng

Trang web xếp hạng các nhóm hàng đang thịnh hành trên sàn thương mại điện tử Việt Nam (Shopee, TikTok Shop, Lazada, Tiki), chấm điểm theo kiểu người bán và đề xuất thứ tự ưu tiên. Số liệu cập nhật hằng tuần.

## Cấu trúc

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang |
| `style.css` | Giao diện (tự đổi sáng/tối theo máy) |
| `app.js` | Tính điểm, xếp hạng, so thứ hạng với lần cập nhật trước |
| `data/latest.json` | Số liệu hiện tại – chỉ cần sửa tệp này khi cập nhật |
| `data/history.json` | Các bản lưu theo từng lần cập nhật |
| `CAP_NHAT.md` | Quy trình cập nhật số liệu hằng tuần |

## Đăng lên GitHub Pages

1. Tạo kho mã mới tên `la-ban-nhom-hang`, để chế độ công khai (Public).
2. Tải toàn bộ tệp và thư mục `data` lên nhánh `main`.
3. Vào Settings → Pages → Source: chọn `Deploy from a branch`, nhánh `main`, thư mục `/ (root)` → Save.
4. Sau 1–2 phút trang chạy tại `https://<tên-tài-khoản>.github.io/la-ban-nhom-hang/`.

Trang chạy hoàn toàn miễn phí, không cần máy chủ hay cơ sở dữ liệu. Mở tệp `index.html` trực tiếp trên máy sẽ không tải được số liệu; phải mở qua địa chỉ web.
