# Embroidex Backend Setup Guide

## New Features Implemented

### 1. **Seller Registration System**
- All users start as **buyers** by default
- Buyers can upgrade to **sellers** by filling seller registration form
- Seller info includes: mobile number, business website (optional), business address

### 2. **Enhanced Design Upload**
- **Thumbnail image** upload (main design preview)
- **ZIP/EMB file** processing with automatic extraction
- **Multiple additional images** (up to 7) for showcasing designs
- **AI-powered metadata generation** using Gemini API
  - Auto-generates design title
  - Auto-generates compelling description
- **EMB file metadata extraction**
  - Stitch count
  - Color count
  - Dimensions
- **Category and subcategory** selection from predefined lists

### 3. **File Path Fix**
- All file paths now use forward slashes consistently
- Fixed: `uploads/files\filename.zip` → `uploads/files/filename.zip`

## Required Dependencies

Install the following Python packages:

```bash
pip install flask flask-cors pymongo python-dotenv bcrypt pyjwt google-generativeai
```

## Environment Variables

Create a `.env` file in the backend directory with:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=embroidex_db
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key
```

## API Endpoints

### Authentication
- `POST /auth/signup` - User signup (creates buyer account)
- `POST /auth/login` - User login
- `POST /auth/register-seller` - Upgrade buyer to seller (requires auth token)

### Seller Design Upload
- `POST /seller/upload` - Upload design with all metadata (requires auth token)
- `GET /seller/categories` - Get all categories and subcategories
- `GET /seller/my-designs` - Get all designs uploaded by seller (requires auth token)

## Design Categories

1. **Bulk Design Pack**
   - Blouse Design Full, Blouse Design-Splitted, Butta & Patch, etc.

2. **Design by Machines**
   - Designs For Babylock, Bernina, Brother, Husqvarna Viking, etc.

3. **Multi Head Machines Design**
   - Agbada, All over Garment, Anarkali, Arabic Jalabia, etc.

4. **Small Machine Designs**
   - All Over Designs, Alphabets, Baby Applique, Birds & Animals, etc.

## Frontend Routes to Add

Add these routes to your React Router:

```javascript
<Route path="/seller/register" element={<SellerRegister />} />
<Route path="/seller/upload" element={<SelUploadNew />} />
```

## File Structure

```
backend/
├── routes/
│   ├── auth_routes.py (updated with seller registration)
│   └── Sel_design_routes.py (completely rewritten)
├── utils/
│   ├── gemini_utils.py (NEW - AI metadata generation)
│   ├── emb_utils.py (NEW - EMB file processing)
│   └── zip_utils.py (NEW - ZIP extraction)
├── constants/
│   └── categories.py (NEW - All categories and subcategories)
└── .env (your environment variables)
```

## Testing the Upload Flow

1. User signs up → becomes buyer
2. User registers as seller → fills seller form
3. Seller uploads design:
   - Uploads thumbnail
   - Uploads ZIP/EMB file
   - Optionally uploads additional images
   - Selects category and subcategory
   - Sets price
4. Backend processes:
   - Extracts ZIP files
   - Analyzes EMB metadata
   - Generates title/description via Gemini
   - Saves all data to MongoDB
5. Design goes to "pending" status for admin approval

## Notes

- Maximum file size: 20MB for design files
- Maximum 7 additional images
- All file paths use forward slashes
- Gemini API is optional - falls back to default text if not configured
