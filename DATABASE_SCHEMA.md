# Database Schema for Manual Withdrawal System

## Collections/Tables

### 1. USERS Collection (Updated)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  
  // Role Management
  isSeller: Boolean,           // NEW: Distinguishes sellers from buyers
  isAdmin: Boolean,
  
  // Seller Financial Data
  availableBalance: Number,    // NEW: Current withdrawable balance
  totalEarnings: Number,       // NEW: Lifetime earnings
  totalWithdrawn: Number,      // NEW: Total amount withdrawn
  
  // Payout Configuration
  payoutDetails: {             // NEW: UPI or Bank Account
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
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. WITHDRAWALS Collection (New)
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

### 3. PURCHASES Collection (Existing - for verification)
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,           // Buyer
  design_id: ObjectId,
  seller_id: ObjectId,         // Seller who earned
  amount_paid: Number,         // Total amount
  seller_earning: Number,      // Amount after platform fee
  platform_fee: Number,        // 30% fee
  status: String,
  purchased_at: Date
}
```

### 4. DESIGNS Collection (Existing - for reference)
```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,
  title: String,
  price: Number,
  status: String
}
```

## Indexes for Performance

```javascript
// Users
db.users.createIndex({ "isSeller": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })

// Withdrawals
db.withdrawals.createIndex({ "sellerId": 1, "requestedAt": -1 })
db.withdrawals.createIndex({ "status": 1, "requestedAt": -1 })
db.withdrawals.createIndex({ "referenceId": 1 }, { unique: true })

// Purchases
db.purchases.createIndex({ "seller_id": 1, "purchased_at": -1 })
db.purchases.createIndex({ "status": 1 })
```

## Data Flow

### When a Sale Happens:
1. Purchase created with `seller_earning` calculated
2. Seller's `availableBalance` += `seller_earning`
3. Seller's `totalEarnings` += `seller_earning`

### When Withdrawal Requested:
1. Check `availableBalance` >= `amount`
2. Deduct from `availableBalance` immediately
3. Create PENDING withdrawal record
4. Prevents double-spending

### When Admin Approves:
1. Update status to APPROVED
2. Set `processedAt`
3. Seller's `totalWithdrawn` += `amount`
4. Admin processes actual payout manually

### When Admin Rejects:
1. Update status to REJECTED
2. Add `amount` back to seller's `availableBalance`
3. Set `rejectionReason`
4. Seller can request again
