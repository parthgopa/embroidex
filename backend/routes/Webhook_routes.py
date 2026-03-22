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
print("Razorpay Webhook Secret:", RAZORPAY_WEBHOOK_SECRET)


def verify_webhook_signature(payload, signature, secret):
    """Verify Razorpay webhook signature"""
    try:
        # Generate expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        print(f"Signature verification error: {str(e)}")
        return False


@webhook_bp.route("/razorpay", methods=["POST"])
def razorpay_webhook():
    """
    Handle Razorpay webhook events
    
    Webhook URL: https://29a7-49-36-82-75.ngrok-free.app/webhooks/razorpay
    
    Events handled:
    - payment.captured: Payment successful
    - payment.failed: Payment failed
    - order.paid: Order completed
    """
    
    # Get webhook signature from headers
    webhook_signature = request.headers.get('X-Razorpay-Signature')
    
    if not webhook_signature:
        print("No webhook signature found")
        return jsonify({"error": "No signature"}), 400
    
    # Get raw payload
    payload = request.get_data()
    
    # Verify signature
    if not verify_webhook_signature(payload, webhook_signature, RAZORPAY_WEBHOOK_SECRET):
        print("Invalid webhook signature")
        return jsonify({"error": "Invalid signature"}), 400
    
    # Parse JSON payload
    try:
        data = request.json
    except:
        print("Invalid JSON payload")
        return jsonify({"error": "Invalid JSON"}), 400
    
    event = data.get("event")
    payload_data = data.get("payload", {})
    
    print(f"Received webhook event: {event}")
    
    try:
        # Handle different webhook events
        if event == "payment.captured":
            handle_payment_captured(payload_data)
        
        elif event == "payment.failed":
            handle_payment_failed(payload_data)
        
        elif event == "order.paid":
            handle_order_paid(payload_data)
        
        else:
            print(f"Unhandled event: {event}")
        
        return jsonify({"status": "ok"}), 200
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_payment_captured(payload):
    """Handle payment.captured event"""
    payment = payload.get("payment", {}).get("entity", {})
    
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    amount = payment.get("amount", 0) / 100  # Convert from paise to rupees
    status = payment.get("status")
    
    print(f"Payment captured: {payment_id}, Order: {order_id}, Amount: ₹{amount}")
    
    if status != "captured":
        print(f"Payment status is not captured: {status}")
        return
    
    # Find transaction by order_id
    transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": order_id})
    
    if not transaction:
        print(f"Transaction not found for order_id: {order_id}")
        return
    
    # Check if already processed
    if transaction.get("status") == "success":
        print(f"Transaction already processed: {order_id}")
        return
    
    # Update transaction status
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
    
    # Get design details
    design = DESIGNS_COLLECTION.find_one({"_id": transaction.get("design_id")})
    
    if not design:
        print(f"Design not found: {transaction.get('design_id')}")
        return
    
    # Check if purchase already exists
    existing_purchase = PURCHASES_COLLECTION.find_one({
        "order_id": order_id,
        "user_id": transaction.get("user_id")
    })
    
    if existing_purchase:
        print(f"Purchase already exists for order: {order_id}")
        return
    
    # Create purchase record
    purchase = {
        "user_id": transaction.get("user_id"),
        "design_id": transaction.get("design_id"),
        "seller_id": design.get("seller_id"),
        "transaction_id": transaction.get("_id"),
        "order_id": order_id,
        "payment_id": payment_id,
        "amount_paid": amount,
        "design_title": design.get("title"),
        "design_files": design.get("file_names", []),
        "zip_path": design.get("zip_path"),
        "status": "completed",
        "purchased_at": datetime.utcnow()
    }
    
    PURCHASES_COLLECTION.insert_one(purchase)
    
    print(f"Purchase created successfully for order: {order_id}")


def handle_payment_failed(payload):
    """Handle payment.failed event"""
    payment = payload.get("payment", {}).get("entity", {})
    
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    error_code = payment.get("error_code")
    error_description = payment.get("error_description")
    
    print(f"Payment failed: {payment_id}, Order: {order_id}, Error: {error_description}")
    
    # Find transaction by order_id
    transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": order_id})
    
    if not transaction:
        print(f"Transaction not found for order_id: {order_id}")
        return
    
    # Update transaction status
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
    
    print(f"Transaction marked as failed: {order_id}")


def handle_order_paid(payload):
    """Handle order.paid event"""
    order = payload.get("order", {}).get("entity", {})
    
    order_id = order.get("id")
    amount = order.get("amount", 0) / 100
    status = order.get("status")
    
    print(f"Order paid: {order_id}, Amount: ₹{amount}, Status: {status}")
    
    # This event is triggered when order is fully paid
    # We can use this as additional confirmation
    transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": order_id})
    
    if transaction:
        TRANSACTIONS_COLLECTION.update_one(
            {"order_id": order_id},
            {
                "$set": {
                    "order_status": status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"Order status updated: {order_id}")


@webhook_bp.route("/test", methods=["GET"])
def test_webhook():
    """Test endpoint to verify webhook is accessible"""
    return jsonify({
        "status": "ok",
        "message": "Webhook endpoint is working",
        "endpoint": "/webhooks/razorpay"
    }), 200
