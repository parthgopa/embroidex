"""
Settings Routes - Platform Configuration
Handles platform-wide settings like platform fee percentage
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId

from config import db
from utils.jwt_utils import decode_token

settings_bp = Blueprint("settings", __name__)

# Settings collection
SETTINGS_COLLECTION = db["settings"]

# Default platform fee
DEFAULT_PLATFORM_FEE = 30


def get_platform_fee():
    """Get current platform fee percentage from database"""
    settings = SETTINGS_COLLECTION.find_one({"key": "platform_fee"})
    if settings:
        return settings.get("value", DEFAULT_PLATFORM_FEE)
    return DEFAULT_PLATFORM_FEE


def initialize_settings():
    """Initialize default settings if not exists"""
    if SETTINGS_COLLECTION.count_documents({"key": "platform_fee"}) == 0:
        SETTINGS_COLLECTION.insert_one({
            "key": "platform_fee",
            "value": DEFAULT_PLATFORM_FEE,
            "label": "Platform Fee Percentage",
            "description": "Percentage of each sale taken as platform fee",
            "updatedAt": datetime.utcnow(),
            "updatedBy": None
        })


# Initialize settings on module load
initialize_settings()


@settings_bp.route("/platform-fee", methods=["GET"])
def get_platform_fee_route():
    """Get current platform fee percentage"""
    try:
        platform_fee = get_platform_fee()
        return jsonify({
            "platformFee": platform_fee,
            "label": "Platform Fee Percentage",
            "description": "Percentage of each sale taken as platform fee"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@settings_bp.route("/platform-fee", methods=["PUT"])
def update_platform_fee():
    """Update platform fee percentage (Admin only)"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        admin_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    from config import USERS_COLLECTION
    admin = USERS_COLLECTION.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.json
    new_fee = data.get("platformFee")
    
    if new_fee is None:
        return jsonify({"error": "platformFee is required"}), 400
    
    try:
        new_fee = float(new_fee)
    except:
        return jsonify({"error": "platformFee must be a number"}), 400
    
    if new_fee < 0 or new_fee > 100:
        return jsonify({"error": "platformFee must be between 0 and 100"}), 400
    
    # Update or create setting
    SETTINGS_COLLECTION.update_one(
        {"key": "platform_fee"},
        {
            "$set": {
                "value": new_fee,
                "updatedAt": datetime.utcnow(),
                "updatedBy": admin_id
            }
        },
        upsert=True
    )
    
    return jsonify({
        "message": "Platform fee updated successfully",
        "platformFee": new_fee
    }), 200


@settings_bp.route("/all", methods=["GET"])
def get_all_settings():
    """Get all platform settings (Admin only)"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        admin_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Verify admin status
    from config import USERS_COLLECTION
    admin = USERS_COLLECTION.find_one({"_id": admin_id})
    if not admin or admin.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    settings = list(SETTINGS_COLLECTION.find({}))
    
    # Format settings
    formatted_settings = []
    for setting in settings:
        formatted_settings.append({
            "key": setting.get("key"),
            "value": setting.get("value"),
            "label": setting.get("label"),
            "description": setting.get("description"),
            "updatedAt": setting.get("updatedAt").isoformat() if setting.get("updatedAt") else None
        })
    
    return jsonify({"settings": formatted_settings}), 200
