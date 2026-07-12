# Jambh Electricals — Native Mobile App (PWA Wrapper)

## Overview
A native React Native (Expo) mobile app that runs the Jambh Electricals PWA (https://jambh-ell.vercel.app) inside a full-screen WebView on Android and iOS.

## Core Features
- Loads the PWA at `https://jambh-ell.vercel.app` inside a full-screen WebView.
- **Branded splash** with the Jambh Electricals logo on a dark background (#0c0c0c).
- **Android hardware back button** navigates back through WebView history; exits when at the root.
- **Pull-to-refresh** to reload the PWA (native WebView `pullToRefreshEnabled` on Android + `bounces` on iOS).
- **Offline detection** (via `expo-network`) → shows a branded offline screen with a Retry button.
- **Load error detection** → dedicated error screen with a Retry button.
- **External links open in the device browser** (any URL outside `jambh-ell.vercel.app`).
- **Device schemes handled**: `tel:`, `mailto:`, `sms:`, `whatsapp:`, `upi:`, `geo:`, `intent:` open the appropriate native app.
- **Loading progress bar** at the top of the screen during navigation.
- **Cookies, localStorage, IndexedDB, Service Workers** are enabled so the PWA state persists.
- **Media playback**, camera/mic access, file uploads, and geolocation enabled inside the WebView.

## Permissions Declared
### iOS (`app.json → ios.infoPlist`)
- `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`

### Android (`app.json → android.permissions`)
- `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`

## Notifications
- The PWA already handles web push notifications internally. Native FCM is **NOT** wired in this MVP. Adding FCM would require an Emergent-managed push integration (works only on a published APK/IPA build, not in Expo Go).

## Tech Stack
- Expo SDK 54, expo-router, react-native-webview 13.15.0, expo-network 8.0.8, react-native-safe-area-context.

## Files
- `frontend/app/index.tsx` — WebView wrapper (splash, offline, error, back, refresh, external links).
- `frontend/app/_layout.tsx` — Root Expo Router layout (icon-font prewarming preserved).
- `frontend/app.json` — App name "Jambh Electricals", bundle IDs, splash, permissions.
- `frontend/assets/images/{icon,adaptive-icon,splash-image,app-image,favicon}.png` — Generated from user-supplied logo.

## Preview Note
`react-native-webview` is native-only. On the web preview URL the loading splash will remain visible (the PWA cannot render because WebView isn't a web component). **Scan the Expo Go QR code on an Android/iOS device to see the actual PWA load inside the app.**

## How to Test on a Device
1. Install **Expo Go** on your Android or iOS device.
2. Scan the QR code from the Emergent preview page.
3. Grant camera / mic / location / storage permissions on first prompt.
4. The Jambh Electricals PWA loads full-screen. Pull down to refresh. Press hardware back to navigate history.

## Publishing
Use the **Emergent publish button** (top-right in the platform UI) to build APK/IPA — do not use EAS CLI or your own Expo account.
