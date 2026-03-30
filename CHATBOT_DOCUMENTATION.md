# Embroidex Platform - Chatbot Training Documentation

## Platform Overview

**Embroidex** is India's #1 Embroidery Marketplace - a comprehensive platform for buying and selling premium embroidery designs. The platform connects talented creators with customers looking for high-quality embroidery files.

### Platform Fee Structure
- **Seller Commission**: 30% platform fee on all sales
- **Seller Earnings**: 70% of sale price goes to the seller
- **Minimum Withdrawal**: ₹2000

---

## BUYER SIDE DOCUMENTATION

### 1. HOME PAGE
**Route**: `/`

**Features**:
- Hero section with platform introduction
- Browse categories (Fashion, Home Decor, Accessories, etc.)
- Featured designs showcase
- Testimonials from satisfied customers
- Call-to-action sections for buyers and sellers
- FAQ section

**Key Actions**:
- Navigate to Buy Design (Explore) page
- Sign up as a new user
- Learn about becoming a seller

---

### 2. BUY DESIGN (EXPLORE) PAGE
**Route**: `/explore`

**Features**:
- Browse all approved embroidery designs
- Filter designs by:
  - Category (Fashion, Home Decor, Accessories, Seasonal, Custom)
  - Subcategory (specific types within each category)
  - Price range
  - Search by title/description
- Designs displayed in grid layout with:
  - Thumbnail image
  - Title
  - Price
  - Category badge
  - View Details button

**Sorting**:
- Designs are shown with earliest uploaded first
- Real-time filtering updates

**Key Actions**:
- Click on any design to view full details
- Filter and search for specific designs
- Navigate to design details page

---

### 3. DESIGN DETAILS PAGE
**Route**: `/design/:designId`

**Features**:
- Large design preview images (thumbnail + additional images)
- Complete design information:
  - Title
  - Description
  - Price
  - Category and Subcategory
  - Seller information
  - File format details
- Image gallery with multiple views
- "Buy Now" button (requires login)
- Related designs suggestions

**Key Actions**:
- View all design images
- Read complete description
- Check file specifications
- Purchase the design (redirects to login if not logged in)

---

### 4. PURCHASE PAGE
**Route**: `/purchase/:designId`

**Features**:
- Order summary with design details
- Price breakdown
- Razorpay payment integration
- Secure checkout process
- Order confirmation

**Payment Process**:
1. Review design and price
2. Click "Proceed to Payment"
3. Complete payment via Razorpay
4. Receive instant access to design files
5. Automatic redirect to My Purchases

**Key Actions**:
- Complete payment
- Download purchased design immediately
- View purchase in My Purchases section

---

### 5. MY PURCHASES PAGE
**Route**: `/my-purchases`
**Access**: Requires login

**Features**:
- List of all purchased designs
- Each purchase shows:
  - Design thumbnail
  - Title
  - Purchase date
  - Price paid
  - Download button
- Purchase history tracking
- Instant file downloads

**Key Actions**:
- View all purchased designs
- Download design files anytime (unlimited downloads)
- Track purchase history

---

### 6. PROFILE & SETTINGS PAGE
**Route**: `/profile`
**Access**: Requires login

**Features**:
- User information display:
  - Name
  - Email
  - Account type (Buyer/Seller)
  - Join date
- Account management options
- Profile customization

**Key Actions**:
- View account details
- Update profile information
- Manage account settings

---

### 7. LOGIN PAGE
**Route**: `/login`

**Features**:
- Email and password authentication
- Secure login form
- Link to signup page
- Password visibility toggle

**Key Actions**:
- Login with existing credentials
- Navigate to signup if new user
- Access protected features after login

---

### 8. SIGNUP PAGE
**Route**: `/signup`

**Features**:
- New user registration form:
  - Full Name
  - Email
  - Password
  - Confirm Password
- Password strength indicators
- Email validation
- Terms acceptance
- Automatic login after signup

**Key Actions**:
- Create new account
- Automatic redirect to home after signup
- Start browsing and purchasing

---

## SELLER SIDE DOCUMENTATION

### 9. BECOME A SELLER
**Route**: `/seller/register`
**Access**: Requires login as buyer first

**Features**:
- Seller registration form
- Business information collection
- Terms and conditions for sellers
- Platform fee disclosure (30%)
- Automatic seller account activation

**Requirements**:
- Must be logged in
- Cannot register if already a seller
- One-time registration process

**Key Actions**:
- Fill seller registration form
- Accept seller terms
- Gain access to seller features
- Start uploading designs

---

### 10. UPLOAD DESIGN PAGE
**Route**: `/seller/upload`
**Access**: Sellers only (protected route)

**Features**:
- **Step 1: Image Uploads**
  - Thumbnail image (required, main preview)
  - Additional images (up to 5, optional)
  - Image preview before upload
  - Drag-and-drop support

- **Step 2: Design File Upload**
  - ZIP or EMB file upload
  - AI-powered file processing
  - Automatic metadata extraction
  - EMB file details display:
    - Stitch count
    - Thread colors
    - Design dimensions
    - File format

- **Step 3: Design Information**
  - Title (auto-filled by AI, editable)
  - Description (auto-filled by AI, editable)
  - Category selection (Fashion, Home Decor, Accessories, Seasonal, Custom)
  - Subcategory selection (dynamic based on category)
  - Price setting (in ₹)

- **Step 4: Submit for Review**
  - Final validation
  - Submit to admin for approval
  - Pending status until approved

**AI Features**:
- Automatic title generation from file
- Smart description creation
- File analysis and metadata extraction

**Key Actions**:
- Upload design images
- Upload embroidery file (ZIP/EMB)
- Set price and category
- Submit for admin approval
- Wait for approval before design goes live

---

### 11. MY DESIGNS PAGE
**Route**: `/seller/my-designs`
**Access**: Sellers only (protected route)

**Features**:
- Grid view of all uploaded designs
- Design status indicators:
  - **Pending**: Awaiting admin approval (yellow badge)
  - **Approved**: Live on marketplace (green badge)
  - **Rejected**: Not approved (red badge)

- **For Each Design**:
  - Thumbnail preview
  - Title
  - Price
  - Category
  - Status badge
  - Sales count
  - Edit button
  - Delete button

- **Edit Functionality**:
  - Update title
  - Update description
  - Change price
  - Update category/subcategory
  - Replace thumbnail image
  - Add/remove additional images
  - Replace design file
  - Note: Edited designs require re-approval

- **Delete Functionality**:
  - Permanent design removal
  - Confirmation required

**Key Actions**:
- View all uploaded designs
- Track approval status
- Edit design details
- Delete designs
- Monitor sales performance

---

### 12. EARNINGS & WITHDRAWALS PAGE
**Route**: `/seller/earnings` or `/seller/withdraw`
**Access**: Sellers only (protected route)

**Features**:
- **Earnings Summary Dashboard**:
  - Total Sales (gross revenue)
  - Platform Fee (30% deducted)
  - Available Balance (70% of sales)
  - Total Orders count

- **Sales History Table**:
  - Date of sale
  - Design title
  - Sale price
  - Platform fee amount
  - Seller earning (70%)
  - Status (Completed)

- **Withdrawal Request Section**:
  - Minimum withdrawal: ₹2000
  - Request withdrawal form
  - Amount validation
  - Balance check
  - Processing time: 2-3 business days

- **Withdrawal Process**:
  1. Check available balance
  2. Enter withdrawal amount (min ₹2000)
  3. Submit request
  4. Admin approval required
  5. Payment via Razorpay within 2-3 days

**Important Notes**:
- 30% platform fee already deducted from sales
- Minimum ₹2000 required to withdraw
- Withdrawals processed via Razorpay
- Must configure payment settings first

**Key Actions**:
- View total earnings
- Track sales history
- Request withdrawal
- Monitor withdrawal status

---

### 13. PAYMENT SETTINGS PAGE
**Route**: `/seller/payment-settings`
**Access**: Sellers only (protected route)

**Features**:
- **Bank Account Configuration**:
  - Account holder name
  - Account number
  - IFSC code
  - Bank name

- **Razorpay Integration**:
  - Payout account setup
  - Secure payment details storage
  - Required before first withdrawal

- **Account Status**:
  - Shows if payment details configured
  - Warning if not set up
  - Edit/update payment details

**Requirements**:
- Must configure before requesting withdrawals
- One-time setup (can be updated)
- Secure encryption of payment data

**Key Actions**:
- Add bank account details
- Configure Razorpay payout
- Update payment information
- Enable withdrawal requests

---

## COMPLETE ROUTE REFERENCE

### Public Routes (No Login Required)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with platform overview |
| `/explore` | Buy Design | Browse all approved designs |
| `/design/:designId` | Design Details | View specific design details |
| `/login` | Login | User authentication |
| `/signup` | Signup | New user registration |

### Buyer Routes (Login Required)
| Route | Page | Description |
|-------|------|-------------|
| `/my-purchases` | My Purchases | View and download purchased designs |
| `/purchase/:designId` | Purchase | Complete payment for a design |
| `/profile` | Profile | User account settings |
| `/seller/register` | Become a Seller | Register as a seller |

### Seller Routes (Seller Account Required)
| Route | Page | Description |
|-------|------|-------------|
| `/seller/upload` | Upload Design | Upload new embroidery designs |
| `/seller/my-designs` | My Designs | Manage uploaded designs |
| `/seller/earnings` | Earnings | View sales and earnings |
| `/seller/withdraw` | Withdrawals | Request payment withdrawals |
| `/seller/payment-settings` | Payment Settings | Configure bank/Razorpay details |

---

## COMMON USER FLOWS

### Flow 1: First-Time Buyer Purchase
1. Visit home page (`/`)
2. Click "Buy Design" → Navigate to `/explore`
3. Browse designs, apply filters
4. Click design → Navigate to `/design/:designId`
5. Click "Buy Now" → Redirect to `/login` (if not logged in)
6. Login or signup
7. Redirect to `/purchase/:designId`
8. Complete Razorpay payment
9. Automatic redirect to `/my-purchases`
10. Download design files

### Flow 2: Becoming a Seller
1. Login as a buyer
2. Click "Become a Seller" button in navbar
3. Navigate to `/seller/register`
4. Fill seller registration form
5. Submit and become a seller
6. Access seller features in navbar
7. Navigate to `/seller/upload` to start uploading

### Flow 3: Seller Upload & Earn
1. Login as seller
2. Navigate to `/seller/upload`
3. Upload thumbnail and additional images
4. Upload ZIP/EMB design file
5. AI processes file and generates title/description
6. Edit details, set category and price
7. Submit for admin approval
8. Wait for approval (check status in `/seller/my-designs`)
9. Once approved, design goes live on `/explore`
10. Buyers purchase design
11. Track earnings in `/seller/earnings`
12. Request withdrawal when balance ≥ ₹2000

### Flow 4: Seller Withdrawal
1. Navigate to `/seller/payment-settings`
2. Configure bank account and Razorpay details
3. Navigate to `/seller/earnings`
4. Check available balance
5. Click "Request Withdrawal"
6. Enter amount (min ₹2000)
7. Submit withdrawal request
8. Admin approves request
9. Receive payment in 2-3 business days

---

## DESIGN CATEGORIES & SUBCATEGORIES

### Fashion
- Dresses
- Shirts & Tops
- Jackets
- Accessories

### Home Decor
- Cushions
- Curtains
- Table Linens
- Wall Art

### Accessories
- Bags
- Hats
- Scarves
- Jewelry

### Seasonal
- Christmas
- Halloween
- Easter
- Valentine's Day

### Custom
- Monograms
- Names
- Logos
- Special Requests

---

## PAYMENT & PRICING

### For Buyers
- Prices set by individual sellers
- One-time payment per design
- Instant download after payment
- Unlimited re-downloads
- Secure Razorpay payment gateway

### For Sellers
- Set your own prices
- 70% earnings (30% platform fee)
- Minimum withdrawal: ₹2000
- Payment via Razorpay
- 2-3 business days processing

---

## FILE FORMATS & SPECIFICATIONS

### Supported Upload Formats
- ZIP files (containing embroidery files)
- EMB files (embroidery machine files)

### AI Processing Features
- Automatic stitch count detection
- Thread color analysis
- Design dimension extraction
- File format identification
- Smart title generation
- Intelligent description creation

---

## ACCOUNT TYPES

### Buyer Account
- Browse and purchase designs
- Download purchased files
- Manage profile
- Can upgrade to seller

### Seller Account
- All buyer features included
- Upload unlimited designs
- Set own prices
- Track earnings
- Request withdrawals
- Manage design inventory

---

## SUPPORT & HELP

### Common Questions

**Q: How do I purchase a design?**
A: Browse designs on `/explore`, click on a design to view details, click "Buy Now", login if needed, and complete payment via Razorpay.

**Q: Can I download my purchased designs multiple times?**
A: Yes! Visit `/my-purchases` anytime to download your designs again.

**Q: How do I become a seller?**
A: Login as a buyer, click "Become a Seller" in the navbar, fill the registration form at `/seller/register`, and start uploading designs.

**Q: What is the platform fee?**
A: Sellers pay 30% platform fee. You receive 70% of each sale.

**Q: When can I withdraw my earnings?**
A: You can request withdrawal when your available balance reaches ₹2000 or more. Visit `/seller/earnings` to request.

**Q: How long does withdrawal take?**
A: Withdrawals are processed within 2-3 business days via Razorpay after admin approval.

**Q: Do I need to set up payment details?**
A: Yes, configure your bank account and Razorpay details at `/seller/payment-settings` before requesting your first withdrawal.

**Q: What happens after I upload a design?**
A: Your design goes to admin for approval. Check status at `/seller/my-designs`. Once approved, it appears on the marketplace.

**Q: Can I edit my designs after uploading?**
A: Yes, but edited designs require re-approval from admin.

**Q: What file formats are supported?**
A: ZIP and EMB files containing embroidery designs.

---

## NAVIGATION STRUCTURE

### Main Navbar (All Users)
- Home (`/`)
- Buy Design (`/explore`)
- Login/Signup (if not logged in)

### Logged-in Buyer Navbar
- Home
- Buy Design
- Profile & Settings (`/profile`)
- My Purchases (`/my-purchases`)
- Become a Seller (`/seller/register`)
- Logout

### Seller Navbar
- Home
- Buy Design
- Profile & Settings
- My Purchases
- **Seller Options**:
  - My Designs (`/seller/my-designs`)
  - Upload Design (`/seller/upload`)
  - Earnings (`/seller/earnings`)
- Logout

---

## MOBILE EXPERIENCE

### Mobile Navigation
- Hamburger menu (3 lines) on mobile screens
- Right-side drawer menu
- Blur background overlay
- All navigation items accessible
- Responsive design for all screen sizes

### Mobile Features
- Touch-optimized interface
- Responsive image galleries
- Mobile-friendly forms
- Optimized payment flow
- Easy file uploads

---

## SECURITY & PRIVACY

### Authentication
- Secure JWT token-based authentication
- Password encryption
- Session management
- Protected routes for sellers

### Payment Security
- Razorpay integration (PCI DSS compliant)
- Secure payment processing
- Encrypted transaction data
- No credit card data stored on platform

### Data Protection
- User data encryption
- Secure file storage
- Privacy-compliant design
- HTTPS encryption

---

## PLATFORM POLICIES

### Seller Guidelines
- Upload only original or licensed designs
- Accurate design descriptions required
- Appropriate pricing
- Quality embroidery files
- Professional presentation

### Buyer Protection
- Instant file access after payment
- Unlimited downloads
- Quality assurance through admin approval
- Secure payment processing

### Content Moderation
- Admin approval required for all designs
- Quality control checks
- Copyright compliance
- Inappropriate content removal

---

## TECHNICAL SPECIFICATIONS

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

### File Size Limits
- Images: Optimized for web
- Design files: ZIP/EMB format
- Upload limits enforced

### Performance
- Fast page loads
- Optimized images
- Responsive design
- Mobile-first approach

---

## CHATBOT RESPONSE GUIDELINES

### When Users Ask About:

**Buying Designs**:
- Direct to `/explore` to browse
- Explain login requirement for purchase
- Guide through purchase flow
- Mention unlimited downloads

**Becoming a Seller**:
- Must login first
- Navigate to `/seller/register`
- Explain 30% platform fee
- Mention approval process

**Uploading Designs**:
- Direct to `/seller/upload`
- Explain AI processing features
- Mention admin approval requirement
- Guide through upload steps

**Earnings & Withdrawals**:
- Direct to `/seller/earnings`
- Explain ₹2000 minimum
- Mention 2-3 day processing
- Remind about payment settings

**Payment Issues**:
- Check `/seller/payment-settings`
- Verify bank details configured
- Ensure minimum balance met
- Contact support if needed

**Account Issues**:
- Direct to `/profile` for settings
- Explain buyer vs seller accounts
- Guide through registration
- Help with login problems

---

## END OF DOCUMENTATION

This comprehensive documentation covers all buyer and seller features, routes, and functionality of the Embroidex platform. Use this information to assist users with navigation, feature understanding, and troubleshooting.

**Last Updated**: March 24, 2026
**Platform**: Embroidex - India's #1 Embroidery Marketplace
**Version**: 1.0
