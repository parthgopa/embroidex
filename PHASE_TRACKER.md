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

### 🎨 Phase 2 Deliverables Completed:
1. **Dynamic Theme System with System Auto-Detection**:
   - Built [ThemeContext.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/context/ThemeContext.js) listening to `useColorScheme()` and `Appearance.addChangeListener()`. When the Android device switches between dark and light themes, the app adapts instantly.
   - Connected `NavigationContainer`, `StatusBar`, `TopBar`, `TabNavigator`, `HomeScreen`, `CustomDrawerContent`, and `ExploreScreen` to theme colors dynamically.
2. **Left Sidebar Icon-Only Theme Switcher**:
   - Added a minimal 3-option toggle in [CustomDrawerContent.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/components/CustomDrawerContent.js) using **only icons** (`phone-portrait` for System Auto, `sunny` for Light, `moon` for Dark), with zero clutter.
3. **Explore Screen & Right-Side Filter Sidebar**:
   - Built full [ExploreScreen.js](file:///Users/parth/Embroidex/embroidex/mobile_app/src/screens/ExploreScreen.js) querying live `/seller/approved` and `/seller/categories`.
   - Top instant search bar with clear button.
   - Horizontal category quick-switch strip.
   - **Right-Side Filter Sidebar**: slides out from the right with backdrop overlay, containing all 7 filter categories (Sort, Categories, Machine Types, Area, Needles, Formats, Price Ranges), live badge counts, and an **"Apply Filters"** button at the bottom.
   - 2-Column design card grid with full photo thumbnails, format badges (`.EMB`, `.DST`), price in ₹, and instant "Add to Cart" action button.
   - Pull-to-refresh (`RefreshControl`) and empty state with Reset Filters CTA.
4. **Cross-Screen Linkage**:
   - Category pills & showcase "See All" on Home Screen navigate to Explore with that category pre-filtered.
   - Search icon in TopBar navigates to Explore and auto-focuses the search bar.

*Last Updated: Phase 2 fully built and verified.*

