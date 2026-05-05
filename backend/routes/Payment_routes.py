from flask import Blueprint, request, jsonify
import razorpay
import hmac
import hashlib
from datetime import datetime
from bson import ObjectId

from config import DESIGNS_COLLECTION, USERS_COLLECTION, TRANSACTIONS_COLLECTION, PURCHASES_COLLECTION
from utils.jwt_utils import decode_token

payment_bp = Blueprint("payment", __name__)

# Razorpay credentials
RAZORPAY_KEY_ID = "rzp_test_STud3pKjWPTcMu"
RAZORPAY_KEY_SECRET = "baN8ZDLE8EvrW1fYmYUDVOVI"

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@payment_bp.route("/payout-details", methods=["GET"])
def get_payout_details():
    """Get logged-in user's saved payout details"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401

    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    payout_details = user.get("payoutDetails")

    if not payout_details:
        return jsonify({"payoutDetails": None}), 200

    response_details = payout_details.copy()
    if response_details.get("type") == "BANK" and "accountNumber" in response_details:
        acc_num = response_details["accountNumber"]
        response_details["accountNumber"] = acc_num[-4:].rjust(len(acc_num), '*')

    if response_details.get("addedAt"):
        response_details["addedAt"] = response_details["addedAt"].isoformat()
    if response_details.get("lastUpdated"):
        response_details["lastUpdated"] = response_details["lastUpdated"].isoformat()

    return jsonify({"payoutDetails": response_details}), 200


@payment_bp.route("/create-order", methods=["POST"])
def create_order():
    """Create Razorpay order for design purchase"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    design_id = data.get("design_id")
    
    if not design_id:
        return jsonify({"error": "Design ID is required"}), 400
    
    try:
        # Get design details
        design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
        if not design:
            return jsonify({"error": "Design not found"}), 404
        
        if design.get("status") != "approved":
            return jsonify({"error": "Design is not available for purchase"}), 403
        
        # Check if user already purchased this design
        # existing_purchase = PURCHASES_COLLECTION.find_one({
        #     "user_id": user_id,
        #     "design_id": ObjectId(design_id),
        #     "status": "completed"
        # })
        
        # if existing_purchase:
        #     return jsonify({"error": "You have already purchased this design"}), 400
        
        # Create Razorpay order
        amount = int(design["price"] * 100)  # Convert to paise
        order_data = {
            "amount": amount,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "design_id": design_id,
                "user_id": str(user_id),
                "design_title": design["title"]
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save transaction with pending status
        transaction = {
            "user_id": user_id,
            "design_id": ObjectId(design_id),
            "seller_id": design.get("seller_id"),
            "order_id": razorpay_order["id"],
            "amount": design["price"],
            "currency": "INR",
            "status": "pending",
            "payment_id": None,
            "payment_signature": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        TRANSACTIONS_COLLECTION.insert_one(transaction)
        
        return jsonify({
            "order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key": RAZORPAY_KEY_ID
        }), 200
        
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/verify", methods=["POST"])
def verify_payment():
    """Verify Razorpay payment and complete purchase"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    design_id = data.get("design_id")
    
    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, design_id]):
        return jsonify({"error": "Missing payment details"}), 400
    
    try:
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            # Update transaction as failed
            TRANSACTIONS_COLLECTION.update_one(
                {"order_id": razorpay_order_id},
                {
                    "$set": {
                        "status": "failed",
                        "updated_at": datetime.utcnow(),
                        "failure_reason": "Signature verification failed"
                    }
                }
            )
            return jsonify({"error": "Payment verification failed"}), 400
        
        # Get transaction
        transaction = TRANSACTIONS_COLLECTION.find_one({"order_id": razorpay_order_id})
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        
        # Get design details
        design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
        if not design:
            return jsonify({"error": "Design not found"}), 404
        
        # Update transaction with payment details
        # Note: Purchase record will be created by webhook handler
        TRANSACTIONS_COLLECTION.update_one(
            {"order_id": razorpay_order_id},
            {
                "$set": {
                    "payment_id": razorpay_payment_id,
                    "payment_signature": razorpay_signature,
                    "verified_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            "success": True,
            "message": "Payment verified successfully. Your purchase will be available shortly.",
            "order_id": razorpay_order_id
        }), 200
        
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
        # Update transaction as failed
        TRANSACTIONS_COLLECTION.update_one(
            {"order_id": razorpay_order_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.utcnow(),
                    "failure_reason": str(e)
                }
            }
        )
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/transaction/<transaction_id>", methods=["GET"])
def get_transaction(transaction_id):
    """Get transaction details"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        transaction = TRANSACTIONS_COLLECTION.find_one({
            "_id": ObjectId(transaction_id),
            "user_id": user_id
        })
        
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        
        # Convert ObjectId to string
        transaction["_id"] = str(transaction["_id"])
        transaction["user_id"] = str(transaction["user_id"])
        transaction["design_id"] = str(transaction["design_id"])
        if transaction.get("seller_id"):
            transaction["seller_id"] = str(transaction["seller_id"])
        
        # Convert datetime to string
        if transaction.get("created_at"):
            transaction["created_at"] = transaction["created_at"].isoformat()
        if transaction.get("updated_at"):
            transaction["updated_at"] = transaction["updated_at"].isoformat()
        
        return jsonify({"transaction": transaction}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/my-transactions", methods=["GET"])
def get_my_transactions():
    """Get all transactions for logged-in user"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        transactions = list(TRANSACTIONS_COLLECTION.find({"user_id": user_id}).sort("created_at", -1))
        
        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
            transaction["user_id"] = str(transaction["user_id"])
            transaction["design_id"] = str(transaction["design_id"])
            if transaction.get("seller_id"):
                transaction["seller_id"] = str(transaction["seller_id"])
            
            # Convert datetime to string
            if transaction.get("created_at"):
                transaction["created_at"] = transaction["created_at"].isoformat()
            if transaction.get("updated_at"):
                transaction["updated_at"] = transaction["updated_at"].isoformat()
        
        return jsonify({"transactions": transactions}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/my-purchases", methods=["GET"])
def get_my_purchases():
    """Get all purchases for logged-in user with design details"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        purchases = list(PURCHASES_COLLECTION.find({
            "user_id": user_id,
            "status": "completed"
        }).sort("purchased_at", -1))
        
        # Enrich with design details
        for purchase in purchases:
            purchase["_id"] = str(purchase["_id"])
            purchase["user_id"] = str(purchase["user_id"])
            purchase["design_id"] = str(purchase["design_id"])
            if purchase.get("seller_id"):
                purchase["seller_id"] = str(purchase["seller_id"])
            if purchase.get("transaction_id"):
                purchase["transaction_id"] = str(purchase["transaction_id"])
            
            # Get design thumbnail
            design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(purchase["design_id"])})
            if design:
                purchase["design_thumbnail"] = design.get("thumbnail")
            
            # Convert datetime to string
            if purchase.get("purchased_at"):
                purchase["purchased_at"] = purchase["purchased_at"].isoformat()
        
        return jsonify({"purchases": purchases}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/download/<purchase_id>", methods=["GET"])
def download_purchase(purchase_id):
    """Download purchased design files"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)

    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        from flask import send_file
        import os
        
        # Convert purchase_id to ObjectId
        try:
            purchase_obj_id = ObjectId(purchase_id)
            print("Purchase ID:", purchase_obj_id)
        except:
            return jsonify({"error": "Invalid purchase ID"}), 400
        
        print("User ID:", user_id)
        # Verify purchase belongs to user
        purchase = PURCHASES_COLLECTION.find_one({
            "_id": purchase_obj_id,
            "user_id": user_id
        })
        
        if not purchase:
            return jsonify({"error": "Purchase not found or access denied"}), 404
        
        # Get design to access file path
        design_id = purchase.get("design_id")
        design = DESIGNS_COLLECTION.find_one({"_id": design_id})
        
        if not design:
            return jsonify({"error": "Design not found"}), 404
        
        # Get design file path
        design_file_path = design.get("design_file_path")
        if not design_file_path:
            return jsonify({"error": "Design files not available"}), 404
        
        # Send file
        file_path = os.path.join(os.getcwd(), design_file_path)
        if not os.path.exists(file_path):
            print(f"File not found at: {file_path}")
            return jsonify({"error": "File not found on server"}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=f"{purchase.get('design_title', 'design')}.zip"
        )
        
    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({"error": str(e)}), 500
