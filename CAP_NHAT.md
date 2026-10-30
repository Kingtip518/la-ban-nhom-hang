# Quy trình cập nhật số liệu hằng tuần

Tệp này là hướng dẫn cho người (hoặc Claude) cập nhật số liệu của trang La Bàn Nhóm Hàng. Trang chỉ đọc hai tệp trong thư mục `data/`, không cần sửa mã.

## 1. Tìm số liệu mới

Tìm báo cáo thị trường thương mại điện tử Việt Nam mới nhất (từ sau ngày `capNhat` trong `data/latest.json`), ưu tiên:

- Metric (metric.vn) – báo cáo quý, báo cáo ngành hàng, báo cáo mùa Tết.
- YouNet ECI (EcomHeat) – báo cáo quý.
- Các báo đăng lại số liệu của hai đơn vị trên (Doanh nhân Pháp luật, VCCI, Vietnamplus, OneTik, Doanh nghiệp và Tiếp thị...).

Chỉ ghi số liệu đọc được từ nguồn. Không suy đoán, không tự điền số. Nhóm nào không có số mới thì giữ nguyên số cũ.

## 2. Sửa `data/latest.json`

- `capNhat`: ngày cập nhật, dạng `YYYY-MM-DD`.
- `kyDuLieu`: kỳ số liệu mới nhất, ví dụ `đến quý IV/2026`.
- `nguon`: danh sách bài nguồn đã dùng (`ten`, `url`).
- `lichMuaVu`: các dịp mua sắm sắp tới (`ten`, `ngay`, `moTa`, `noiBat` = true với dịp quan trọng nhất). Bỏ dịp đã qua hơn 1 tháng, thêm dịp mới cho năm sau.
- `nhomHang`: mỗi nhóm gồm
  - `id`: mã cố định, không đổi giữa các lần cập nhật (để trang so được thứ hạng).
  - `ten`: tên nhóm.
  - `doanhSoQuy`: doanh số mỗi quý, đơn vị tỷ đồng. Số 6 tháng thì chia 2. Không có thì `null`.
  - `tangDoanhSo`, `tangSanLuong`, `thayDoiGianHang`: % thay đổi so với cùng kỳ năm trước. Không có thì `null`.
  - `hopVonNho`, `dungMua`: điểm nhận định 0–10. `dungMua` phải chấm lại theo các dịp sắp tới.
  - `ghiChuDoanhSo`: ghi chú khi doanh số không phải số theo quý (ví dụ hàng theo mùa), không có thì `null`.
  - `soLieu`: các câu số liệu kèm kỳ báo cáo.
  - `nguon`: tên nguồn ngắn.
  - `nenLam`: 2–3 việc cụ thể nên làm ngay, khớp mùa vụ sắp tới.
  - `luuY`: rủi ro chính, có thể để trống.

Nếu báo cáo mới nêu một nhóm hàng chưa có trong danh sách và có đủ số liệu, thêm nhóm mới với `id` mới.

## 3. Thêm bản lưu vào `data/history.json`

Thêm một phần tử vào cuối mảng:

```json
{ "ngay": "<capNhat>", "nhomHang": { "<id>": { "doanhSoQuy": ..., "tangDoanhSo": ..., "tangSanLuong": ..., "thayDoiGianHang": ..., "hopVonNho": ..., "dungMua": ... } } }
```

Nếu đã có phần tử cùng ngày thì thay thế, không thêm trùng.

## 4. Kiểm tra và đẩy lên

- Kiểm tra cả hai tệp là JSON hợp lệ: `python3 -m json.tool data/latest.json` và `data/history.json`.
- Đẩy lên nhánh `main`. GitHub Pages tự đăng lại trong vài phút.
- Ghi trong lời nhắn đẩy mã: những nhóm có số mới và nguồn.

Nếu tuần đó không có báo cáo mới: chỉ chấm lại `dungMua`, cập nhật `lichMuaVu`, `capNhat`, và thêm bản lưu.
