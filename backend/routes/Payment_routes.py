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
@payment_bp.route("/cart/create-order", methods=["POST"])
def create_order():
    """Create Razorpay order for single design or multi-item cart purchase"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json or {}
    design_id = data.get("design_id")
    design_ids = data.get("design_ids")
    
    if not design_id and not design_ids:
        return jsonify({"error": "Design ID or Design IDs array is required"}), 400
    
    if design_id and not design_ids:
        design_ids = [design_id]

    try:
        object_ids = []
        for d_id in design_ids:
            try:
                object_ids.append(ObjectId(d_id))
            except:
                pass

        if not object_ids:
            return jsonify({"error": "Invalid Design IDs"}), 400

        # Get design details for all requested designs
        designs = list(DESIGNS_COLLECTION.find({
            "_id": {"$in": object_ids},
            "status": "approved"
        }))

        if not designs:
            return jsonify({"error": "No valid approved designs found for purchase"}), 404

        total_price = sum(float(d.get("price", 0)) for d in designs)
        amount_paise = int(total_price * 100)
        
        import uuid
        receipt = f"RCPT-{uuid.uuid4().hex[:8].upper()}"
        
        titles = [d.get("title", "Design") for d in designs]
        notes_title = ", ".join(titles)[:100]

        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1,
            "notes": {
                "user_id": str(user_id),
                "design_ids": ",".join([str(d["_id"]) for d in designs]),
                "design_titles": notes_title
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Save transaction with pending status
        transaction = {
            "user_id": user_id,
            "design_ids": [d["_id"] for d in designs],
            "design_id": designs[0]["_id"], # Backwards compatibility
            "order_id": razorpay_order["id"],
            "receipt": receipt,
            "amount": total_price,
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
            "receipt": receipt,
            "amount": amount_paise,
            "currency": "INR",
            "key": RAZORPAY_KEY_ID,
            "key_id": RAZORPAY_KEY_ID
        }), 200
        
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        return jsonify({"error": str(e)}), 500


@payment_bp.route("/verify", methods=["POST"])
@payment_bp.route("/cart/verify", methods=["POST"])
@payment_bp.route("/verify-payment", methods=["POST"])
def verify_payment():
    """Verify Razorpay payment and complete purchase for all designs in order"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json or {}
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")
    
    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({"error": "Missing payment details"}), 400
    
    try:
        # Verify signature
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
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
        
        receipt_number = transaction.get("receipt") or f"RCPT-{razorpay_order_id[-8:].upper()}"
        
        # Fetch payment details from Razorpay client
        method = "online"
        payment_detail = "Razorpay Online Payment"
        try:
            p_info = razorpay_client.payment.fetch(razorpay_payment_id)
            method = p_info.get("method", "online")
            if method == "card":
                card = p_info.get("card", {})
                last4 = card.get("last4", "")
                network = card.get("network", "Card")
                card_type = card.get("type", "").capitalize()
                payment_detail = f"{network} {card_type} (•••• {last4})" if last4 else f"{network} Card"
            elif method == "upi":
                vpa = p_info.get("vpa", "")
                payment_detail = f"UPI ({vpa})" if vpa else "UPI Payment"
            elif method == "netbanking":
                bank = p_info.get("bank", "Bank")
                payment_detail = f"Netbanking ({bank})"
            elif method == "wallet":
                wallet = p_info.get("wallet", "Wallet")
                payment_detail = f"Wallet ({wallet.capitalize()})"
        except Exception as fetch_err:
            print(f"Error fetching payment details from Razorpay: {fetch_err}")

        # Extract target design IDs
        raw_design_ids = transaction.get("design_ids")
        if not raw_design_ids and transaction.get("design_id"):
            raw_design_ids = [transaction.get("design_id")]

        target_design_ids = [ObjectId(d_id) for d_id in raw_design_ids if d_id]
        designs = list(DESIGNS_COLLECTION.find({"_id": {"$in": target_design_ids}}))

        # Insert purchase records for each design
        for design in designs:
            existing_purchase = PURCHASES_COLLECTION.find_one({
                "order_id": razorpay_order_id,
                "user_id": user_id,
                "design_id": design["_id"]
            })
            if not existing_purchase:
                purchase = {
                    "user_id": user_id,
                    "design_id": design["_id"],
                    "seller_id": design.get("seller_id"),
                    "transaction_id": transaction.get("_id"),
                    "order_id": razorpay_order_id,
                    "payment_id": razorpay_payment_id,
                    "receipt": receipt_number,
                    "payment_method": method,
                    "payment_detail": payment_detail,
                    "amount_paid": design.get("price", 0),
                    "design_title": design.get("title"),
                    "design_thumbnail": design.get("thumbnail"),
                    "design_files": design.get("file_names", []),
                    "zip_path": design.get("zip_path"),
                    "status": "completed",
                    "purchased_at": datetime.utcnow()
                }
                PURCHASES_COLLECTION.insert_one(purchase)
        
        # Update transaction with payment status
        TRANSACTIONS_COLLECTION.update_one(
            {"order_id": razorpay_order_id},
            {
                "$set": {
                    "status": "success",
                    "payment_id": razorpay_payment_id,
                    "payment_signature": razorpay_signature,
                    "verified_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            "success": True,
            "message": f"Payment verified successfully for {len(designs)} design(s).",
            "order_id": razorpay_order_id,
            "receipt": receipt_number
        }), 200
        
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
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
        
        transaction["_id"] = str(transaction["_id"])
        transaction["user_id"] = str(transaction["user_id"])
        if transaction.get("design_id"):
            transaction["design_id"] = str(transaction["design_id"])
        if transaction.get("design_ids"):
            transaction["design_ids"] = [str(d) for d in transaction["design_ids"]]
        if transaction.get("seller_id"):
            transaction["seller_id"] = str(transaction["seller_id"])
        
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
            if transaction.get("design_id"):
                transaction["design_id"] = str(transaction["design_id"])
            if transaction.get("design_ids"):
                transaction["design_ids"] = [str(d) for d in transaction.get("design_ids", [])]
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
