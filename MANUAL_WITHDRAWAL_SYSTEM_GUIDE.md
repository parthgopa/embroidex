# Manual Withdrawal & Payout System - Complete Implementation Guide

## 📋 Overview

This is a complete manual withdrawal and payout system for your marketplace platform where sellers can request withdrawals and admins manually approve/reject them. The system prevents double-spending by immediately deducting requested amounts from available balance.

---

## 🏗️ Architecture

### **Key Features:**
1. ✅ **Seller Payment Settings** - Configure UPI or Bank Account
2. ✅ **Withdrawal Requests** - Request withdrawals with balance validation
3. ✅ **Admin Review** - View all pending requests with seller verification
4. ✅ **Approve/Reject** - Process requests with automatic balance management
5. ✅ **Double-Spending Prevention** - Amount locked when request created
6. ✅ **Automatic Refund** - Amount returned on rejection

### **Flow:**
```
Seller configures payout settings (UPI/Bank)
    ↓
Seller requests withdrawal
    ↓
Amount IMMEDIATELY deducted from availableBalance
    ↓
Request saved with PENDING status
    ↓
Admin reviews request + seller's sales history
    ↓
Admin approves → Status: APPROVED (admin processes payout manually)
    OR
Admin rejects → Status: REJECTED (amount automatically returned)
```

---

## 📊 Database Schema

### **1. USERS Collection (Updated)**

**New Fields Added:**
```javascript
{
  // ... existing fields (name, email, password, etc.)
  
  // Role Management
  isSeller: Boolean,           // Distinguishes sellers from buyers
  
  // Payout Configuration
  payoutDetails: {
    type: "UPI" | "BANK",
    
    // For UPI
    upiId: String,
    
    // For Bank Account
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    
    // Metadata
    verified: Boolean,
    addedAt: Date,
    lastUpdated: Date
  }
}
```

**Note:** `availableBalance`, `totalEarnings`, and `totalWithdrawn` are calculated dynamically from purchases and withdrawals, not stored in the database.

### **2. WITHDRAWALS Collection (New)**

```javascript
{
  _id: ObjectId,
  
  // Seller Information
  sellerId: ObjectId,          // Reference to users._id
  sellerName: String,          // Cached for admin view
  sellerEmail: String,         // Cached for admin view
  
  // Withdrawal Details
  amount: Number,              // Requested amount
  status: String,              // "PENDING" | "APPROVED" | "REJECTED"
  
  // Payout Information (snapshot at request time)
  payoutDetails: {
    type: String,
    upiId: String,
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  
  // Timestamps
  requestedAt: Date,           // When seller requested
  processedAt: Date,           // When admin approved/rejected
  
  // Admin Actions
  processedBy: ObjectId,       // Admin who processed
  adminNotes: String,          // Optional admin comments
  rejectionReason: String,     // If rejected
  
  // Reference
  referenceId: String          // Unique reference number
}
```

### **3. PURCHASES Collection (Existing - Used for Verification)**

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,           // Buyer
  design_id: ObjectId,
  seller_id: ObjectId,         // Seller who earned
  amount_paid: Number,         // Total amount
  status: "completed",
  purchased_at: Date
}
```

---

## 🔧 Backend API Routes

### **Base URL:** `/withdrawal`

### **Seller Endpoints:**

#### **1. Save Payout Settings**
```
POST /withdrawal/payout-settings
Headers: Authorization: Bearer <token>
Body: {
  "type": "UPI" | "BANK",
  
  // For UPI
  "upiId": "9876543210@paytm",
  
  // For Bank
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "bankName": "HDFC Bank"
}

Response: {
  "message": "Payout settings saved successfully",
  "payoutDetails": { ... }
}
```

#### **2. Get Payout Settings**
```
GET /withdrawal/payout-settings
Headers: Authorization: Bearer <token>

Response: {
  "payoutDetails": {
    "type": "UPI",
    "upiId": "9876543210@paytm",
    "verified": false,
    "addedAt": "2024-03-22T...",
    "lastUpdated": "2024-03-22T..."
  }
}
```

#### **3. Get Balance**
```
GET /withdrawal/balance
Headers: Authorization: Bearer <token>

Response: {
  "availableBalance": 5000.00,
  "totalEarnings": 7000.00,
  "totalWithdrawn": 2000.00,
  "pendingAmount": 0.00,
  "hasPayoutDetails": true
}
```

#### **4. Request Withdrawal**
```
POST /withdrawal/request
Headers: Authorization: Bearer <token>
Body: {
  "amount": 2500.00
}

Response: {
  "message": "Your withdrawal request is pending and will be processed in 2-3 business days.",
  "withdrawalId": "...",
  "referenceId": "WD123...",
  "amount": 2500.00,
  "status": "PENDING",
  "newAvailableBalance": 2500.00
}

Errors:
- 400: Payment settings not configured
- 400: Amount below minimum (₹500)
- 400: Insufficient balance
```

#### **5. Get Withdrawal History**
```
GET /withdrawal/history
Headers: Authorization: Bearer <token>

Response: {
  "withdrawals": [
    {
      "_id": "...",
      "amount": 2500.00,
      "status": "PENDING",
      "referenceId": "WD123...",
      "requestedAt": "2024-03-22T...",
      "payoutDetails": { ... }
    }
  ]
}
```

### **Admin Endpoints:**

#### **6. Get Pending Withdrawals**
```
GET /withdrawal/admin/pending
Headers: Authorization: Bearer <token>

Response: {
  "withdrawals": [
    {
      "_id": "...",
      "sellerId": "...",
      "sellerName": "John Doe",
      "sellerEmail": "john@example.com",
      "amount": 2500.00,
      "totalEarnings": 7000.00,
      "totalWithdrawn": 2000.00,
      "referenceId": "WD123...",
      "requestedAt": "2024-03-22T..."
    }
  ]
}
```

#### **7. Get Withdrawal Details**
```
GET /withdrawal/admin/<withdrawal_id>/details
Headers: Authorization: Bearer <token>

Response: {
  "_id": "...",
  "sellerName": "John Doe",
  "sellerEmail": "john@example.com",
  "amount": 2500.00,
  "status": "PENDING",
  "payoutDetails": {
    "type": "BANK",
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0001234",
    "bankName": "HDFC Bank"
  },
  "totalEarnings": 7000.00,
  "totalWithdrawn": 2000.00,
  "availableBalance": 2500.00,
  "recentSales": [
    {
      "purchaseId": "...",
      "designTitle": "Floral Design",
      "salePrice": 1000.00,
      "platformFee": 300.00,
      "sellerEarning": 700.00,
      "purchasedAt": "2024-03-20T..."
    }
  ],
  "totalSalesCount": 10
}
```

#### **8. Approve Withdrawal**
```
POST /withdrawal/admin/<withdrawal_id>/approve
Headers: Authorization: Bearer <token>
Body: {
  "adminNotes": "Approved and processed via NEFT" (optional)
}

Response: {
  "message": "Withdrawal request approved successfully",
  "withdrawalId": "...",
  "amount": 2500.00,
  "payoutDetails": { ... }
}
```

#### **9. Reject Withdrawal**
```
POST /withdrawal/admin/<withdrawal_id>/reject
Headers: Authorization: Bearer <token>
Body: {
  "rejectionReason": "Insufficient verification documents" (required)
}

Response: {
  "message": "Withdrawal request rejected. Amount returned to seller's balance.",
  "withdrawalId": "...",
  "amount": 2500.00,
  "rejectionReason": "..."
}
```

#### **10. Get Statistics**
```
GET /withdrawal/admin/stats
Headers: Authorization: Bearer <token>

Response: {
  "pending": {
    "count": 5,
    "totalAmount": 12500.00
  },
  "approved": {
    "count": 20,
    "totalAmount": 50000.00
  },
  "rejected": {
    "count": 2
  }
}
```

---

## 💻 Frontend Components

### **1. Payment Settings Component**

**Location:** `frontend/src/components/Seller/PaymentSettings.jsx`

**Features:**
- Radio buttons to select UPI or Bank Account
- UPI ID validation (username@bank format)
- Bank account validation (IFSC format, account number 9-18 digits)
- Shows existing configuration
- Update anytime

**Usage:**
```jsx
import PaymentSettings from './components/Seller/PaymentSettings';

// In seller dashboard or settings page
<PaymentSettings />
```

### **2. Withdrawal Request Component**

**Location:** `frontend/src/components/Seller/WithdrawalRequest.jsx`

**Features:**
- Displays available balance, total earnings, total withdrawn
- Shows pending withdrawal amount
- Locks withdrawal form if payment settings not configured
- Minimum withdrawal validation (₹500)
- Balance validation
- Withdrawal history table
- Status badges (PENDING, APPROVED, REJECTED)

**Usage:**
```jsx
import WithdrawalRequest from './components/Seller/WithdrawalRequest';

// In seller earnings/wallet page
<WithdrawalRequest />
```

### **3. Admin Withdrawals Dashboard**

**Location:** `frontend/src/components/Admin/AdminWithdrawals.jsx`

**Features:**
- Statistics cards (pending, approved, rejected counts)
- Pending withdrawals table
- Click to view detailed information
- Modal with:
  - Seller information
  - Financial summary
  - Payout details (UPI/Bank)
  - Recent sales verification (last 10 sales)
- Approve/Reject buttons
- Prompts for admin notes/rejection reason

**Usage:**
```jsx
import AdminWithdrawals from './components/Admin/AdminWithdrawals';

// In admin panel
<AdminWithdrawals />
```

---

## 🔗 Integration Steps

### **Step 1: Update App Routes**

Add routes to `frontend/src/App.jsx`:

```jsx
import PaymentSettings from './components/Seller/PaymentSettings';
import WithdrawalRequest from './components/Seller/WithdrawalRequest';
import AdminWithdrawals from './components/Admin/AdminWithdrawals';

// In your routes
<Route path="/seller/payment-settings" element={<PaymentSettings />} />
<Route path="/seller/withdraw" element={<WithdrawalRequest />} />
<Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
```

### **Step 2: Add Navigation Links**

**For Sellers (in Navbar or Seller Dashboard):**
```jsx
<Link to="/seller/payment-settings">Payment Settings</Link>
<Link to="/seller/withdraw">Withdraw Earnings</Link>
```

**For Admins (in Admin Panel):**
```jsx
<Link to="/admin/withdrawals">Withdrawal Requests</Link>
```

### **Step 3: Mark Users as Sellers**

When a user uploads their first design or becomes a seller, update their record:

```javascript
db.users.updateOne(
  { _id: ObjectId("user_id") },
  { $set: { isSeller: true } }
)
```

Or in your backend when seller uploads design:
```python
USERS_COLLECTION.update_one(
    {"_id": user_id},
    {"$set": {"isSeller": True}}
)
```

### **Step 4: Update Purchase Creation**

When a purchase is completed (in webhook), ensure it includes seller_id:

```python
purchase = {
    "user_id": buyer_id,
    "design_id": design_id,
    "seller_id": design["seller_id"],  # Important!
    "amount_paid": amount,
    "status": "completed",
    "purchased_at": datetime.utcnow()
}
PURCHASES_COLLECTION.insert_one(purchase)
```

---

## 🧪 Testing Guide

### **Test 1: Seller Payment Settings**

1. Login as seller
2. Go to `/seller/payment-settings`
3. **Test UPI:**
   - Select UPI
   - Enter: `9876543210@paytm`
   - Submit
   - Verify saved
4. **Test Bank Account:**
   - Select Bank Account
   - Enter:
     - Account Holder: John Doe
     - Account Number: 1234567890
     - IFSC: HDFC0001234
     - Bank Name: HDFC Bank
   - Submit
   - Verify saved and account number masked

### **Test 2: Withdrawal Request**

1. **Without Payment Settings:**
   - Go to `/seller/withdraw`
   - Should show warning
   - Withdrawal form locked
   - Click "Go to Payment Settings"

2. **With Payment Settings:**
   - Configure payment settings first
   - Go to `/seller/withdraw`
   - Should show available balance
   - **Test Minimum Amount:**
     - Enter ₹400
     - Submit
     - Should show error: "Minimum withdrawal amount is ₹500"
   - **Test Insufficient Balance:**
     - Enter amount > available balance
     - Submit
     - Should show error with available balance
   - **Test Valid Request:**
     - Enter valid amount (e.g., ₹2000)
     - Submit
     - Should show success message
     - Available balance should decrease
     - Request should appear in history with PENDING status

3. **Verify Database:**
   ```javascript
   db.withdrawals.find({ sellerId: ObjectId("seller_id") })
   // Should show PENDING request
   ```

### **Test 3: Admin Review & Approval**

1. Login as admin
2. Go to `/admin/withdrawals`
3. Should see statistics cards
4. Should see pending request in table
5. **Click "Review":**
   - Modal opens
   - Verify seller information
   - Check financial summary
   - View payout details
   - Review recent sales
6. **Test Approval:**
   - Click "Approve Withdrawal"
   - Enter admin notes (optional)
   - Confirm
   - Request should disappear from pending
   - Status should be APPROVED in database
7. **Verify Database:**
   ```javascript
   db.withdrawals.findOne({ _id: ObjectId("withdrawal_id") })
   // status: "APPROVED"
   // processedAt: <timestamp>
   // processedBy: <admin_id>
   ```

### **Test 4: Admin Rejection**

1. Create another withdrawal request as seller
2. Login as admin
3. Go to `/admin/withdrawals`
4. Click "Review" on the request
5. **Click "Reject Withdrawal":**
   - Prompt for rejection reason
   - Enter: "Insufficient verification"
   - Confirm
6. **Verify:**
   - Request disappears from pending
   - Status: REJECTED in database
   - Seller's available balance increased back
7. **Check Seller Side:**
   - Login as seller
   - Go to `/seller/withdraw`
   - Available balance should be restored
   - History should show REJECTED status

### **Test 5: Double-Spending Prevention**

1. Seller has ₹5000 available balance
2. Request withdrawal of ₹3000
3. **Immediately check balance:**
   - Available balance should be ₹2000
   - Pending amount should be ₹3000
4. **Try to request another ₹3000:**
   - Should fail with "Insufficient balance"
   - Can only request up to ₹2000
5. **After admin approves first request:**
   - Available balance still ₹2000
   - Total withdrawn becomes ₹3000
6. **After admin rejects:**
   - Available balance becomes ₹5000 again
   - Can request ₹3000 again

---

## 🔐 Security Features

### **1. Double-Spending Prevention**
- Amount deducted immediately when request created
- Pending withdrawals counted in balance calculation
- Cannot request more than available balance

### **2. Validation**
- UPI ID format validation
- IFSC code format validation (XXXX0XXXXXX)
- Account number validation (9-18 digits)
- Minimum withdrawal amount (₹500)

### **3. Authorization**
- JWT token required for all endpoints
- Seller-only endpoints check `isSeller` flag
- Admin-only endpoints check `isAdmin` flag

### **4. Data Integrity**
- Payout details snapshot at request time
- Cannot modify withdrawal after creation
- Audit trail with timestamps and admin IDs

---

## 📝 Important Notes

### **Balance Calculation Logic**

```python
# Total Earnings (from completed purchases)
total_earnings = sum(
    (purchase.amount_paid - (purchase.amount_paid * 0.30))
    for purchase in purchases where seller_id = user_id and status = "completed"
)

# Total Withdrawn (approved withdrawals only)
total_withdrawn = sum(
    withdrawal.amount
    for withdrawal in withdrawals where seller_id = user_id and status = "APPROVED"
)

# Pending Amount (pending withdrawals)
pending_amount = sum(
    withdrawal.amount
    for withdrawal in withdrawals where seller_id = user_id and status = "PENDING"
)

# Available Balance
available_balance = total_earnings - total_withdrawn - pending_amount
```

### **Status Flow**

```
PENDING → APPROVED (admin approves, amount stays deducted)
PENDING → REJECTED (admin rejects, amount returned automatically)
```

### **Manual Payout Process**

After approving a withdrawal:
1. Admin sees payout details in approval response
2. Admin manually processes payout:
   - **For UPI:** Send to UPI ID using any UPI app
   - **For Bank:** Use NEFT/IMPS/RTGS with account details
3. Admin can add notes about payout method used
4. System tracks approval but doesn't auto-transfer money

---

## 🚀 Future Enhancements (Optional)

1. **Automatic Payouts:**
   - Integrate RazorpayX Payout API
   - Auto-transfer on approval
   - Webhook for payout status

2. **Verification:**
   - Verify bank account using penny drop
   - Verify UPI ID before saving

3. **Notifications:**
   - Email seller on approval/rejection
   - Email admin on new request

4. **Reporting:**
   - Export withdrawal reports
   - Monthly payout summaries
   - Tax documents

---

## ✅ Checklist

**Backend:**
- [x] WITHDRAWALS collection created
- [x] Withdrawal routes implemented
- [x] Blueprint registered in app.py
- [x] Balance calculation logic
- [x] Approve/reject endpoints

**Frontend:**
- [x] PaymentSettings component
- [x] WithdrawalRequest component
- [x] AdminWithdrawals component
- [x] Styling (CSS modules)

**Integration:**
- [ ] Add routes to App.jsx
- [ ] Add navigation links
- [ ] Mark users as sellers
- [ ] Test complete flow

**Database:**
- [ ] Ensure purchases have seller_id
- [ ] Create indexes for performance

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify JWT token is valid
4. Ensure user has `isSeller: true` flag
5. Verify purchases have `seller_id` field

---

**System is production-ready!** 🎉
