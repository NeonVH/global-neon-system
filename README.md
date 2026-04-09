# NEONVH - Visual Novel Ecosystem

NEONVH là scaffold frontend cyberpunk cho thư viện Visual Novel, notification realtime, khu VIP, mini-game coin ảo và dashboard admin nhiều cấp quyền. Project này được thiết kế để chạy frontend tĩnh trên GitHub Pages, còn thao tác nhạy cảm đi qua Firebase Auth, Firestore Rules, Storage Rules và Cloud Functions.

## Cấu trúc

- `index.html`: app shell, CDN assets, CSP, background FX.
- `assets/css`: design tokens, base, components, animations.
- `assets/js`: state, router, utils, services, pages, components.
- `firebase/firestore.rules`: rules cho Firestore.
- `firebase/storage.rules`: rules cho Storage.
- `firebase/functions`: callable functions cho coin, VIP, role, broadcast, minigame.

## Chạy local

1. Mở thư mục project trong editor.
2. Serve thư mục bằng một static server, ví dụ:

```powershell
cd C:\Users\Admin\Documents\WEB
python -m http.server 8080
```

3. Truy cập `http://localhost:8080`.
4. Nếu chưa cấu hình Firebase, app chạy ở `mock/demo mode` với dữ liệu mẫu và tài khoản demo.

## Demo accounts

- `superadmin@neonvh.demo / NeonVH!2026`
- `finance@neonvh.demo / NeonVH!2026`
- `editor@neonvh.demo / NeonVH!2026`
- `member@neonvh.demo / NeonVH!2026`

## Cấu hình Firebase

Frontend không chứa secret backend. Bạn cần tự tạo Firebase project rồi inject config public của Firebase vào `window.__NEONVH_FIREBASE_CONFIG__` hoặc lưu vào localStorage key `neonvh.firebase.config`.

Ví dụ:

```html
<script>
  window.__NEONVH_FIREBASE_CONFIG__ = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
</script>
```

## Deploy GitHub Pages

1. Tạo repo public mới trên GitHub.
2. Push toàn bộ project lên branch chính.
3. Vào `Settings > Pages`.
4. Chọn source là branch chính và thư mục `/root`.
5. Đợi GitHub Pages build xong rồi mở URL được cấp.

Nếu dùng hash routing như scaffold hiện tại thì không cần cấu hình rewrite đặc biệt.

## Deploy Firebase Rules và Functions

1. Cài Firebase CLI.
2. Đăng nhập:

```powershell
firebase login
```

3. Khởi tạo project Firebase nếu chưa có:

```powershell
firebase use --add
```

4. Deploy rules:

```powershell
firebase deploy --only firestore:rules
firebase deploy --only storage
```

5. Cài dependencies cho functions rồi deploy:

```powershell
cd C:\Users\Admin\Documents\WEB\firebase\functions
npm install
firebase deploy --only functions
```

## Mô hình bảo mật

- Dùng Firebase Auth cho đăng nhập, không tự hash password ở frontend.
- UI chỉ ẩn/hiện theo permission để tăng UX; quyết định cuối cùng nằm ở Firestore Rules và Cloud Functions.
- Các thao tác nhạy cảm như coin, VIP, role, broadcast, status, game write được thiết kế để đi qua callable functions.
- Toàn bộ nội dung render HTML được sanitize bằng DOMPurify để giảm rủi ro XSS.
- File upload được giới hạn mime type và kích thước ở cả frontend lẫn Storage Rules.
- Audit log được ghi cho các thao tác admin quan trọng.

## Lưu ý quan trọng

- Frontend public không thể chứa bí mật thật sự.
- Firebase config public không phải secret; phần cần bảo vệ là Rules, Functions, quyền IAM và dữ liệu.
- Demo mode chỉ để xem UI và luồng ứng dụng. Muốn dùng production, bạn phải cấu hình Firebase hoàn chỉnh.
- Một số thao tác server trong `firebase/functions/index.js` là scaffold nền. Bạn nên review lại validation, logging và quota trước khi đưa lên production.

## Copyright

Copyright © 2026 by NEONVH. All Rights Reserved.
