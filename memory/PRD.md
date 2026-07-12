# Jambh Electricals — Native Mobile App (PWA Wrapper)

## Overview
Native React Native (Expo SDK 54) mobile app that loads the Jambh Electricals PWA (https://jambh-ell.vercel.app) inside a full-screen WebView on Android and iOS. **No backend / no database.**

## Core Features
- Full-screen WebView loading `https://jambh-ell.vercel.app`.
- Branded splash on cold start with the Jambh Electricals logo (dark theme, #0c0c0c).
- **Safety-net timeout** hides the splash after 8s if WebView events never fire.
- **Android hardware back** navigates WebView history; exits at root.
- **Native pull-to-refresh** (`pullToRefreshEnabled` on Android + `bounces` on iOS).
- **Offline screen** with Retry (`expo-network` polls every 5s).
- **Load-error screen** with Try-again.
- **External links & schemes**: any URL outside `jambh-ell.vercel.app`, plus `tel:`, `mailto:`, `sms:`, `whatsapp:`, `upi:`, `geo:`, `intent:` open in the appropriate native app.
- **Top progress bar** during navigation.
- Cookies, localStorage, IndexedDB, Service Workers, camera/mic/geolocation, file uploads enabled inside the WebView.

## Web-preview screen
On the web preview URL (browser), `react-native-webview` is native-only AND the PWA sends `X-Frame-Options: DENY`, so the app renders a compact "Native Mobile App" card with a **real HTML `<a target="_blank">` "Open PWA ↗"** button that opens the PWA in a new tab. On real Android/iOS, the native WebView loads the PWA normally.

## Permissions
### iOS (`app.json → ios.infoPlist`)
`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`

### Android (`app.json → android.permissions`)
`CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`

## Project Structure (final, backend removed)
```
app/
├── frontend/
│   ├── app/
│   │   ├── _layout.tsx      Expo Router root (icon-font prewarm preserved)
│   │   └── index.tsx        The entire app (WebView wrapper)
│   ├── assets/images/       icon, adaptive-icon, splash-image, favicon (from user logo)
│   ├── src/utils/           helper utilities
│   ├── app.json             app config + permissions
│   ├── package.json
│   └── .env
└── memory/PRD.md
```
No backend, no database, no server code.

## Tech
- Expo SDK 54 · expo-router 6 · react-native-webview 13.15 · expo-network 8 · react-native-safe-area-context 5

## How to Test on a Device
1. Install **Expo Go** on your Android or iOS device.
2. Scan the QR code from the Emergent preview.
3. Grant camera / mic / location / storage permissions on first prompt.
4. The Jambh Electricals PWA loads full-screen.

## Publishing
Click the **Publish** button (top-right) in Emergent to build the APK/IPA. Host the APK at `https://jambh-ell.vercel.app/jambh-elt.apk` for direct download. iOS distribution goes through the App Store or TestFlight.
