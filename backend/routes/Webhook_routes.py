from flask import Blueprint, request, jsonify
import hmac
import hashlib
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()
from config import TRANSACTIONS_COLLECTION, PURCHASES_COLLECTION, DESIGNS_COLLECTION

webhook_bp = Blueprint("webhook", __name__)

RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")


def verify_webhook_signature(payload, signature, secret):
    """Verify Razorpay webhook signature"""
    try:
        if not secret:
            return False

        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False


@webhook_bp.route("/razorpay", methods=["POST"])
def razorpay_webhook():
    """Handle Razorpay webhook events"""
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    if not webhook_signature:
        return jsonify({"error": "No signature"}), 400
    
    payload = request.get_data()
    if not verify_webhook_signature(payload, webhook_signature, RAZORPAY_WEBHOOK_SECRET):
        print("[WEBHOOK ERROR] Invalid signature received")
        return jsonify({"error": "Invalid signature"}), 400
    
    try:
        data = request.json
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400
    
    event = data.get("event")
    payload_data = data.get("payload", {})
    
    print(f"[WEBHOOK] Event received: '{event}'")
    
    try:
        if event == "payment.captured":
            handle_payment_captured(payload_data)
        elif event == "payment.failed":
            handle_payment_failed(payload_data)
        elif event == "order.paid":
            handle_order_paid(payload_data)
        
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        print(f"[WEBHOOK ERROR] Event '{event}' failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_payment_captured(payload):
    """Handle payment.captured event"""
    payment = payload.get("payment", {}).get("entity", {})
    
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    amount = payment.get("amount", 0) / 100
    status = payment.get("status")
    
    print(f"[WEBHOOK] Payment Captured: Payment ID {payment_id} | Order: {order_id} | Amount: ₹{amount}")
    
    if status != "captured":
        return
    
    transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": order_id})
    if not transaction:
        return
    
    if transaction.get("status") != "success":
        TRANSACTIONS_COLLECTION.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "status": "success",
                    "payment_id": payment_id,
                    "updated_at": datetime.utcnow(),
                    "webhook_received_at": datetime.utcnow()
                }
            }
        )
    
    design = DESIGNS_COLLECTION.find_one({"_id": transaction.get("design_id")})
    if not design:
        return
    
    existing_purchase = PURCHASES_COLLECTION.find_one({
        "order_id": order_id,
        "user_id": transaction.get("user_id")
    })
    if existing_purchase:
        return
    
    receipt_number = transaction.get("receipt") or payment.get("receipt") or f"RCPT-{order_id[-8:].upper()}"
    
    method = payment.get("method", "online")
    payment_detail = "Razorpay Online Payment"
    
    if method == "card":
        card = payment.get("card", {})
        last4 = card.get("last4", "")
        network = card.get("network", "Card")
        card_type = card.get("type", "").capitalize()
        payment_detail = f"{network} {card_type} (•••• {last4})" if last4 else f"{network} Card"
    elif method == "upi":
        vpa = payment.get("vpa", "")
        payment_detail = f"UPI ({vpa})" if vpa else "UPI Payment"
    elif method == "netbanking":
        bank = payment.get("bank", "Bank")
        payment_detail = f"Netbanking ({bank})"
    elif method == "wallet":
        wallet = payment.get("wallet", "Wallet")
        payment_detail = f"Wallet ({wallet.capitalize()})"

    purchase = {
        "user_id": transaction.get("user_id"),
        "design_id": transaction.get("design_id"),
        "seller_id": design.get("seller_id"),
        "transaction_id": transaction.get("_id"),
        "order_id": order_id,
        "payment_id": payment_id,
        "receipt": receipt_number,
        "payment_method": method,
        "payment_detail": payment_detail,
        "amount_paid": amount,
        "design_title": design.get("title"),
        "design_thumbnail": design.get("thumbnail"),
        "design_files": design.get("file_names", []),
        "zip_path": design.get("zip_path"),
        "status": "completed",
        "purchased_at": datetime.utcnow()
    }
    
    PURCHASES_COLLECTION.insert_one(purchase)
    print(f"[WEBHOOK] Purchase created in DB (Receipt: {receipt_number}) for Order: {order_id}")


def handle_payment_failed(payload):
    """Handle payment.failed event"""
    payment = payload.get("payment", {}).get("entity", {})
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    error_code = payment.get("error_code")
    error_description = payment.get("error_description")
    
    print(f"[WEBHOOK] Payment Failed for Order: {order_id} | Reason: {error_description}")
    
    TRANSACTIONS_COLLECTION.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "status": "failed",
                "payment_id": payment_id,
                "updated_at": datetime.utcnow(),
                "webhook_received_at": datetime.utcnow(),
                "failure_reason": f"{error_code}: {error_description}"
            }
        }
    )


def handle_order_paid(payload):
    """Handle order.paid event"""
    order = payload.get("order", {}).get("entity", {})
    order_id = order.get("id")
    status = order.get("status")
    
    TRANSACTIONS_COLLECTION.update_one(
        {"order_id": order_id},
        {"$set": {"order_status": status, "updated_at": datetime.utcnow()}}
    )


@webhook_bp.route("/test", methods=["GET"])
def test_webhook():
    """Test endpoint to verify webhook is accessible"""
    return jsonify({
        "status": "ok",
        "message": "Webhook endpoint is working",
        "endpoint": "/webhooks/razorpay"
    }), 200
