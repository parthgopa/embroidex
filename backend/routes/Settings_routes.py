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
DEFAULT_DESIGNS_PER_PAGE = 30


def get_platform_fee():
    """Get current platform fee percentage from database"""
    settings = SETTINGS_COLLECTION.find_one({"key": "platform_fee"})
    if settings:
        return settings.get("value", DEFAULT_PLATFORM_FEE)
    return DEFAULT_PLATFORM_FEE


def get_designs_per_page():
    """Get current designs per page setting from database"""
    settings = SETTINGS_COLLECTION.find_one({"key": "designs_per_page"})
    if settings:
        try:
            return int(settings.get("value", DEFAULT_DESIGNS_PER_PAGE))
        except:
            return DEFAULT_DESIGNS_PER_PAGE
    return DEFAULT_DESIGNS_PER_PAGE


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

    if SETTINGS_COLLECTION.count_documents({"key": "designs_per_page"}) == 0:
        SETTINGS_COLLECTION.insert_one({
            "key": "designs_per_page",
            "value": DEFAULT_DESIGNS_PER_PAGE,
            "label": "Designs Per Page",
            "description": "Number of designs shown per page on public listings",
            "updatedAt": datetime.utcnow(),
            "updatedBy": None
        })


# Initialize settings on module load
initialize_settings()


@settings_bp.route("/platform-fee", methods=["GET"])
def get_platform_fee_route():
    """Get current platform fee percentage and designs per page setting"""
    try:
        platform_fee = get_platform_fee()
        designs_per_page = get_designs_per_page()
        return jsonify({
            "platformFee": platform_fee,
            "designsPerPage": designs_per_page,
            "label": "Platform Settings"
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
    
    data = request.json or {}
    new_fee = data.get("platformFee")
    designs_per_page = data.get("designsPerPage")
    
    if new_fee is not None:
        try:
            new_fee = float(new_fee)
            if 0 <= new_fee <= 100:
                SETTINGS_COLLECTION.update_one(
                    {"key": "platform_fee"},
                    {"$set": {"value": new_fee, "updatedAt": datetime.utcnow(), "updatedBy": admin_id}},
                    upsert=True
                )
        except Exception:
            pass
            
    if designs_per_page is not None:
        try:
            designs_per_page = int(designs_per_page)
            if 1 <= designs_per_page <= 200:
                SETTINGS_COLLECTION.update_one(
                    {"key": "designs_per_page"},
                    {"$set": {"value": designs_per_page, "updatedAt": datetime.utcnow(), "updatedBy": admin_id}},
                    upsert=True
                )
        except Exception:
            pass
    
    return jsonify({
        "message": "Platform settings updated successfully",
        "platformFee": get_platform_fee(),
        "designsPerPage": get_designs_per_page()
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
