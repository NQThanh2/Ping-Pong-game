# Ping Pong — Ý tưởng game

Game phá gạch viết bằng HTML, CSS và JavaScript. Game có 5 màn, mỗi màn bổ sung **một cơ chế mới** trên nền tảng của màn trước, để độ khó và sự thú vị tăng dần.

## Luật chơi chung

- Người chơi điều khiển thanh đỡ ở dưới sân; bóng bật lên để phá gạch.
- Bóng rơi khỏi đáy sân → mất 1 mạng.
- Bắt đầu với 3 mạng; qua mỗi màn được cộng 1 mạng, tối đa 5 mạng.
- Hết mạng → thua. Hoàn thành màn 5 → thắng.
- Góc bật của bóng phụ thuộc vào điểm chạm trên thanh đỡ: chạm giữa thì bóng bật gần thẳng lên, chạm mép thì bật chéo mạnh hơn, giúp người chơi chủ động nhắm gạch.

### Cách tính điểm

| Hành động | Điểm |
|---|---|
| Làm một viên gạch bị thương | +2 |
| Phá vỡ một viên gạch | +10 |
| Đánh trúng boss | +5 |
| Hoàn thành một màn | +100 |

## Tổng quan 5 màn

| Màn | Tên | Cơ chế riêng | Điều kiện qua màn |
|:---:|---|---|---|
| 1 | Khởi động | 32 gạch đứng yên, mỗi gạch 1 HP | Phá hết gạch |
| 2 | Phá giáp | 32 gạch có 1–3 HP, kích thước 50 × 10 như màn 1, màu gạch cho biết HP còn lại | Phá hết gạch |
| 3 | Mục tiêu di động | 32 gạch, các hàng chuyển động ngang, hai hàng liền nhau đi ngược hướng | Phá hết gạch |
| 4 | Gạch hồi phục | 24 gạch 2 HP, tự hồi đầy HP nếu không bị đánh trong 4 giây | Phá hết gạch |
| 5 | Lõi phòng thủ | Boss di chuyển có khiên, phá gạch để tắt khiên, sau đó boss bắn đạn | Hạ HP boss về 0 |
