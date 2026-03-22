from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import re

from config import PURCHASES_COLLECTION, USERS_COLLECTION, TRANSACTIONS_COLLECTION, WITHDRAWALS_COLLECTION
from utils.jwt_utils import decode_token

seller_earnings_bp = Blueprint("seller_earnings", __name__)

# Import platform fee getter
from routes.Settings_routes import get_platform_fee


def validate_ifsc(ifsc):
    """Validate IFSC code format"""
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc))


def validate_account_number(account_number):
    """Validate account number (9-18 digits)"""
    return account_number.isdigit() and 9 <= len(account_number) <= 18


@seller_earnings_bp.route("/earnings", methods=["GET"])
def get_seller_earnings():
    """Get seller's earnings summary and sales history"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        # Get all purchases where this user is the seller
        purchases = list(PURCHASES_COLLECTION.find({
            "seller_id": user_id,
            "status": "completed"
        }).sort("purchased_at", -1))
        
        # Get current platform fee from database
        platform_fee_percent = get_platform_fee()
        
        # Calculate earnings
        total_sales = 0
        total_platform_fee = 0
        total_seller_earning = 0
        
        sales_data = []
        
        for purchase in purchases:
            sale_price = purchase.get("amount_paid", 0)
            platform_fee = round(sale_price * platform_fee_percent / 100, 2)
            seller_earning = round(sale_price - platform_fee, 2)
            
            total_sales += sale_price
            total_platform_fee += platform_fee
            total_seller_earning += seller_earning
            
            sales_data.append({
                "_id": str(purchase["_id"]),
                "design_title": purchase.get("design_title"),
                "sale_price": sale_price,
                "platform_fee": platform_fee,
                "seller_earning": seller_earning,
                "purchased_at": purchase.get("purchased_at").isoformat() if purchase.get("purchased_at") else None,
                "buyer_id": str(purchase.get("user_id"))
            })
        
        # Get total withdrawn amount (from withdrawal records)
        # For now, we'll assume no withdrawals have been made
        # In production, you'd query a WITHDRAWALS_COLLECTION
        total_withdrawn = 0
        
        # Available balance = total earnings - withdrawn
        available_balance = round(total_seller_earning - total_withdrawn, 2)
        
        earnings_summary = {
            "total_sales": round(total_sales, 2),
            "platform_fee": round(total_platform_fee, 2),
            "total_earnings": round(total_seller_earning, 2),
            "total_withdrawn": total_withdrawn,
            "available_balance": available_balance,
            "total_orders": len(purchases),
            "platform_fee_percent": platform_fee_percent
        }
        
        return jsonify({
            "earnings": earnings_summary,
            "sales": sales_data
        }), 200
        
    except Exception as e:
        print(f"Error fetching earnings: {str(e)}")
        return jsonify({"error": str(e)}), 500


@seller_earnings_bp.route("/withdraw", methods=["POST"])
def request_withdrawal():
    """Request withdrawal of earnings (Razorpay Payout simulation)"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    amount = data.get("amount")
    
    if not amount:
        return jsonify({"error": "Amount is required"}), 400
    
    try:
        amount = float(amount)
    except:
        return jsonify({"error": "Invalid amount"}), 400
    
    if amount < 2000:
        return jsonify({"error": "Minimum withdrawal amount is ₹2000"}), 400
    
    try:
        # Calculate available balance
        purchases = list(PURCHASES_COLLECTION.find({
            "seller_id": user_id,
            "status": "completed"
        }))
        
        # Get current platform fee
        platform_fee_percent = get_platform_fee()
        
        total_earnings = 0
        for purchase in purchases:
            sale_price = purchase.get("amount_paid", 0)
            platform_fee = round(sale_price * platform_fee_percent / 100, 2)
            seller_earning = round(sale_price - platform_fee, 2)
            total_earnings += seller_earning
        
        # Calculate total withdrawn amount
        total_withdrawn = 0
        completed_withdrawals = WITHDRAWALS_COLLECTION.find({
            "seller_id": user_id,
            "status": {"$in": ["approved", "processing", "completed"]}
        })
        for withdrawal in completed_withdrawals:
            total_withdrawn += withdrawal.get("amount", 0)
        
        available_balance = round(total_earnings - total_withdrawn, 2)
        
        if amount > available_balance:
            return jsonify({"error": f"Insufficient balance. Available: ₹{available_balance}"}), 400
        
        # Get user details
        user = USERS_COLLECTION.find_one({"_id": user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if seller has added bank account
        bank_account = user.get("bank_account")
        if not bank_account:
            return jsonify({"error": "Please add your bank account details first"}), 400
        
        # Validate bank account details
        if not bank_account.get("account_number") or not bank_account.get("ifsc"):
            return jsonify({"error": "Incomplete bank account details"}), 400
        
        # Create withdrawal record
        withdrawal_record = {
            "seller_id": user_id,
            "amount": amount,
            "status": "pending",  # pending, approved, processing, completed, rejected
            "bank_account": {
                "account_number": bank_account.get("account_number"),
                "ifsc": bank_account.get("ifsc"),
                "account_holder_name": bank_account.get("account_holder_name"),
                "bank_name": bank_account.get("bank_name")
            },
            "requested_at": datetime.utcnow(),
            "approved_at": None,
            "processed_at": None,
            "completed_at": None,
            "payout_id": None,
            "reference_id": f"WD_{user_id}_{int(datetime.utcnow().timestamp())}",
            "notes": "Seller earnings withdrawal",
            "rejection_reason": None
        }
        
        # Save to database
        result = WITHDRAWALS_COLLECTION.insert_one(withdrawal_record)
        
        return jsonify({
            "message": f"Withdrawal request for ₹{amount} has been submitted successfully. It will be reviewed and processed within 2-3 business days.",
            "withdrawal_id": str(result.inserted_id),
            "amount": amount,
            "status": "pending",
            "reference_id": withdrawal_record["reference_id"]
        }), 200
        
    except Exception as e:
        print(f"Error processing withdrawal: {str(e)}")
        return jsonify({"error": str(e)}), 500


@seller_earnings_bp.route("/withdrawal-history", methods=["GET"])
def get_withdrawal_history():
    """Get seller's withdrawal history"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        withdrawals = list(WITHDRAWALS_COLLECTION.find({
            "seller_id": user_id
        }).sort("requested_at", -1))
        
        # Convert ObjectId and datetime to strings
        for withdrawal in withdrawals:
            withdrawal["_id"] = str(withdrawal["_id"])
            withdrawal["seller_id"] = str(withdrawal["seller_id"])
            
            if withdrawal.get("requested_at"):
                withdrawal["requested_at"] = withdrawal["requested_at"].isoformat()
            if withdrawal.get("approved_at"):
                withdrawal["approved_at"] = withdrawal["approved_at"].isoformat()
            if withdrawal.get("processed_at"):
                withdrawal["processed_at"] = withdrawal["processed_at"].isoformat()
            if withdrawal.get("completed_at"):
                withdrawal["completed_at"] = withdrawal["completed_at"].isoformat()
        
        return jsonify({"withdrawals": withdrawals}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@seller_earnings_bp.route("/bank-account", methods=["POST"])
def add_bank_account():
    """Add or update seller's bank account details"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    account_number = data.get("account_number", "").strip()
    ifsc = data.get("ifsc", "").strip().upper()
    account_holder_name = data.get("account_holder_name", "").strip()
    bank_name = data.get("bank_name", "").strip()
    
    # Validate inputs
    if not all([account_number, ifsc, account_holder_name]):
        return jsonify({"error": "All fields are required"}), 400
    
    if not validate_account_number(account_number):
        return jsonify({"error": "Invalid account number. Must be 9-18 digits."}), 400
    
    if not validate_ifsc(ifsc):
        return jsonify({"error": "Invalid IFSC code format"}), 400
    
    try:
        # Update user's bank account
        USERS_COLLECTION.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "bank_account": {
                        "account_number": account_number,
                        "ifsc": ifsc,
                        "account_holder_name": account_holder_name,
                        "bank_name": bank_name,
                        "verified": False,
                        "added_at": datetime.utcnow()
                    }
                }
            }
        )
        
        return jsonify({
            "message": "Bank account details saved successfully",
            "bank_account": {
                "account_number": account_number[-4:].rjust(len(account_number), '*'),  # Masked
                "ifsc": ifsc,
                "account_holder_name": account_holder_name,
                "bank_name": bank_name
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@seller_earnings_bp.route("/bank-account", methods=["GET"])
def get_bank_account():
    """Get seller's bank account details"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    try:
        user = USERS_COLLECTION.find_one({"_id": user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        bank_account = user.get("bank_account")
        if not bank_account:
            return jsonify({"bank_account": None}), 200
        
        # Mask account number for security
        if bank_account.get("account_number"):
            acc_num = bank_account["account_number"]
            bank_account["account_number"] = acc_num[-4:].rjust(len(acc_num), '*')
        
        # Convert datetime to string
        if bank_account.get("added_at"):
            bank_account["added_at"] = bank_account["added_at"].isoformat()
        
        return jsonify({"bank_account": bank_account}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
