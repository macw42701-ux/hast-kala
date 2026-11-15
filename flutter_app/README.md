# Hast Kala — Flutter Android Source (`com.artisan.craftstore`)

This folder contains the Flutter / Dart Android project scaffold configured with:
- Independent Android Application ID (`com.artisan.craftstore`) while displaying **Hast Kala**
- Cloud Firestore, Firebase Auth (Phone OTP), Firebase Storage, and Firebase Cloud Messaging (`pubspec.yaml`)
- English & Gujarati localization (`lib/l10n/app_strings.dart`)
- WhatsApp order launch (`lib/services/firebase_service.dart`)

## Build Release APK Locally
1. Install Flutter SDK and Android Studio / Android SDK.
2. Add your `google-services.json` from Firebase Console (`the-computer-3v0ns`) into `flutter_app/android/app/google-services.json`.
3. Run:
   ```bash
   cd flutter_app
   flutter pub get
   flutter build apk --release
   ```
4. The installable APK will be generated at `flutter_app/build/app/outputs/flutter-apk/app-release.apk`.
