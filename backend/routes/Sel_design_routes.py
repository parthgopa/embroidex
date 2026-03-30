from flask import Blueprint, request, jsonify
import os
import uuid
import shutil
import json

from config import DESIGNS_COLLECTION, UPLOAD_IMAGE_FOLDER, UPLOAD_FILE_FOLDER
from utils.file_utils import validate_file
from utils.jwt_utils import decode_token
from utils.zip_utils import extract_zip_file, categorize_files
from utils.gemini_utils import refine_design_text
from constants.categories import validate_category, get_all_categories, get_subcategories

sel_design_bp = Blueprint("seller_design", __name__)

# Temporary storage for processed uploads (in production, use Redis or similar)
TEMP_UPLOADS = {}


def _parse_number(value, field_name, allow_decimal=False):
    try:
        parsed_value = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number")

    if parsed_value < 0:
        raise ValueError(f"{field_name} must be zero or greater")

    return round(parsed_value, 2) if allow_decimal else int(parsed_value)


def _build_emb_metadata_payload(raw_metadata, expected_file_names):
    try:
        parsed_metadata = json.loads(raw_metadata or "[]")
    except json.JSONDecodeError:
        raise ValueError("Invalid embroidery metadata payload")

    if not isinstance(parsed_metadata, list):
        raise ValueError("Embroidery metadata payload must be a list")

    metadata_by_file = {}
    for item in parsed_metadata:
        if not isinstance(item, dict):
            raise ValueError("Each embroidery metadata entry must be an object")

        file_name = (item.get("file_name") or "").strip()
        if not file_name:
            raise ValueError("Each embroidery metadata entry must include file_name")

        metadata_by_file[file_name] = {
            "file_name": file_name,
            "stitch_count": _parse_number(item.get("stitch_count"), f"Stitches for {file_name}"),
            "width_mm": _parse_number(item.get("width_mm"), f"Width for {file_name}", allow_decimal=True),
            "height_mm": _parse_number(item.get("height_mm"), f"Height for {file_name}", allow_decimal=True)
        }

    normalized_metadata = []
    for file_name in expected_file_names:
        if file_name not in metadata_by_file:
            raise ValueError(f"Missing embroidery details for {file_name}")
        normalized_metadata.append(metadata_by_file[file_name])

    total_stitch_count = sum(item["stitch_count"] for item in normalized_metadata)
    return normalized_metadata, total_stitch_count


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
        
        # Extract files
        extracted_files = extract_zip_file(design_file_save_path, extract_dir)
        
        # Categorize extracted files
        categorized = categorize_files(extracted_files)

        file_names = [os.path.basename(emb_file) for emb_file in categorized["emb"]]

        if not file_names:
            return jsonify({"error": "ZIP file must contain at least one .emb file"}), 400

        emb_metadata_list = [
            {
                "file_name": file_name,
                "stitch_count": "",
                "width_mm": "",
                "height_mm": ""
            }
            for file_name in file_names
        ]
    
    elif file_extension == '.emb':
        # Single EMB file
        file_names = [design_file.filename]
        emb_metadata_list = [
            {
                "file_name": design_file.filename,
                "stitch_count": "",
                "width_mm": "",
                "height_mm": ""
            }
        ]
    
    # Calculate total stitch count
    total_stitch_count = 0
    
    # Store temporary data
    TEMP_UPLOADS[session_id] = {
        "user_id": str(user_id),
        "design_file_path": design_file_path,
        "design_file_save_path": design_file_save_path,
        "extracted_files": extracted_files,
        "file_names": file_names,
        "emb_metadata": emb_metadata_list,
        "total_stitch_count": total_stitch_count,
        "design_file_type": file_extension.replace(".", "")
    }
    
    # Return preview data to frontend
    return jsonify({
        "session_id": session_id,
        "file_names": file_names,
        "total_stitch_count": total_stitch_count,
        "emb_files_count": len(emb_metadata_list),
        "emb_metadata": emb_metadata_list,
        "design_file_type": file_extension.replace(".", "")
    }), 200


@sel_design_bp.route("/refine-metadata", methods=["POST"])
def refine_metadata():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        token = token.replace("Bearer ", "")
        decode_token(token)
    except:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json() or {}
    session_id = data.get("session_id")
    field_type = (data.get("field_type") or "").strip().lower()
    original_text = (data.get("original_text") or "").strip()
    category = (data.get("category") or "").strip()
    subcategory = (data.get("subcategory") or "").strip()

    if not session_id or session_id not in TEMP_UPLOADS:
        return jsonify({"error": "Invalid or expired session"}), 400

    if field_type not in {"title", "description"}:
        return jsonify({"error": "Invalid field type"}), 400

    if not original_text:
        return jsonify({"error": f"{field_type.title()} is required before AI refinement"}), 400

    try:
        refined_text = refine_design_text(
            field_type=field_type,
            original_text=original_text,
            file_names=TEMP_UPLOADS[session_id].get("file_names", []),
            category=category,
            subcategory=subcategory
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({
        "field_type": field_type,
        "original_text": original_text,
        "refined_text": refined_text
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
    emb_metadata_raw = request.form.get("emb_metadata")
    title_original = (request.form.get("title_original") or "").strip()
    title_ai = (request.form.get("title_ai") or "").strip()
    title_source = (request.form.get("title_source") or "original").strip()
    description_original = (request.form.get("description_original") or "").strip()
    description_ai = (request.form.get("description_ai") or "").strip()
    description_source = (request.form.get("description_source") or "original").strip()
    
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

    if title_source not in {"original", "ai"} or description_source not in {"original", "ai"}:
        return jsonify({"error": "Invalid content source selection"}), 400

    if not title_original or not description_original:
        return jsonify({"error": "Manual title and description are required"}), 400

    if title_source == "ai" and not title_ai:
        return jsonify({"error": "AI title is required when AI title is selected"}), 400

    if description_source == "ai" and not description_ai:
        return jsonify({"error": "AI description is required when AI description is selected"}), 400
    
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

    if str(temp_data.get("user_id")) != str(user_id):
        return jsonify({"error": "Unauthorized session access"}), 403

    try:
        emb_metadata, total_stitch_count = _build_emb_metadata_payload(
            emb_metadata_raw,
            temp_data.get("file_names", [])
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    selected_title = title_ai if title_source == "ai" else title_original
    selected_description = description_ai if description_source == "ai" else description_original
    
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
        "title": selected_title,
        "description": selected_description,
        "title_original": title_original,
        "title_ai": title_ai,
        "title_source": title_source,
        "description_original": description_original,
        "description_ai": description_ai,
        "description_source": description_source,
        "category": category,
        "subcategory": subcategory,
        "price": float(price),
        "thumbnail_path": thumbnail_path,
        "design_file_path": temp_data["design_file_path"],
        "additional_images": additional_image_paths,
        "file_names": temp_data["file_names"],
        "emb_metadata": emb_metadata,
        "total_stitch_count": total_stitch_count,
        "extracted_files_count": len(temp_data["extracted_files"]),
        "emb_files_count": len(temp_data["file_names"]),
        "design_file_type": temp_data.get("design_file_type"),
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
