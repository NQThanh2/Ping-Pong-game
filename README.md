# Ping Pong — Ý tưởng game

Game phá gạch viết bằng HTML, CSS và JavaScript. Game được thiết kế gồm 7 màn, mỗi màn bổ sung **một cơ chế mới** trên nền tảng của màn trước, để độ khó và sự thú vị tăng dần. Hiện đã triển khai màn 1–5; màn 6–7 nằm trong kế hoạch.

## Luật chơi chung

- Người chơi điều khiển thanh đỡ ở dưới sân; bóng bật lên để phá gạch.
- Bóng rơi khỏi đáy sân → mất 1 mạng.
- Bắt đầu với 3 mạng; qua mỗi màn được cộng 1 mạng, tối đa 5 mạng.
- Hết mạng → thua. Theo kế hoạch, hoàn thành màn 7 → thắng; bản hiện tại chơi đến hết màn 5.
- Góc bật của bóng phụ thuộc vào điểm chạm trên thanh đỡ: chạm giữa thì bóng bật gần thẳng lên, chạm mép thì bật chéo mạnh hơn, giúp người chơi chủ động nhắm gạch.

### Cách tính điểm

| Hành động | Điểm |
|---|---|
| Làm một viên gạch bị thương | +2 |
| Phá vỡ một viên gạch | +10 |
| Đánh trúng gạch thép | 0 |
| Đánh trúng boss (dự kiến) | +5 |
| Hoàn thành một màn | +100 |

## Tổng quan 7 màn

| Màn | Tên | Cơ chế riêng | Điều kiện qua màn |
|:---:|---|---|---|
| 1 | Khởi động | 32 gạch đứng yên, mỗi gạch 1 HP | Phá hết gạch |
| 2 | Gạch có giáp | 32 gạch có 1–3 HP, kích thước 50 × 10 như màn 1, màu gạch cho biết HP còn lại | Phá hết gạch |
| 3 | Gạch di chuyển | 32 gạch 1–3 HP, các hàng chuyển động ngang ngược hướng nhau | Phá hết gạch |
| 4 | Gạch không thể phá | 32 gạch phá được như màn 3 và 9 gạch thép bất tử tạo hàng rào phía dưới | Phá hết gạch phá được |
| 5 | Cổng dịch chuyển | Kế thừa màn 4, thêm cặp cổng xanh lam ↔ tím đưa bóng qua hàng rào thép và giữ hướng bay | Phá hết gạch phá được |

## Màn 3 — Gạch di chuyển

- Kế thừa 32 gạch 50 × 10 có 1–3 HP từ màn 2, vẫn thể hiện HP bằng màu, không hiển thị số trên gạch.
- Mỗi hàng gạch trượt ngang thành một khối, giữ nguyên khoảng cách 10 px giữa các viên. Các hàng liền nhau luôn đi ngược hướng; ban đầu hàng 1 và 3 đi sang phải, hàng 2 và 4 đi sang trái.
- Chuyển động theo hình sin với biên độ 15 px quanh vị trí ban đầu, chu kỳ 4 giây. Hàng gạch đổi hướng tại hai biên, mọi viên luôn nằm trong sân rộng 500 px.
- Gạch chỉ di chuyển khi đang chơi; chờ thả bóng sẽ giữ nguyên vị trí và pha chuyển động. Mất mạng cũng giữ pha hiện tại cho lần thả bóng tiếp theo; chọn màn hoặc chơi lại sẽ đặt lại bố cục ban đầu.
- Phá hết gạch để hoàn thành màn; điểm và mạng giữ nguyên luật trước đó.

## Màn 4 — Gạch không thể phá

- Kế thừa 32 gạch 50 × 10 có 1–3 HP và chuyển động của các hàng phía trên từ màn 3.
- Thêm 9 gạch thép đứng yên, mỗi viên 50 × 10, tạo hàng rào ở độ cao `y = 170`. Hai khe rộng 25 px tại `x = 100–125` và `x = 375–400` cho bóng đi qua.
- Gạch thép có HP vô hạn và màu xám kim loại, không hiển thị số HP. Bóng vẫn bật lại khi chạm thép, nhưng thép không bị hỏng và không cho điểm.
- Chỉ cần phá hết 32 viên gạch phá được để hoàn thành màn; các gạch thép không tính vào số gạch cần phá.

## Màn 5 — Cổng dịch chuyển

- Kế thừa 32 gạch phá được, 9 gạch thép và các hàng chuyển động của màn 4. Chỉ gạch phá được tính vào điều kiện qua màn.
- Có hai cổng tròn bán kính 18 px: cổng xanh lam tại tâm `(320, 300)` và cổng tím tại tâm `(250, 140)`, giúp đưa bóng lên phía trên hàng rào thép.
- Bóng chạm cổng xanh lam sẽ xuất hiện ở tâm cổng tím và ngược lại. Cổng giữ nguyên hướng bay và tốc độ hiện tại.
- Sau khi dịch chuyển, cổng chỉ nhận bóng lần nữa khi bóng đã rời hoàn toàn cả hai cổng, tránh dịch chuyển qua lại liên tục.
- Mất mạng, chơi lại hoặc chọn màn sẽ đặt lại trạng thái nhận bóng của cổng.

## Điều khiển

- **← / →** hoặc **A / D**: di chuyển thanh đỡ.
- **Space**: thả bóng hoặc sang màn tiếp theo khi có.
- **R**: chơi lại từ màn 1.
- Các nút **Màn 1 / Màn 2 / Màn 3 / Màn 4 / Màn 5** dưới sân cho phép chọn màn, bắt đầu lại với 0 điểm và 3 mạng.
