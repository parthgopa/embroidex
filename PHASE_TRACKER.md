# Embroidex Mobile (Android Bare React Native) - Phase Tracker

## 📌 Project Summary
- **App Name**: Embroidex
- **Package Name**: `com.embroidex`
- **Root Directory**: `mobile_app/`
- **Framework**: Pure React Native CLI (Bare Workflow, Strictly No Expo)
- **Live Production Backend**: `https://embroidex-backend.merishiksha.com`

---

## 🚦 Roadmap & Status

| Phase | Description | Status | Verification & Testing |
|---|---|---|---|
| **Phase 1** | Project Scaffolding, Core Branding, 3D Animated Splash Screen, TopBar, Sidebar Drawer & Bottom Tabs Shell, Live API & Storage Layer + UI Refinements | **COMPLETED** | Tested and verified |
| **Phase 2** | Storefront & Discovery (Dark & Light Theme with system auto-detection, icon-only drawer toggle, Explore Screen with Right-Side Multi-Filter Sidebar & 2-Column Design Grid) | **COMPLETED** | Verified via Metro bundle & emulator testing |
| **Phase 3** | Design Details (Native FLAG_SECURE Screenshot Protection, Gallery, 2-Col Specs Table, HTML Description) & Persistent Cart (Guest Cart Merge on Login, Continue Purchase flow) | **COMPLETED** | Tested & confirmed by user ("this phase is good") |
| **Phase 4** | Authentication (Login, 2-Step OTP Signup) & Checkout Pipeline | **COMPLETED** | Verified with live backend order creation & HMAC verification |
| **Phase 5** | Buyer Purchases Library, Direct-to-Device Download for .zip/.emb & Embroidex Gemini AI Assistant | **COMPLETED** | Verified via Metro bundle build (0 errors) |
| **Phase 6** | Seller Hub (Seller Onboarding, Unified Design & Photo Upload Flow, Earnings Analytics, Bank Setup & Withdrawals) | UPCOMING | Next phase |

---

### ⚠️ Deferred to Final Phase / Backlog (Per User Request)
- **Razorpay Native Android Gradle Dependency**: `com.razorpay:standard-core:latest.integration` remote maven repo 502 Bad Gateway issue during Android Gradle build. App provides robust fallback/simulated checkout so full end-to-end purchasing & library features can be tested without blocking progress. Will resolve native build configuration in final polish phase.

---

### 🎨 Phase 5 Deliverables Completed:
1. **Buyer Purchases Library ([MyPurchasesScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/MyPurchasesScreen.js))**:
   - Live query to `GET /payment/my-purchases` showing full purchase cards with thumbnails, `.ZIP` badges, dates, receipt codes, and prices.
   - Interactive official in-app receipt modal with order status, payment ID, and breakdown.
   - Per-card download button with active loading spinner indicator.
   - Empty and unauthenticated state handlers with direct CTAs.
2. **Direct-to-Device Native Download Pipeline**:
   - Kotlin module [NativeDownloadModule.kt](file:///Users/parth/Embroidex/embroidex/mobile_app/android/app/src/main/java/com/embroidex/NativeDownloadModule.kt) connected to Android's system `DownloadManager`.
   - Sends `Authorization: Bearer <token>` in native headers, saving `.zip` files directly to `/sdcard/Download/`.
   - Android system tray progress and completion notifications.
   - Backend [Payment_routes.py](file:///Users/parth/Embroidex/embroidex/backend/routes/Payment_routes.py) multi-path resolution and on-the-fly packaging of `.EMB` files into genuine, valid `.zip` archives.
3. **Embroidex Gemini AI Assistant**:
   - Floating AI Bot with animated pulse on all screens.
   - Full-screen modal assistant with suggestion chips, markdown rendering, chat history, and live backend AI integration.
4. **Simple Clean Alert Dialog System ([AlertContext.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/context/AlertContext.js))**:
   - Clean, standard rounded modal dialog (`borderRadius: 16`) using normal CSS styling with zero funky clutter.
   - Globally intercepts all `Alert.alert(...)` calls throughout the app.

---

### 🚀 Next Up: Phase 6 — Seller Hub & Earnings
- **Seller Onboarding & Registration** ([SellerRegisterScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerRegisterScreen.js))
- **Unified Design & Photo Upload Flow** ([SellerUploadScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerUploadScreen.js))
- **Seller Earnings Analytics & Dashboard** ([SellerEarningsScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerEarningsScreen.js))
- **Bank Account Setup & Withdrawal Requests** (Integrating `Withdrawal_routes.py`)

