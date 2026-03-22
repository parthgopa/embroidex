"""
Withdrawal Routes - Manual Payout System
Handles seller withdrawal requests and admin approval/rejection
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import re

from config import USERS_COLLECTION, WITHDRAWALS_COLLECTION, PURCHASES_COLLECTION
from utils.jwt_utils import decode_token

withdrawal_bp = Blueprint("withdrawal", __name__)

# Import platform fee getter
from routes.Settings_routes import get_platform_fee

MINIMUM_WITHDRAWAL = 500  # Minimum ₹500


def validate_upi(upi_id):
    """Validate UPI ID format (username@bankname)"""
    pattern = r'^[\w.-]+@[\w]+$'
    return bool(re.match(pattern, upi_id))


def validate_ifsc(ifsc):
    """Validate IFSC code format"""
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc))


def validate_account_number(account_number):
    """Validate account number (9-18 digits)"""
    return account_number.isdigit() and 9 <= len(account_number) <= 18


def calculate_seller_balance(seller_id):
    """
    Calculate seller's available balance from purchases
    Returns: (available_balance, total_earnings, total_withdrawn)
    """
    # Get current platform fee from database
    platform_fee_percent = get_platform_fee()
    
    # Calculate total earnings from completed purchases
    purchases = list(PURCHASES_COLLECTION.find({
        "seller_id": seller_id,
        "status": "completed"
    }))
    
    total_earnings = 0
    for purchase in purchases:
        sale_price = purchase.get("amount_paid", 0)
        platform_fee = round(sale_price * platform_fee_percent / 100, 2)
        seller_earning = round(sale_price - platform_fee, 2)
        total_earnings += seller_earning
    
    # Calculate total withdrawn (APPROVED withdrawals)
    approved_withdrawals = WITHDRAWALS_COLLECTION.find({
        "sellerId": seller_id,
        "status": "APPROVED"
    })
    
    total_withdrawn = sum(w.get("amount", 0) for w in approved_withdrawals)
    
    # Calculate pending withdrawals (deducted from balance)
    pending_withdrawals = WITHDRAWALS_COLLECTION.find({
        "sellerId": seller_id,
        "status": "PENDING"
    })
    
    pending_amount = sum(w.get("amount", 0) for w in pending_withdrawals)
    
    # Available = Earnings - Withdrawn - Pending
    available_balance = round(total_earnings - total_withdrawn - pending_amount, 2)
    
    return available_balance, total_earnings, total_withdrawn


# ==================== SELLER ROUTES ====================

@withdrawal_bp.route("/payout-settings", methods=["POST"])
def save_payout_settings():
    """
    Save seller's payout details (UPI or Bank Account)
    Only accessible to sellers
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Check if user is a seller
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.get("is_seller"):
        return jsonify({"error": "Only sellers can configure payout settings"}), 403
    
    data = request.json
    payout_type = data.get("type", "").upper()
    
    if payout_type not in ["UPI", "BANK"]:
        return jsonify({"error": "Invalid payout type. Must be UPI or BANK"}), 400
    
    payout_details = {
        "type": payout_type,
        "verified": False,
        "addedAt": datetime.utcnow(),
        "lastUpdated": datetime.utcnow()
    }
    
    # Validate and save UPI details
    if payout_type == "UPI":
        upi_id = data.get("upiId", "").strip()
        
        if not upi_id:
            return jsonify({"error": "UPI ID is required"}), 400
        
        if not validate_upi(upi_id):
            return jsonify({"error": "Invalid UPI ID format"}), 400
        
        payout_details["upiId"] = upi_id
    
    # Validate and save Bank Account details
    elif payout_type == "BANK":
        account_holder_name = data.get("accountHolderName", "").strip()
        account_number = data.get("accountNumber", "").strip()
        ifsc_code = data.get("ifscCode", "").strip().upper()
        bank_name = data.get("bankName", "").strip()
        
        # Validate required fields
        if not all([account_holder_name, account_number, ifsc_code]):
            return jsonify({"error": "All bank account fields are required"}), 400
        
        if not validate_account_number(account_number):
            return jsonify({"error": "Invalid account number. Must be 9-18 digits."}), 400
        
        if not validate_ifsc(ifsc_code):
            return jsonify({"error": "Invalid IFSC code format"}), 400
        
        payout_details["accountHolderName"] = account_holder_name
        payout_details["accountNumber"] = account_number
        payout_details["ifscCode"] = ifsc_code
        payout_details["bankName"] = bank_name
    
    # Update user's payout details
    USERS_COLLECTION.update_one(
        {"_id": user_id},
        {
            "$set": {
                "payoutDetails": payout_details,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    # Return masked details for security
    response_details = payout_details.copy()
    if payout_type == "BANK" and "accountNumber" in response_details:
        acc_num = response_details["accountNumber"]
        response_details["accountNumber"] = acc_num[-4:].rjust(len(acc_num), '*')
    
    return jsonify({
        "message": "Payout settings saved successfully",
        "payoutDetails": response_details
    }), 200


@withdrawal_bp.route("/payout-settings", methods=["GET"])
def get_payout_settings():
    """Get seller's payout settings"""
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
    
    # Mask sensitive data
    response_details = payout_details.copy()
    if payout_details.get("type") == "BANK" and "accountNumber" in response_details:
        acc_num = response_details["accountNumber"]
        response_details["accountNumber"] = acc_num[-4:].rjust(len(acc_num), '*')
    
    # Convert datetime to string
    if response_details.get("addedAt"):
        response_details["addedAt"] = response_details["addedAt"].isoformat()
    if response_details.get("lastUpdated"):
        response_details["lastUpdated"] = response_details["lastUpdated"].isoformat()
    
    return jsonify({"payoutDetails": response_details}), 200


@withdrawal_bp.route("/balance", methods=["GET"])
def get_seller_balance():
    """Get seller's current balance and earnings summary"""
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
    
    if not user.get("is_seller"):
        return jsonify({"error": "Only sellers can view balance"}), 403
    
    # Calculate real-time balance
    available_balance, total_earnings, total_withdrawn = calculate_seller_balance(user_id)
    
    # Get pending withdrawals
    pending_withdrawals = list(WITHDRAWALS_COLLECTION.find({
        "sellerId": user_id,
        "status": "PENDING"
    }))
    
    pending_amount = sum(w.get("amount", 0) for w in pending_withdrawals)
    
    return jsonify({
        "availableBalance": available_balance,
        "totalEarnings": total_earnings,
        "totalWithdrawn": total_withdrawn,
        "pendingAmount": pending_amount,
        "hasPayoutDetails": user.get("payoutDetails") is not None
    }), 200


@withdrawal_bp.route("/request", methods=["POST"])
def create_withdrawal_request():
    """
    Create a new withdrawal request
    CRITICAL: Immediately deducts amount from available balance to prevent double-spending
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Get user and verify seller status
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.get("is_seller"):
        return jsonify({"error": "Only sellers can request withdrawals"}), 403
    
    # Check if payout details are configured
    payout_details = user.get("payoutDetails")
    if not payout_details:
        return jsonify({
            "error": "Please configure your Payment Settings first",
            "requiresPayoutSetup": True
        }), 400
    
    # Get requested amount
    data = request.json
    amount = data.get("amount")
    
    if not amount or not isinstance(amount, (int, float)):
        return jsonify({"error": "Invalid amount"}), 400
    
    amount = float(amount)
    
    # Validate minimum amount
    if amount < MINIMUM_WITHDRAWAL:
        return jsonify({
            "error": f"Minimum withdrawal amount is ₹{MINIMUM_WITHDRAWAL}"
        }), 400
    
    # Calculate current available balance
    available_balance, total_earnings, total_withdrawn = calculate_seller_balance(user_id)
    
    # Check if sufficient balance
    if amount > available_balance:
        return jsonify({
            "error": f"Insufficient balance. Available: ₹{available_balance}",
            "availableBalance": available_balance
        }), 400
    
    # Generate unique reference ID
    reference_id = f"WD{user_id}{int(datetime.utcnow().timestamp())}"
    
    # Create withdrawal record with PENDING status
    # Note: Amount is effectively "locked" by creating this PENDING record
    withdrawal_record = {
        "sellerId": user_id,
        "sellerName": user.get("name", "Unknown"),
        "sellerEmail": user.get("email", ""),
        "amount": amount,
        "status": "PENDING",
        "payoutDetails": payout_details,  # Snapshot at request time
        "requestedAt": datetime.utcnow(),
        "processedAt": None,
        "processedBy": None,
        "adminNotes": "",
        "rejectionReason": "",
        "referenceId": reference_id
    }
    
    result = WITHDRAWALS_COLLECTION.insert_one(withdrawal_record)
    
    # Recalculate balance to show updated available amount
    new_available_balance, _, _ = calculate_seller_balance(user_id)
    
    return jsonify({
        "message": "Your withdrawal request is pending and will be processed in 2-3 business days.",
        "withdrawalId": str(result.inserted_id),
        "referenceId": reference_id,
        "amount": amount,
        "status": "PENDING",
        "newAvailableBalance": new_available_balance
    }), 201


@withdrawal_bp.route("/history", methods=["GET"])
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
    
    # Get all withdrawals for this seller
    withdrawals = list(WITHDRAWALS_COLLECTION.find({
        "sellerId": user_id
    }).sort("requestedAt", -1))
    
    # Convert ObjectId and datetime to strings
    for withdrawal in withdrawals:
        withdrawal["_id"] = str(withdrawal["_id"])
        withdrawal["sellerId"] = str(withdrawal["sellerId"])
        
        if withdrawal.get("requestedAt"):
            withdrawal["requestedAt"] = withdrawal["requestedAt"].isoformat()
        if withdrawal.get("processedAt"):
            withdrawal["processedAt"] = withdrawal["processedAt"].isoformat()
        if withdrawal.get("processedBy"):
            withdrawal["processedBy"] = str(withdrawal["processedBy"])
        
        # Mask account number if present
        if withdrawal.get("payoutDetails", {}).get("accountNumber"):
            acc_num = withdrawal["payoutDetails"]["accountNumber"]
            withdrawal["payoutDetails"]["accountNumber"] = acc_num[-4:].rjust(len(acc_num), '*')
    
    return jsonify({"withdrawals": withdrawals}), 200


# ==================== ADMIN ROUTES ====================

@withdrawal_bp.route("/admin/all", methods=["GET"])
def get_all_withdrawals():
    """
    Get all withdrawal requests (all statuses) for admin history view
    Requires admin authentication
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Get all withdrawals
    withdrawals = list(WITHDRAWALS_COLLECTION.find({}).sort("requestedAt", -1))  # Newest first
    
    # Enrich with seller data
    for withdrawal in withdrawals:
        withdrawal["_id"] = str(withdrawal["_id"])
        
        # Convert sellerId to string if it's an ObjectId
        if "sellerId" in withdrawal:
            withdrawal["sellerId"] = str(withdrawal["sellerId"])
        
        # Convert any other ObjectId fields
        if "processedBy" in withdrawal and withdrawal["processedBy"]:
            withdrawal["processedBy"] = str(withdrawal["processedBy"])
        
        # Convert dates to ISO format
        if withdrawal.get("requestedAt"):
            withdrawal["requestedAt"] = withdrawal["requestedAt"].isoformat()
        if withdrawal.get("processedAt"):
            withdrawal["processedAt"] = withdrawal["processedAt"].isoformat()
    
    return jsonify({"withdrawals": withdrawals}), 200


@withdrawal_bp.route("/admin/pending", methods=["GET"])
def get_pending_withdrawals():
    """
    Get all pending withdrawal requests for admin review
    Requires admin authentication
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Get all pending withdrawals
    withdrawals = list(WITHDRAWALS_COLLECTION.find({
        "status": "PENDING"
    }).sort("requestedAt", 1))  # Oldest first
    
    # Enrich with seller data
    for withdrawal in withdrawals:
        seller_id = withdrawal["sellerId"]
        
        # Calculate seller's total earnings for verification
        _, total_earnings, total_withdrawn = calculate_seller_balance(seller_id)
        
        withdrawal["_id"] = str(withdrawal["_id"])
        withdrawal["sellerId"] = str(withdrawal["sellerId"])
        withdrawal["totalEarnings"] = total_earnings
        withdrawal["totalWithdrawn"] = total_withdrawn
        
        if withdrawal.get("requestedAt"):
            withdrawal["requestedAt"] = withdrawal["requestedAt"].isoformat()
    
    return jsonify({"withdrawals": withdrawals}), 200


@withdrawal_bp.route("/admin/<withdrawal_id>/details", methods=["GET"])
def get_withdrawal_details(withdrawal_id):
    """
    Get detailed information about a withdrawal request
    Includes seller's sales history for verification
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Get withdrawal request
    try:
        withdrawal = WITHDRAWALS_COLLECTION.find_one({"_id": ObjectId(withdrawal_id)})
    except:
        return jsonify({"error": "Invalid withdrawal ID"}), 400
    
    if not withdrawal:
        return jsonify({"error": "Withdrawal request not found"}), 404
    
    seller_id = withdrawal["sellerId"]
    
    # Get seller's recent sales for verification
    recent_sales = list(PURCHASES_COLLECTION.find({
        "seller_id": seller_id,
        "status": "completed"
    }).sort("purchased_at", -1).limit(20))
    
    # Get current platform fee
    platform_fee_percent = get_platform_fee()
    
    # Calculate earnings from each sale
    sales_data = []
    for sale in recent_sales:
        sale_price = sale.get("amount_paid", 0)
        platform_fee = round(sale_price * platform_fee_percent / 100, 2)
        seller_earning = round(sale_price - platform_fee, 2)
        
        sales_data.append({
            "purchaseId": str(sale["_id"]),
            "designTitle": sale.get("design_title", "Unknown"),
            "buyerId": str(sale.get("user_id", "")),
            "salePrice": sale_price,
            "platformFee": platform_fee,
            "sellerEarning": seller_earning,
            "purchasedAt": sale.get("purchased_at").isoformat() if sale.get("purchased_at") else None
        })
    
    # Calculate total earnings and balance
    available_balance, total_earnings, total_withdrawn = calculate_seller_balance(seller_id)
    
    # Prepare withdrawal details
    withdrawal_data = {
        "_id": str(withdrawal["_id"]),
        "sellerId": str(withdrawal["sellerId"]),
        "sellerName": withdrawal.get("sellerName"),
        "sellerEmail": withdrawal.get("sellerEmail"),
        "amount": withdrawal.get("amount"),
        "status": withdrawal.get("status"),
        "payoutDetails": withdrawal.get("payoutDetails"),
        "requestedAt": withdrawal.get("requestedAt").isoformat() if withdrawal.get("requestedAt") else None,
        "referenceId": withdrawal.get("referenceId"),
        "totalEarnings": total_earnings,
        "totalWithdrawn": total_withdrawn,
        "availableBalance": available_balance,
        "recentSales": sales_data,
        "totalSalesCount": len(sales_data)
    }
    
    return jsonify(withdrawal_data), 200


@withdrawal_bp.route("/admin/<withdrawal_id>/approve", methods=["POST"])
def approve_withdrawal(withdrawal_id):
    """
    Approve a withdrawal request
    Updates status to APPROVED and sets processedAt timestamp
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        admin_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    admin = USERS_COLLECTION.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Get withdrawal request
    try:
        withdrawal = WITHDRAWALS_COLLECTION.find_one({"_id": ObjectId(withdrawal_id)})
    except:
        return jsonify({"error": "Invalid withdrawal ID"}), 400
    
    if not withdrawal:
        return jsonify({"error": "Withdrawal request not found"}), 404
    
    if withdrawal["status"] != "PENDING":
        return jsonify({"error": f"Cannot approve withdrawal with status: {withdrawal['status']}"}), 400
    
    # Get admin notes if provided
    data = request.json or {}
    admin_notes = data.get("adminNotes", "")
    
    # Update withdrawal status to APPROVED
    WITHDRAWALS_COLLECTION.update_one(
        {"_id": ObjectId(withdrawal_id)},
        {
            "$set": {
                "status": "APPROVED",
                "processedAt": datetime.utcnow(),
                "processedBy": admin_id,
                "adminNotes": admin_notes
            }
        }
    )
    
    # Note: Amount was already deducted when request was created
    # Admin should now process the actual payout manually using the payoutDetails
    
    return jsonify({
        "message": "Withdrawal request approved successfully",
        "withdrawalId": withdrawal_id,
        "amount": withdrawal["amount"],
        "payoutDetails": withdrawal["payoutDetails"]
    }), 200


@withdrawal_bp.route("/admin/<withdrawal_id>/reject", methods=["POST"])
def reject_withdrawal(withdrawal_id):
    """
    Reject a withdrawal request
    CRITICAL: Automatically adds the amount back to seller's available balance
    """
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        admin_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    admin = USERS_COLLECTION.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Get withdrawal request
    try:
        withdrawal = WITHDRAWALS_COLLECTION.find_one({"_id": ObjectId(withdrawal_id)})
    except:
        return jsonify({"error": "Invalid withdrawal ID"}), 400
    
    if not withdrawal:
        return jsonify({"error": "Withdrawal request not found"}), 404
    
    if withdrawal["status"] != "PENDING":
        return jsonify({"error": f"Cannot reject withdrawal with status: {withdrawal['status']}"}), 400
    
    # Get rejection reason (required)
    data = request.json or {}
    rejection_reason = data.get("rejectionReason", "").strip()
    
    if not rejection_reason:
        return jsonify({"error": "Rejection reason is required"}), 400
    
    # Update withdrawal status to REJECTED
    WITHDRAWALS_COLLECTION.update_one(
        {"_id": ObjectId(withdrawal_id)},
        {
            "$set": {
                "status": "REJECTED",
                "processedAt": datetime.utcnow(),
                "processedBy": admin_id,
                "rejectionReason": rejection_reason
            }
        }
    )
    
    # Note: Amount is automatically available again because we only count APPROVED withdrawals
    # The calculate_seller_balance function excludes REJECTED withdrawals
    
    return jsonify({
        "message": "Withdrawal request rejected. Amount returned to seller's balance.",
        "withdrawalId": withdrawal_id,
        "amount": withdrawal["amount"],
        "rejectionReason": rejection_reason
    }), 200


@withdrawal_bp.route("/admin/stats", methods=["GET"])
def get_admin_withdrawal_stats():
    """Get withdrawal statistics for admin dashboard"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        admin_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    admin = USERS_COLLECTION.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    # Count withdrawals by status
    pending_count = WITHDRAWALS_COLLECTION.count_documents({"status": "PENDING"})
    approved_count = WITHDRAWALS_COLLECTION.count_documents({"status": "APPROVED"})
    rejected_count = WITHDRAWALS_COLLECTION.count_documents({"status": "REJECTED"})
    
    # Calculate total amounts
    pending_amount = sum(
        w.get("amount", 0) 
        for w in WITHDRAWALS_COLLECTION.find({"status": "PENDING"})
    )
    
    approved_amount = sum(
        w.get("amount", 0) 
        for w in WITHDRAWALS_COLLECTION.find({"status": "APPROVED"})
    )
    
    return jsonify({
        "pending": {
            "count": pending_count,
            "totalAmount": pending_amount
        },
        "approved": {
            "count": approved_count,
            "totalAmount": approved_amount
        },
        "rejected": {
            "count": rejected_count
        }
    }), 200
