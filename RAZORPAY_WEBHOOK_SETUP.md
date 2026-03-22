# Razorpay Webhook Setup Guide

## 🎯 Overview

This guide explains how to configure Razorpay webhooks to automatically receive payment notifications and update your database when transactions are completed.

---

## ✅ What's Implemented

### **Webhook Endpoint:**
- **URL:** `https://29a7-49-36-82-75.ngrok-free.app/webhooks/razorpay`
- **Method:** POST
- **Security:** Signature verification using HMAC-SHA256

### **Events Handled:**
1. `payment.captured` - Payment successful
2. `payment.failed` - Payment failed
3. `order.paid` - Order completed

### **What Happens:**
- ✅ Webhook signature is verified for security
- ✅ Transaction status updated in database
- ✅ Purchase record created automatically
- ✅ Only processes if signature is valid
- ✅ Prevents duplicate processing

---

## 🔧 Razorpay Dashboard Configuration

### **Step 1: Login to Razorpay Dashboard**
1. Go to https://dashboard.razorpay.com/
2. Login with your credentials
3. Switch to **Test Mode** (for testing)

### **Step 2: Navigate to Webhooks**
1. Click on **Settings** (gear icon)
2. Select **Webhooks** from the left menu
3. Click **+ Add New Webhook**

### **Step 3: Configure Webhook**

**Webhook URL:**
```
https://29a7-49-36-82-75.ngrok-free.app/webhooks/razorpay
```

**Active Events to Select:**
- ✅ `payment.captured`
- ✅ `payment.failed`
- ✅ `order.paid`

**Alert Email:** (Optional)
- Enter your email to receive alerts

**Secret:** (IMPORTANT)
- Razorpay will generate a webhook secret
- **Copy this secret** - you'll need it for verification
- Keep it secure, don't share it

### **Step 4: Save Webhook**
1. Click **Create Webhook**
2. Webhook is now active
3. Copy the **Webhook Secret**

---

## 🔐 Update Backend with Webhook Secret

### **Option 1: Use Same Secret as API Key (Current)**
The webhook currently uses `RAZORPAY_KEY_SECRET` for verification.

### **Option 2: Use Separate Webhook Secret (Recommended)**

**Update `.env` file:**
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Update `Webhook_routes.py`:**
```python
import os
from dotenv import load_dotenv

load_dotenv()
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")

# Use in verification
verify_webhook_signature(payload, webhook_signature, RAZORPAY_WEBHOOK_SECRET)
```

---

## 🧪 Testing Webhooks

### **Method 1: Using ngrok**

**1. Start ngrok:**
```bash
ngrok http 5000
```

**2. Copy ngrok URL:**
```
https://29a7-49-36-82-75.ngrok-free.app
```

**3. Update Razorpay webhook URL:**
```
https://29a7-49-36-82-75.ngrok-free.app/webhooks/razorpay
```

**4. Test webhook endpoint:**
```bash
curl https://29a7-49-36-82-75.ngrok-free.app/webhooks/test
```

Expected response:
```json
{
  "status": "ok",
  "message": "Webhook endpoint is working",
  "endpoint": "/webhooks/razorpay"
}
```

### **Method 2: Razorpay Dashboard Test**

1. Go to Webhooks section
2. Click on your webhook
3. Click **Send Test Webhook**
4. Select event type (e.g., `payment.captured`)
5. Click **Send**
6. Check backend logs for webhook receipt

### **Method 3: Real Payment Test**

1. Make a test purchase on your app
2. Complete payment with test card: `4111 1111 1111 1111`
3. Check backend logs for webhook
4. Verify database updates:
   ```javascript
   db.transactions.find({ status: "success" })
   db.purchases.find({ status: "completed" })
   ```

---

## 📊 Webhook Flow Diagram

```
User Completes Payment
        ↓
Razorpay Processes Payment
        ↓
Razorpay Sends Webhook → Your Backend (/webhooks/razorpay)
        ↓
Backend Verifies Signature (HMAC-SHA256)
        ↓
    Valid?
    ├── YES → Process Event
    │         ├── Update Transaction Status
    │         ├── Create Purchase Record
    │         └── Return 200 OK
    │
    └── NO  → Reject Request
              └── Return 400 Bad Request
```

---

## 🔍 Webhook Payload Examples

### **payment.captured Event:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "order_id": "order_xxxxxxxxxxxxx",
        "amount": 100000,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "email": "buyer@example.com",
        "contact": "+919999999999",
        "created_at": 1234567890
      }
    }
  }
}
```

### **payment.failed Event:**
```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "order_id": "order_xxxxxxxxxxxxx",
        "amount": 100000,
        "status": "failed",
        "error_code": "BAD_REQUEST_ERROR",
        "error_description": "Payment failed"
      }
    }
  }
}
```

---

## 🛡️ Security Features

### **1. Signature Verification**
Every webhook includes `X-Razorpay-Signature` header:
```python
webhook_signature = request.headers.get('X-Razorpay-Signature')
```

### **2. HMAC-SHA256 Verification**
```python
expected_signature = hmac.new(
    secret.encode('utf-8'),
    payload,
    hashlib.sha256
).hexdigest()

# Compare signatures
hmac.compare_digest(expected_signature, webhook_signature)
```

### **3. Duplicate Prevention**
```python
# Check if already processed
if transaction.get("status") == "success":
    print(f"Transaction already processed: {order_id}")
    return
```

### **4. Order Validation**
```python
# Verify order exists
transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": order_id})
if not transaction:
    return  # Reject invalid order
```

---

## 📝 Backend Logs

### **Successful Webhook:**
```
Received webhook event: payment.captured
Payment captured: pay_xxxxx, Order: order_xxxxx, Amount: ₹1000
Purchase created successfully for order: order_xxxxx
```

### **Failed Signature:**
```
Invalid webhook signature
```

### **Duplicate Processing:**
```
Transaction already processed: order_xxxxx
```

---

## 🚨 Troubleshooting

### **Issue 1: Webhook not received**
**Solutions:**
- Check ngrok is running
- Verify webhook URL in Razorpay dashboard
- Check firewall settings
- Verify backend is running on port 5000

### **Issue 2: Signature verification failed**
**Solutions:**
- Verify webhook secret is correct
- Check if using correct secret (API key vs webhook secret)
- Ensure payload is not modified

### **Issue 3: Transaction not updating**
**Solutions:**
- Check MongoDB connection
- Verify order_id exists in transactions collection
- Check backend logs for errors

### **Issue 4: Duplicate purchases created**
**Solutions:**
- Webhook handler already prevents duplicates
- Check logs for "already processed" message

---

## 🔄 Webhook Retry Logic

Razorpay automatically retries failed webhooks:
- **Retry Attempts:** Up to 5 times
- **Retry Interval:** Exponential backoff
- **Success Criteria:** HTTP 200 response

**Important:** Always return `200 OK` even if you skip processing (e.g., duplicate)

---

## 📊 Database Updates

### **Transaction Collection Update:**
```javascript
{
  order_id: "order_xxxxx",
  status: "success",  // Updated from "pending"
  payment_id: "pay_xxxxx",  // Added
  webhook_received_at: ISODate("2024-03-21T15:30:00Z"),  // Added
  updated_at: ISODate("2024-03-21T15:30:00Z")
}
```

### **Purchase Collection Created:**
```javascript
{
  user_id: ObjectId("..."),
  design_id: ObjectId("..."),
  seller_id: ObjectId("..."),
  order_id: "order_xxxxx",
  payment_id: "pay_xxxxx",
  amount_paid: 1000,
  design_title: "Beautiful Flower Design",
  status: "completed",
  purchased_at: ISODate("2024-03-21T15:30:00Z")
}
```

---

## 🎯 Production Deployment

### **1. Use Production Webhook URL**
Replace ngrok URL with your production domain:
```
https://yourdomain.com/webhooks/razorpay
```

### **2. Switch to Live Mode**
- Change Razorpay to Live Mode
- Update webhook with live credentials
- Use live API keys

### **3. Enable HTTPS**
- Razorpay requires HTTPS for webhooks
- Use SSL certificate (Let's Encrypt, etc.)

### **4. Monitor Webhooks**
- Set up logging
- Monitor failed webhooks in Razorpay dashboard
- Set up alerts for failures

---

## 📞 Support

**Razorpay Webhook Documentation:**
https://razorpay.com/docs/webhooks/

**Test Webhook Events:**
https://razorpay.com/docs/webhooks/test/

**Webhook Signature Verification:**
https://razorpay.com/docs/webhooks/validate-test/

---

## ✅ Checklist

- [ ] ngrok running and URL copied
- [ ] Webhook created in Razorpay dashboard
- [ ] Webhook URL configured: `https://29a7-49-36-82-75.ngrok-free.app/webhooks/razorpay`
- [ ] Events selected: payment.captured, payment.failed, order.paid
- [ ] Webhook secret copied (if using separate secret)
- [ ] Backend running on port 5000
- [ ] Test webhook endpoint accessible
- [ ] Test payment completed successfully
- [ ] Database updated with transaction and purchase
- [ ] Logs showing webhook received

---

## 🎉 Success Indicators

✅ Webhook endpoint returns 200 OK  
✅ Backend logs show "Received webhook event"  
✅ Transaction status updated to "success"  
✅ Purchase record created in database  
✅ No signature verification errors  
✅ No duplicate processing  

**Your webhook system is now fully operational!** 🚀
