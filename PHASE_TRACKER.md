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
| **Phase 6** | Seller Hub (Seller Registration, Zero-Dependency Native File/Photo Picker, Full Design Upload Pipeline, Portfolio Management, Earnings & Bank Withdrawals) | **COMPLETED** | Verified via Android Kotlin Gradle & Metro bundle builds (0 errors) |

---

### 🎨 Phase 6 Deliverables Completed:
1. **Zero-Dependency Native File & Photo Picker ([NativeFilePickerModule.kt](file:///Users/parth/Embroidex/embroidex/mobile_app/android/app/src/main/java/com/embroidex/NativeFilePickerModule.kt))**:
   - Zero heavy third-party npm libraries, keeping app bundle size strictly minimal.
   - Built directly on Bare Android using `Intent.ACTION_GET_CONTENT` with `ActivityEventListener`.
   - Supports image selection (`pickImage(multiple)`), base64 thumbnail generation for instant preview, and binary document selection (`pickDocument()`) for embroidery machine files (`.EMB`, `.DST`, `.ZIP`, etc.).
   - Exposed to React Native via [pickerHelper.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/utils/pickerHelper.js) (`pickMainPhoto()`, `pickAdditionalPhotos()`, `pickDesignFile()`).
2. **Seller Onboarding & Registration ([SellerRegisterScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerRegisterScreen.js))**:
   - Complete 100% theme-adaptive registration screen.
   - Live check for existing seller status with direct shortcuts to Upload and Earnings.
   - Validates store name, designer bio, and connects to `POST /auth/register-seller`.
3. **Comprehensive Design Upload Flow ([SellerUploadScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerUploadScreen.js))**:
   - Main front photo picker with real-time thumbnail preview.
   - Up to 5 additional detail photos with remove buttons.
   - Native design machine file selector with file name and size display.
   - Format pills (`.EMB`, `.DST`, `.PES`, `.JEF`, `.EXP`, `.VP3`, etc.).
   - Machine type selector (12 embroidery machine categories).
   - Dynamic Category & Subcategory selection loaded directly from `GET /seller/categories`.
   - Live earnings calculator showing seller's net 70% earnings alongside price input.
   - Multipart `FormData` submission to `POST /seller/final-upload` with loading progress indicator.
4. **Seller Portfolio Management ([SellerMyDesignsScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerMyDesignsScreen.js))**:
   - Fetches portfolio designs from `GET /seller/my-designs`.
   - Metric overview cards (Total, Live, Review, Issues).
   - Filter tabs (All, Live, Pending, Rejected).
   - Detailed design cards with status badges (`Approved` [green], `In Review` [amber], `Action Required` [red]).
   - Displays admin feedback/rejection reasons directly to the seller.
   - Design deletion action via `DELETE /seller/design/:id` with confirmation modal.
   - Pull-to-refresh and preview navigation.
5. **Seller Earnings & Payout Dashboard ([SellerEarningsScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/SellerEarningsScreen.js))**:
   - Hero Available Balance card with quick withdrawal CTA.
   - Secondary KPI metrics: Net Royalties (70%), Gross Sales, Orders Fulfilled, Platform Commission (30%).
   - Settlement Bank Account management with IFSC validation (`^[A-Z]{4}0[A-Z0-9]{6}$`) and account number confirmation.
   - Payout request modal enforcing minimum ₹2,000 withdrawal threshold and balance limit.
   - Tabbed history view: Sales breakdown (gross price, 30% platform fee, 70% seller take-home) and Withdrawal request tracking (reference IDs, transfer statuses).
6. **Unified Navigation & Drawer Integration**:
   - Registered `SellerMyDesignsScreen` in [RootNavigator.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/navigation/RootNavigator.js).
   - Added portfolio, upload, and earnings links into [CustomDrawerContent.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/components/CustomDrawerContent.js) under the `SELLER HUB` accordion and in [ProfileScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/ProfileScreen.js).


