from flask import Blueprint, request, jsonify
from config import USERS_COLLECTION, ADMIN_KEY, PURCHASES_COLLECTION, DESIGNS_COLLECTION, SETTINGS_COLLECTION
from utils.jwt_utils import encode_token, decode_token, generate_token
from utils.hash_utils import hash_password, verify_password
import os

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    if USERS_COLLECTION.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hash_password(data["password"]),
        "role": "buyer",
        "is_seller": False
    }
    
    USERS_COLLECTION.insert_one(user)

    return jsonify({"message": "User created"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    user = USERS_COLLECTION.find_one({"email": data["email"]})

    if not user or not verify_password(data["password"], user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user["_id"])

    return jsonify({"token": token})


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
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
    
    return jsonify({
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role", "buyer"),
        "is_seller": user.get("is_seller", False)
    }), 200


@auth_bp.route("/register-seller", methods=["POST"])
def register_seller():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    
    user = USERS_COLLECTION.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.get("is_seller"):
        return jsonify({"error": "Already registered as seller"}), 400
    
    seller_info = {
        "mobile_number": data.get("mobile_number"),
        "business_website": data.get("business_website", ""),
        "business_address": data.get("business_address")
    }
    
    if not seller_info["mobile_number"] or not seller_info["business_address"]:
        return jsonify({"error": "Mobile number and business address are required"}), 400
    
    USERS_COLLECTION.update_one(
        {"_id": user_id},
        {
            "$set": {
                "is_seller": True,
                "seller_info": seller_info
            }
        }
    )
    
    return jsonify({"message": "Successfully registered as seller"}), 200


@auth_bp.route("/admin-signup", methods=["POST"])
def admin_signup():
    """Admin signup with secret key verification"""
    data = request.json
    
    print(data.get("admin_key"), ADMIN_KEY)
    # Verify admin key
    if data.get("admin_key") != ADMIN_KEY:
        return jsonify({"error": "Invalid admin key"}), 403

    
    # Check if user already exists
    if USERS_COLLECTION.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400
    
    # Create admin user
    admin_user = {
        "name": data["name"],
        "email": data["email"],
        "password": hash_password(data["password"]),
        "role": "admin",
        "is_seller": False
    }
    
    USERS_COLLECTION.insert_one(admin_user)
    
    return jsonify({"message": "Admin account created successfully"}), 201


@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    """Get detailed user profile"""
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
    
    return jsonify({
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role", "buyer"),
        "is_seller": user.get("is_seller", False),
        "seller_info": user.get("seller_info")
    }), 200


@auth_bp.route("/stats", methods=["GET"])
def get_user_stats():
    """Get user statistics for profile page"""
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
    
    # Get total purchases
    total_purchases = PURCHASES_COLLECTION.count_documents({
        "user_id": user_id,
        "status": "completed"
    })
    
    stats = {
        "totalPurchases": total_purchases
    }
    
    # If seller, get additional stats
    if user.get("is_seller"):
        total_designs = DESIGNS_COLLECTION.count_documents({"seller_id": user_id})
        
        # Calculate total earnings from sales
        sales = list(PURCHASES_COLLECTION.find({
            "seller_id": user_id,
            "status": "completed"
        }))
        
        # Get platform fee from settings
        settings = SETTINGS_COLLECTION.find_one({"key": "platform_fee"})
        platform_fee_percent = settings.get("value", 30) if settings else 30
        
        total_earnings = 0
        for sale in sales:
            sale_price = sale.get("amount_paid", 0)
            platform_fee = sale_price * platform_fee_percent / 100
            seller_earning = sale_price - platform_fee
            total_earnings += seller_earning
        
        stats["totalDesigns"] = total_designs
        stats["totalEarnings"] = round(total_earnings, 2)
    
    return jsonify(stats), 200