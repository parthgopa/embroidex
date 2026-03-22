from flask import Blueprint, request, jsonify
import os
import uuid
import shutil
import json

from config import DESIGNS_COLLECTION, UPLOAD_IMAGE_FOLDER, UPLOAD_FILE_FOLDER
from utils.file_utils import validate_file
from utils.jwt_utils import decode_token
from utils.zip_utils import extract_zip_file, get_file_names_from_zip, categorize_files
from utils.emb_utils import extract_emb_metadata
from utils.gemini_utils import generate_design_metadata
from constants.categories import validate_category, get_all_categories, get_subcategories

sel_design_bp = Blueprint("seller_design", __name__)

# Temporary storage for processed uploads (in production, use Redis or similar)
TEMP_UPLOADS = {}


# Public route for approved designs
@sel_design_bp.route("/approved", methods=["GET"])
def get_approved_designs():
    """Get all approved designs for public viewing"""
    try:
        designs = list(DESIGNS_COLLECTION.find({"status": "approved"}))
        
        # Convert ObjectId to string
        for design in designs:
            design["_id"] = str(design["_id"])
            if "seller_id" in design:
                design["seller_id"] = str(design["seller_id"])
        
        return jsonify({"designs": designs}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sel_design_bp.route("/design/<design_id>", methods=["GET"])
def get_design_details(design_id):
    """Get single design details by ID (public route for approved designs)"""
    try:
        from bson import ObjectId
        
        design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id)})
        
        if not design:
            return jsonify({"error": "Design not found"}), 404
        
        # Only allow viewing approved designs publicly
        if design.get("status") != "approved":
            return jsonify({"error": "Design not available"}), 403
        
        # Convert ObjectId to string
        design["_id"] = str(design["_id"])
        if "seller_id" in design:
            design["seller_id"] = str(design["seller_id"])
        
        return jsonify({"design": design}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@sel_design_bp.route("/process-upload", methods=["POST"])
def process_upload():
    """
    Step 1: Process ZIP file, extract metadata, generate AI title/description
    Returns preview data to frontend WITHOUT saving to database
    """
    
    # Authentication
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Get files
    design_file = request.files.get("design_file")
    category = request.form.get("category", "")
    subcategory = request.form.get("subcategory", "")
    
    # Validation
    if not design_file:
        return jsonify({"error": "Design file is required"}), 400
    
    # Validate design file
    valid_file, msg = validate_file(design_file, {"zip", "emb"})
    if not valid_file:
        return jsonify({"error": f"Design file: {msg}"}), 400
    
    # Create unique session ID for this upload
    session_id = str(uuid.uuid4())
    
    # Save design file temporarily
    design_file_name = f"{session_id}_{design_file.filename}"
    design_file_path = f"{UPLOAD_FILE_FOLDER}/{design_file_name}".replace("\\", "/")
    design_file_save_path = os.path.join(UPLOAD_FILE_FOLDER, design_file_name)
    os.makedirs(UPLOAD_FILE_FOLDER, exist_ok=True)
    design_file.save(design_file_save_path)
    
    # Process design file
    file_extension = os.path.splitext(design_file.filename)[1].lower()
    extracted_files = []
    emb_metadata_list = []
    file_names = []
    
    if file_extension == '.zip':
        # Extract ZIP file
        extract_dir = os.path.join(UPLOAD_FILE_FOLDER, f"{session_id}_extracted")
        os.makedirs(extract_dir, exist_ok=True)
        
        # Get file names for Gemini
        file_names = get_file_names_from_zip(design_file_save_path)
        
        # Extract files
        extracted_files = extract_zip_file(design_file_save_path, extract_dir)
        
        # Categorize extracted files
        categorized = categorize_files(extracted_files)
        
        # Process EMB files
        for emb_file in categorized["emb"]:
            metadata = extract_emb_metadata(emb_file)
            metadata["file_name"] = os.path.basename(emb_file)
            emb_metadata_list.append(metadata)
    
    elif file_extension == '.emb':
        # Single EMB file
        file_names = [design_file.filename]
        metadata = extract_emb_metadata(design_file_save_path)
        metadata["file_name"] = design_file.filename
        emb_metadata_list.append(metadata)
    
    # Generate title and description using Gemini API
    ai_metadata = generate_design_metadata(file_names, category, subcategory)
    design_title = ai_metadata.get("title", "Embroidery Design")
    design_description = ai_metadata.get("description", "Beautiful embroidery design")
    
    # Calculate total stitch count
    total_stitch_count = sum(meta.get("stitch_count", 0) for meta in emb_metadata_list)
    
    # Store temporary data
    TEMP_UPLOADS[session_id] = {
        "user_id": str(user_id),
        "design_file_path": design_file_path,
        "design_file_save_path": design_file_save_path,
        "extracted_files": extracted_files,
        "file_names": file_names,
        "emb_metadata": emb_metadata_list,
        "total_stitch_count": total_stitch_count
    }
    
    # Return preview data to frontend
    return jsonify({
        "session_id": session_id,
        "title": design_title,
        "description": design_description,
        "file_names": file_names,
        "total_stitch_count": total_stitch_count,
        "emb_files_count": len(emb_metadata_list),
        "emb_metadata": emb_metadata_list
    }), 200


@sel_design_bp.route("/final-upload", methods=["POST"])
def final_upload():
    """
    Step 2: Save design to database after user confirms/edits the details
    """
    
    # Authentication
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    # Get form data
    session_id = request.form.get("session_id")
    title = request.form.get("title")
    description = request.form.get("description")
    category = request.form.get("category")
    subcategory = request.form.get("subcategory")
    price = request.form.get("price")
    
    # Get files
    thumbnail = request.files.get("thumbnail")
    additional_images = request.files.getlist("additional_images")
    
    # Validation
    if not session_id or session_id not in TEMP_UPLOADS:
        return jsonify({"error": "Invalid or expired session"}), 400
    
    if not thumbnail:
        return jsonify({"error": "Thumbnail is required"}), 400
    
    if not title or not description or not category or not subcategory or not price:
        return jsonify({"error": "All fields are required"}), 400
    
    if not validate_category(category, subcategory):
        return jsonify({"error": "Invalid category or subcategory"}), 400
    
    # Validate thumbnail
    valid_thumb, msg = validate_file(thumbnail, {"png", "jpg", "jpeg"})
    if not valid_thumb:
        return jsonify({"error": f"Thumbnail: {msg}"}), 400
    
    # Validate additional images (max 7)
    if len(additional_images) > 7:
        return jsonify({"error": "Maximum 7 additional images allowed"}), 400
    
    for img in additional_images:
        if img.filename:  # Check if file is actually uploaded
            valid_img, msg = validate_file(img, {"png", "jpg", "jpeg"})
            if not valid_img:
                return jsonify({"error": f"Additional image: {msg}"}), 400
    
    # Get temporary data
    temp_data = TEMP_UPLOADS[session_id]
    
    # Create unique design ID
    design_id = str(uuid.uuid4())
    
    # Save thumbnail
    thumbnail_name = f"{design_id}_thumbnail_{thumbnail.filename}"
    thumbnail_path = f"{UPLOAD_IMAGE_FOLDER}/{thumbnail_name}".replace("\\", "/")
    thumbnail_save_path = os.path.join(UPLOAD_IMAGE_FOLDER, thumbnail_name)
    os.makedirs(UPLOAD_IMAGE_FOLDER, exist_ok=True)
    thumbnail.save(thumbnail_save_path)
    
    # Save additional images
    additional_image_paths = []
    for idx, img in enumerate(additional_images):
        if img.filename:
            img_name = f"{design_id}_img{idx+1}_{img.filename}"
            img_path = f"{UPLOAD_IMAGE_FOLDER}/{img_name}".replace("\\", "/")
            img_save_path = os.path.join(UPLOAD_IMAGE_FOLDER, img_name)
            img.save(img_save_path)
            additional_image_paths.append(img_path)
    
    # Prepare design document
    design_document = {
        "design_id": design_id,
        "seller_id": user_id,
        "title": title,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "price": float(price),
        "thumbnail_path": thumbnail_path,
        "design_file_path": temp_data["design_file_path"],
        "additional_images": additional_image_paths,
        "file_names": temp_data["file_names"],
        "emb_metadata": temp_data["emb_metadata"],
        "total_stitch_count": temp_data["total_stitch_count"],
        "extracted_files_count": len(temp_data["extracted_files"]),
        "status": "pending"
    }
    
    # Save to database
    DESIGNS_COLLECTION.insert_one(design_document)
    
    # Clean up temporary data
    del TEMP_UPLOADS[session_id]
    
    return jsonify({
        "message": "Design uploaded successfully, pending approval",
        "design_id": design_id
    }), 201


@sel_design_bp.route("/categories", methods=["GET"])
def get_categories():
    """Get all available categories"""
    from constants.categories import DESIGN_CATEGORIES
    return jsonify({"categories": DESIGN_CATEGORIES}), 200


@sel_design_bp.route("/my-designs", methods=["GET"])
def get_my_designs():
    """Get all designs uploaded by the seller"""
    token = request.headers.get("Authorization")
    print(token)
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    designs = list(DESIGNS_COLLECTION.find({"seller_id": user_id}))
    
    # Convert ObjectId to string
    for design in designs:
        design["_id"] = str(design["_id"])
        if "seller_id" in design:
            design["seller_id"] = str(design["seller_id"])
    
    return jsonify({"designs": designs}), 200


@sel_design_bp.route("/design/<design_id>", methods=["PUT"])
def update_design(design_id):
    """Update design details (title, description, price)"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    from bson import ObjectId
    
    # Check if design exists and belongs to user
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id), "seller_id": user_id})
    if not design:
        return jsonify({"error": "Design not found or unauthorized"}), 404
    
    data = request.json
    
    # Update only allowed fields
    update_data = {}
    if "title" in data:
        update_data["title"] = data["title"]
    if "description" in data:
        update_data["description"] = data["description"]
    if "price" in data:
        update_data["price"] = float(data["price"])
    
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400
    
    DESIGNS_COLLECTION.update_one(
        {"_id": ObjectId(design_id)},
        {"$set": update_data}
    )
    
    return jsonify({"message": "Design updated successfully"}), 200


@sel_design_bp.route("/design/<design_id>", methods=["DELETE"])
def delete_design(design_id):
    """Delete a design"""
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        token = token.replace("Bearer ", "")
        user_id = decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401
    
    from bson import ObjectId
    
    # Check if design exists and belongs to user
    design = DESIGNS_COLLECTION.find_one({"_id": ObjectId(design_id), "seller_id": user_id})
    if not design:
        return jsonify({"error": "Design not found or unauthorized"}), 404
    
    # Delete design
    DESIGNS_COLLECTION.delete_one({"_id": ObjectId(design_id)})
    
    # TODO: Delete associated files from filesystem
    # os.remove(design["thumbnail_path"])
    # os.remove(design["design_file_path"])
    # for img_path in design.get("additional_images", []):
    #     os.remove(img_path)
    
    return jsonify({"message": "Design deleted successfully"}), 200
