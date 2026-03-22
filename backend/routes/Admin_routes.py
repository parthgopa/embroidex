from flask import Blueprint, request, jsonify
from config import DESIGNS_COLLECTION, USERS_COLLECTION
from utils.jwt_utils import decode_token
from bson import ObjectId
from datetime import datetime

admin_bp = Blueprint("admin", __name__)


def is_admin(user_id):
    """Check if user is admin"""
    user = USERS_COLLECTION.find_one({"_id": user_id})
    return user and user.get("role") == "admin"


@admin_bp.route("/stats", methods=["GET"])
def get_stats():
    """Get dashboard statistics"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    # Calculate statistics
    total_designs = DESIGNS_COLLECTION.count_documents({})
    pending_designs = DESIGNS_COLLECTION.count_documents({"status": "pending"})
    approved_designs = DESIGNS_COLLECTION.count_documents({"status": "approved"})
    rejected_designs = DESIGNS_COLLECTION.count_documents({"status": "rejected"})
    
    total_users = USERS_COLLECTION.count_documents({})
    total_sellers = USERS_COLLECTION.count_documents({"is_seller": True})
    
    return jsonify({
        "totalDesigns": total_designs,
        "pendingDesigns": pending_designs,
        "approvedDesigns": approved_designs,
        "rejectedDesigns": rejected_designs,
        "totalUsers": total_users,
        "totalSellers": total_sellers
    }), 200


@admin_bp.route("/designs", methods=["GET"])
def get_all_designs():
    """Get all designs with seller information"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    # Get all designs with seller email
    designs = list(DESIGNS_COLLECTION.find({}))
    
    for design in designs:
        design["_id"] = str(design["_id"])
        
        # Convert seller_id to string
        if "seller_id" in design:
            seller_id = design["seller_id"]
            design["seller_id"] = str(seller_id)
            
            # Get seller email
            seller = USERS_COLLECTION.find_one({"_id": seller_id})
            design["seller_email"] = seller.get("email") if seller else "Unknown"
        else:
            design["seller_email"] = "Unknown"
    
    return jsonify({"designs": designs}), 200


@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    """Get all users"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    users = list(USERS_COLLECTION.find({}, {"password": 0}))
    
    for user in users:
        user["_id"] = str(user["_id"])
    
    return jsonify({"users": users}), 200


@admin_bp.route("/design/<design_id>/approve", methods=["PUT"])
def approve_design(design_id):
    """Approve a design"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
    if not design:
        return jsonify({"error": "Design not found"}), 404
    
    DESIGNS_COLLECTION.update_one(
        {"_id": ObjectId(design_id)},
        {"$set": {"status": "approved"}}
    )
    
    return jsonify({"message": "Design approved successfully"}), 200


@admin_bp.route("/design/<design_id>/reject", methods=["PUT"])
def reject_design(design_id):
    """Reject a design"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.json
    reason = data.get("reason", "No reason provided")
    
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
    if not design:
        return jsonify({"error": "Design not found"}), 404
    
    DESIGNS_COLLECTION.update_one(
        {"_id": ObjectId(design_id)},
        {"$set": {"status": "rejected", "rejection_reason": reason}}
    )
    
    return jsonify({"message": "Design rejected successfully"}), 200


@admin_bp.route("/design/<design_id>", methods=["DELETE"])
def delete_design_admin(design_id):
    """Delete a design (admin)"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
    if not design:
        return jsonify({"error": "Design not found"}), 404
    
    DESIGNS_COLLECTION.delete_one({"_id": ObjectId(design_id)})
    
    return jsonify({"message": "Design deleted successfully"}), 200


@admin_bp.route("/design/<design_id>/query", methods=["POST"])
def add_design_query(design_id):
    """Add a query/note to a design"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    if not is_admin(user_id):
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.json
    message = data.get("message", "").strip()
    
    if not message:
        return jsonify({"error": "Query message is required"}), 400
    
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
    print(design)
    if not design:
        return jsonify({"error": "Design not found"}), 404
    
    # Create query object
    query = {
        "message": message,
        "created_at": datetime.utcnow().isoformat(),
        "seller_response": None
    }
    
    # Add query to design's admin_queries array
    DESIGNS_COLLECTION.update_one(
        {"_id": ObjectId(design_id)},
        {"$push": {"admin_queries": query}}
    )
    
    return jsonify({"message": "Query added successfully"}), 200
