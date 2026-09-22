# Android App Bundle (AAB/ABB) & APK Version Control Guide

This guide provides a comprehensive reference for managing Android releases, version numbering, signing, and deploying **Embroidex** using the automated build scripts.

---

## 1. Quick Build Commands

From the `mobile_app` root directory:

### To Build APK (Direct Device Installation & Manual Testing)
```bash
./build_apk.sh
```
- **Output File**: `mobile_app/Embroidex.apk`
- **Use Case**: Direct sideloading, team testing, distribution outside Google Play.
- **Install on connected device**:
  ```bash
  adb install -r Embroidex.apk
  ```

### To Build AAB / ABB (Google Play Console Submission)
```bash
./build_abb.sh
# or
./build_aab.sh
```
- **Output Files**: `mobile_app/Embroidex.aab` and `mobile_app/Embroidex.abb`
- **Use Case**: Uploading to Google Play Console (Internal Testing, Closed Alpha/Beta, Production).
- Both `.aab` (official Google format) and `.abb` copies are automatically generated in the `mobile_app` root directory.

---

## 2. Version Controlling Rules (AAB / Play Store)

Google Play enforces strict rules on Android versions:

| Identifier | Type | Location | Purpose & Rules |
| :--- | :--- | :--- | :--- |
| **`versionCode`** | Positive Integer (`1`, `2`, `3`, ...) | `android/app/build.gradle` | **MANDATORY**: Must be strictly incremented by at least `+1` for EVERY new upload to Google Play Console. Google Play will **reject** any build whose `versionCode` is $\le$ an already uploaded build. |
| **`versionName`** | String (`"1.0.0"`, `"1.0.1"`, `"1.1.0"`) | `android/app/build.gradle` | User-facing version displayed on the Google Play Store page and in app settings. Follows [Semantic Versioning (SemVer)](#3-semantic-versioning-rules). |

---

## 3. How to Update Version Numbers Before Building

Whenever you prepare a new release:

1. Open `mobile_app/android/app/build.gradle`.
2. Locate the `defaultConfig` block (around line 80):
   ```groovy
   defaultConfig {
       applicationId "com.embroidex"
       minSdkVersion rootProject.ext.minSdkVersion
       targetSdkVersion rootProject.ext.targetSdkVersion
       versionCode 2          // <--- Increment this integer (e.g. 1 -> 2 -> 3)
       versionName "1.0.1"    // <--- Update human-readable SemVer string
   }
   ```
3. (Optional but recommended) Update `"version"` in `mobile_app/package.json` to match `versionName`:
   ```json
   {
     "name": "Embroidex",
     "version": "1.0.1",
     ...
   }
   ```
4. Run `./build_abb.sh` to generate the new bundle.

---

## 4. Semantic Versioning Rules (SemVer)

Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)

1. **`PATCH` (e.g., `1.0.0` -> `1.0.1`)**:
   - Backward-compatible bug fixes, UI adjustments, styling fixes, safe-area/navbar adjustments.
   - Example: Fixing button spacing above the Android 3-button navbar.
2. **`MINOR` (e.g., `1.0.1` -> `1.1.0`)**:
   - New features added in a backward-compatible manner.
   - Example: Adding seller upload enhancements, new filter categories, or offline caching.
3. **`MAJOR` (e.g., `1.1.0` -> `2.0.0`)**:
   - Substantial architectural revamps, major database migrations, or breaking workflow changes.

---

## 5. Recommended Version History Log

Keep a running record of releases in this table for team audit:

| Version Code | Version Name | Date | Track (Internal / Closed / Prod) | Git Commit | Release Summary |
| :---: | :---: | :---: | :---: | :---: | :--- |
| `1` | `1.0.0` | 2026-09-22 | Internal Testing | Initial Release | Initial production build with Google login, Cart, Catalog, Seller Hub & Chatbot. |
| `2` | `1.0.1` | — | — | — | Password change with OTP, Forgot password auto-check & dynamic navbar spacing. |

---

## 6. Testing an AAB Locally using `bundletool` (Optional)

An `.aab` file cannot be directly installed via `adb install` because it is an archive containing code and resources for all device configurations (screen densities, CPU architectures, languages). Google Play uses dynamic delivery to serve device-specific split APKs.

To test the `.aab` locally before uploading to Google Play:

1. Download Google's official `bundletool.jar` from [GitHub Releases](https://github.com/google/bundletool/releases).
2. Generate device-tailored APKs from the bundle:
   ```bash
   java -jar bundletool.jar build-apks \
     --bundle=Embroidex.aab \
     --output=Embroidex.apks \
     --mode=universal
   ```
3. Install onto your connected device or emulator:
   ```bash
   java -jar bundletool.jar install-apks --apks=Embroidex.apks
   ```

---

## 7. Production Keystore & Google Play App Signing

### Current Development Setup
The project is configured to sign release builds using the debug key for easy local testing and verification:
```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
```

### Steps for Official Google Play Production Signing
When publishing officially to the Google Play Store:

1. **Generate a Dedicated Upload Keystore**:
   ```bash
   keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
   > ⚠️ **CRITICAL**: Store the keystore file and passwords in a safe password manager. Never commit production keystore files or passwords to Git.

2. **Configure Gradle Properties Privately**:
   In your home directory file `~/.gradle/gradle.properties` (outside any Git repository):
   ```properties
   MYAPP_UPLOAD_STORE_FILE=/path/to/my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
   MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
   ```

3. **Configure `android/app/build.gradle`**:
   ```groovy
   signingConfigs {
       release {
           if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
               storeFile file(MYAPP_UPLOAD_STORE_FILE)
               storePassword MYAPP_UPLOAD_STORE_PASSWORD
               keyAlias MYAPP_UPLOAD_KEY_ALIAS
               keyPassword MYAPP_UPLOAD_KEY_PASSWORD
           }
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled enableProguardInReleaseBuilds
           proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
       }
   }
   ```

---

## 8. Google Play Console Upload Workflow

1. Open [Google Play Console](https://play.google.com/console).
2. Select your app: **Embroidex**.
3. In the left navigation menu, go to **Testing > Internal testing** (recommended before production rollout).
4. Click **Create new release**.
5. Upload `Embroidex.aab` from your `mobile_app/` folder.
6. Enter release name (e.g., `1.0.1 (2)`) and release notes.
7. Click **Next**, review errors or warnings, and click **Start rollout to Internal testing**.
8. Once verified by internal testers, promote the release to **Closed testing** or directly to **Production**.
