# Razorpay Payout (RazorpayX) Implementation Guide

## 🎯 What is RazorpayX Payout?

RazorpayX Payout allows you to transfer money from your Razorpay account to seller bank accounts, UPI IDs, or wallets. This is what you need for seller withdrawals.

---

## 🔑 Step-by-Step Setup for Test Mode

### **Step 1: Enable RazorpayX**

**IMPORTANT:** RazorpayX is a separate product from Razorpay Payments.

1. **Login to Razorpay Dashboard:**
   - Go to https://dashboard.razorpay.com/
   - Login with your account

2. **Switch to Test Mode:**
   - Toggle to **Test Mode** (top right)

3. **Access RazorpayX:**
   - Click on **RazorpayX** in the left sidebar
   - OR go to https://x.razorpay.com/

4. **Activate RazorpayX (Test Mode):**
   - You'll see "Activate RazorpayX"
   - Click **Activate** for test mode
   - No KYC required for test mode
   - Instant activation

---

### **Step 2: Get Payout API Credentials**

**For Test Mode:**

1. **Navigate to Settings:**
   - In RazorpayX dashboard → Settings → API Keys

2. **Generate API Keys:**
   - You'll see **different keys** for RazorpayX
   - These are **NOT the same** as payment API keys
   - Click **Generate Test Key**

3. **Copy Credentials:**
   ```
   Key ID: rzp_test_xxxxxxxxxx (RazorpayX key)
   Key Secret: xxxxxxxxxxxxxxxxxx (RazorpayX secret)
   ```

**IMPORTANT NOTES:**
- ✅ RazorpayX has **separate API keys** from Razorpay Payments
- ✅ You can use the **same Razorpay account** for both
- ✅ Test mode doesn't require KYC or bank verification
- ✅ Test mode has virtual balance for testing

---

### **Step 3: Understanding Test Mode Limitations**

**Test Mode Features:**
- ✅ Create contacts
- ✅ Create fund accounts
- ✅ Initiate payouts
- ✅ Test all API flows
- ✅ Virtual balance (no real money)

**Test Mode Limitations:**
- ❌ No real money transferred
- ❌ Payouts show as "processed" but don't reach bank
- ❌ Can't test actual bank transfers

**For Production:**
- Complete KYC verification
- Add real bank account
- Get live API keys
- Real money transfers

---

### **Step 4: Alternative Approach (Recommended for Testing)**

Since RazorpayX Test Mode might require account setup, here's a **hybrid approach**:

**Option A: Simulate Payout (Current)**
- Use test mode simulation
- Store withdrawal requests in database
- Manual approval process
- Good for development

**Option B: Use Razorpay Payout API (Production-Ready)**
- Implement full Payout API
- Use test credentials when available
- Ready for production deployment

**Option C: Use Fund Account Validation**
- Verify seller bank accounts
- Store validated accounts
- Process payouts when live

---

## 💻 Implementation Code

### **1. Update .env File**

```env
# Razorpay Payment Keys (existing)
RAZORPAY_KEY_ID=rzp_test_STud3pKjWPTcMu
RAZORPAY_KEY_SECRET=baN8ZDLE8EvrW1fYmYUDVOVI

# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=embroidex

# RazorpayX Payout Keys (add these when you get them)
RAZORPAYX_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAYX_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAYX_ACCOUNT_NUMBER=xxxxxxxxxxxxxxxxxx
```

### **2. Install Dependencies**

Razorpay SDK already installed supports Payout:
```bash
pip install razorpay
```

### **3. Implementation Options**

---

## 🚀 Implementation Option 1: Full Payout Integration

**When to use:** When you have RazorpayX test credentials

```python
import razorpay
import os

# Initialize Payout client
payout_client = razorpay.Client(auth=(
    os.getenv("RAZORPAYX_KEY_ID"),
    os.getenv("RAZORPAYX_KEY_SECRET")
))

# Step 1: Create Contact
contact = payout_client.contact.create({
    "name": "Seller Name",
    "email": "seller@example.com",
    "contact": "9999999999",
    "type": "vendor",
    "reference_id": str(seller_id)
})

# Step 2: Create Fund Account
fund_account = payout_client.fund_account.create({
    "contact_id": contact['id'],
    "account_type": "bank_account",
    "bank_account": {
        "name": "Seller Name",
        "ifsc": "HDFC0000123",
        "account_number": "1234567890"
    }
})

# Step 3: Create Payout
payout = payout_client.payout.create({
    "account_number": os.getenv("RAZORPAYX_ACCOUNT_NUMBER"),
    "fund_account_id": fund_account['id'],
    "amount": amount * 100,  # in paise
    "currency": "INR",
    "mode": "IMPS",
    "purpose": "payout",
    "queue_if_low_balance": True,
    "reference_id": withdrawal_id,
    "narration": "Seller earnings withdrawal"
})
```

---

## 🎯 Implementation Option 2: Hybrid Approach (Recommended)

**Best for current situation:**

1. **Collect seller bank details**
2. **Store withdrawal requests**
3. **Validate bank accounts** (using Razorpay Fund Account Validation)
4. **Process payouts** when RazorpayX is fully set up

**Advantages:**
- ✅ Works without RazorpayX setup
- ✅ Collects necessary data
- ✅ Easy to upgrade to real payouts
- ✅ Better user experience

---

## 📋 What I'll Implement Now

Since RazorpayX requires additional setup, I'll implement:

### **Phase 1: Bank Account Collection (Immediate)**
- Add seller bank account form
- Store bank details securely
- Validate IFSC codes
- Show pending withdrawals

### **Phase 2: Withdrawal Request System (Immediate)**
- Create withdrawal requests
- Store in WITHDRAWALS collection
- Show withdrawal history
- Admin approval workflow

### **Phase 3: Razorpay Payout Integration (When Ready)**
- Use collected bank details
- Integrate Payout API
- Automatic transfers
- Webhook for payout status

---

## 🔧 Immediate Implementation

I'll now implement:

1. ✅ **Seller Bank Account Form**
   - Collect account number, IFSC, account holder name
   - Validate IFSC format
   - Store securely in database

2. ✅ **Withdrawal Request System**
   - Create withdrawal requests
   - Save to WITHDRAWALS collection
   - Show status: pending, approved, completed, rejected

3. ✅ **Withdrawal History Page**
   - View all withdrawal requests
   - Track status
   - Show processing timeline

4. ✅ **Admin Withdrawal Management** (Optional)
   - View all withdrawal requests
   - Approve/reject requests
   - Process payouts

---

## 📊 Database Schema

### **WITHDRAWALS Collection:**
```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,
  amount: Number,
  status: "pending" | "approved" | "processing" | "completed" | "rejected",
  bank_account: {
    account_number: String,
    ifsc: String,
    account_holder_name: String,
    bank_name: String
  },
  requested_at: DateTime,
  approved_at: DateTime,
  processed_at: DateTime,
  completed_at: DateTime,
  payout_id: String,  // Razorpay payout ID when processed
  reference_id: String,
  notes: String,
  rejection_reason: String
}
```

### **SELLERS Collection Update:**
```javascript
{
  // ... existing fields
  bank_account: {
    account_number: String,
    ifsc: String,
    account_holder_name: String,
    bank_name: String,
    verified: Boolean,
    added_at: DateTime
  }
}
```

---

## 🎯 Summary

**Current Situation:**
- RazorpayX requires separate setup
- Test mode available but needs activation
- Different API keys from payment API

**My Recommendation:**
1. **Implement bank account collection** (now)
2. **Create withdrawal request system** (now)
3. **Set up RazorpayX later** when needed
4. **Integrate Payout API** when credentials available

**This approach:**
- ✅ Works immediately
- ✅ Collects necessary data
- ✅ Professional user experience
- ✅ Easy to upgrade later

---

## 📞 Getting RazorpayX Credentials

**If you want to set up RazorpayX now:**

1. Go to https://x.razorpay.com/
2. Login with your Razorpay account
3. Activate RazorpayX (test mode)
4. Go to Settings → API Keys
5. Generate test keys
6. Copy Key ID and Secret
7. Add to .env file

**Contact Razorpay:**
- Email: support@razorpay.com
- Ask about: "RazorpayX Payout Test Mode activation"

---

Let me now implement the immediate solution!
