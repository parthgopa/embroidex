# Firebase Google Sign-In Setup & SHA Fingerprint Guide

This guide documents the SHA fingerprints for **Embroidex** and step-by-step instructions on how to add them to Firebase Console and extract them in the future.

---

## 1. Current Android App Fingerprints (Debug Keystore)

These are the exact fingerprints extracted from `mobile_app/android/app/debug.keystore`:

| Attribute | Value |
| :--- | :--- |
| **Android Package Name / Application ID** | `com.embroidex` |
| **Keystore File** | `mobile_app/android/app/debug.keystore` |
| **Key Alias** | `androiddebugkey` |
| **Keystore Password** | `android` |
| **SHA-1 Fingerprint** | `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` |
| **SHA-256 Fingerprint** | `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C` |
| **MD5 Fingerprint** | `20:F4:61:48:B7:2D:8E:5E:5C:A2:3D:37:A4:F4:14:90` |

---

## 2. Steps in Firebase Console

1. Open **[Firebase Console](https://console.firebase.google.com/)** and select project **`ai4cs-482314`**.
2. Click the ⚙️ **Settings icon** (top left next to Project Overview) → **Project settings**.
3. Under the **General** tab, scroll down to **Your apps**.
4. If Android app is not yet added:
   - Click **Add app** → select the **Android** icon.
   - **Android package name**: `com.embroidex`
   - **App nickname**: `Embroidex Mobile`
   - **Debug signing certificate SHA-1**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Click **Register app**.
5. Add the **SHA-256** certificate:
   - Under the Android app configuration card, click **Add fingerprint**.
   - Paste: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
   - Click **Save**.
6. Download **`google-services.json`**:
   - Download the file and place it directly inside:
     ```
     mobile_app/android/app/google-services.json
     ```
7. Enable **Google Sign-In** in Firebase Authentication:
   - In Firebase Console left menu → **Build** → **Authentication**.
   - Go to the **Sign-in method** tab.
   - Click **Google** → Toggle **Enable**.
   - Select your project support email (e.g. `bdgopani3@gmail.com` or your admin email).
   - Click **Save**.

---

## 3. How to Extract SHA Fingerprints in the Future

### Method 1: Using Gradle (Fastest & Simplest)

Open your terminal in the `mobile_app/android` directory:

```bash
cd /Users/parth/Embroidex/embroidex/mobile_app/android
./gradlew signingReport
```

Look for the output under `Task :app:signingReport`:
```
Variant: debug
Config: debug
Store: .../mobile_app/android/app/debug.keystore
Alias: androiddebugkey
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

---

### Method 2: Using JDK `keytool` (Direct Keystore Inspection)

From your project root directory:

```bash
keytool -list -v -keystore mobile_app/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

### Method 3: For Production / Release Keystore (When Publishing to Google Play)

When you generate a custom release keystore (e.g. `my-release-key.keystore`):

```bash
keytool -list -v -keystore /path/to/my-release-key.keystore -alias your-release-alias
```
Enter your release keystore password when prompted.

> **Note for Google Play Store**: If you use Google Play App Signing, Google re-signs your app with their own key. You will also need to copy the **SHA-1** and **SHA-256** from **Google Play Console → Setup → App Integrity → App Signing Certificate** and add them to Firebase Console as well.
