from flask import Blueprint, request, jsonify
import os
import uuid
import shutil
import json

from config import DESIGNS_COLLECTION, UPLOAD_FILE_FOLDER
from utils.file_utils import validate_file
from utils.jwt_utils import decode_token
from utils.zip_utils import extract_zip_file, categorize_files
from utils.gemini_utils import refine_design_text
from utils.image_utils import encode_image_to_base64
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
        parsed_metadata = []

    if not isinstance(parsed_metadata, list):
        parsed_metadata = []

    metadata_by_file = {}
    for item in parsed_metadata:
        if isinstance(item, dict):
            file_name = (item.get("file_name") or "").strip()
            if file_name:
                metadata_by_file[file_name] = item

    normalized_metadata = []
    total_stitch_count = 0

    for file_name in expected_file_names:
        item = metadata_by_file.get(file_name, {})
        stitch_raw = item.get("stitch_count")
        try:
            stitch_count = int(float(stitch_raw)) if stitch_raw is not None and str(stitch_raw).strip() != "" else 0
        except (ValueError, TypeError):
            stitch_count = 0

        width_raw = item.get("width_mm")
        try:
            width_mm = float(width_raw) if width_raw is not None and str(width_raw).strip() != "" else ""
        except (ValueError, TypeError):
            width_mm = ""

        height_raw = item.get("height_mm")
        try:
            height_mm = float(height_raw) if height_raw is not None and str(height_raw).strip() != "" else ""
        except (ValueError, TypeError):
            height_mm = ""

        normalized_entry = {
            "file_name": file_name,
            "stitch_count": stitch_count,
            "width_mm": width_mm,
            "height_mm": height_mm
        }
        normalized_metadata.append(normalized_entry)
        total_stitch_count += stitch_count

    return normalized_metadata, total_stitch_count


@sel_design_bp.route("/approved", methods=["GET"])
def get_approved_designs():
    """Get approved designs for public viewing with pagination support"""
    try:
        from routes.Settings_routes import get_designs_per_page
        import math
        
        default_limit = get_designs_per_page()
        
        page = request.args.get("page", type=int)
        limit = request.args.get("limit", type=int)
        
        query = {"status": "approved"}
        
        if page is not None and page > 0:
            limit_val = limit if (limit and limit > 0) else default_limit
            skip_val = (page - 1) * limit_val
            
            total_count = DESIGNS_COLLECTION.count_documents(query)
            designs = list(
                DESIGNS_COLLECTION.find(query, {"additional_images": 0})
                .sort("created_at", -1)
                .skip(skip_val)
                .limit(limit_val)
            )
            
            for design in designs:
                design["_id"] = str(design["_id"])
                if "seller_id" in design:
                    design["seller_id"] = str(design["seller_id"])
                    
            return jsonify({
                "designs": designs,
                "page": page,
                "limit": limit_val,
                "total_designs": total_count,
                "total_pages": math.ceil(total_count / limit_val) if limit_val > 0 else 1
            }), 200
        else:
            designs = list(DESIGNS_COLLECTION.find(query, {"additional_images": 0}).sort("created_at", -1))
            for design in designs:
                design["_id"] = str(design["_id"])
                if "seller_id" in design:
                    design["seller_id"] = str(design["seller_id"])
            return jsonify({"designs": designs, "total_designs": len(designs)}), 200
            
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
    allowed_design_extensions = {"zip", "emb", "dst", "pes", "jef", "exp", "vp3", "art", "xxx", "hus", "vip", "sew"}
    valid_file, msg = validate_file(design_file, allowed_design_extensions)
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
            file_names = [os.path.basename(f) for f in extracted_files if os.path.splitext(f)[1].lower().replace('.', '') in allowed_design_extensions]

        if not file_names:
            file_names = [os.path.basename(design_file.filename)]

        emb_metadata_list = [
            {
                "file_name": file_name,
                "stitch_count": "",
                "width_mm": "",
                "height_mm": ""
            }
            for file_name in file_names
        ]
    
    else:
        # Single design file (.emb, .dst, .pes, etc.)
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
        "design_file_path": design_file_path,
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
    field_type = (data.get("field_type") or "").strip().lower()
    original_text = (data.get("original_text") or "").strip()

    if field_type not in {"title", "description"}:
        return jsonify({"error": "Invalid field type"}), 400

    if not original_text:
        return jsonify({"error": f"{field_type.title()} is required before AI refinement"}), 400

    try:
        refined_text = refine_design_text(
            field_type=field_type,
            original_text=original_text
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
    design_file_path = (request.form.get("design_file_path") or "").strip()
    file_names_raw = request.form.get("file_names") or "[]"

    # Get files
    thumbnail = request.files.get("thumbnail")
    additional_images = request.files.getlist("additional_images")

    try:
        file_names = json.loads(file_names_raw)
        if not isinstance(file_names, list):
            file_names = []
    except json.JSONDecodeError:
        file_names = []

    if not thumbnail:
        return jsonify({"error": "Thumbnail is required"}), 400
    
    if not title or not description or not category or not subcategory or not price:
        return jsonify({"error": "All fields are required"}), 400

    if title_source not in {"original", "ai"} or description_source not in {"original", "ai"}:
        return jsonify({"error": "Invalid content source selection"}), 400

    if not (title_original or title_ai) or not (description_original or description_ai):
        return jsonify({"error": "Title and description are required"}), 400

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
        if img.filename:
            valid_img, msg = validate_file(img, {"png", "jpg", "jpeg"})
            if not valid_img:
                return jsonify({"error": f"Additional image: {msg}"}), 400

    try:
        emb_metadata, total_stitch_count = _build_emb_metadata_payload(
            emb_metadata_raw,
            file_names
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    selected_title = title_ai if title_source == "ai" else title_original
    selected_description = description_ai if description_source == "ai" else description_original
    
    # Create unique design ID
    design_id = str(uuid.uuid4())
    
    # Encode thumbnail to base64
    thumbnail_data = encode_image_to_base64(thumbnail)

    # Encode additional images to base64
    additional_image_data = []
    for img in additional_images:
        if img.filename:
            additional_image_data.append(encode_image_to_base64(img))
    
    needles_raw = request.form.get("needles", "1")
    file_format_raw = (request.form.get("file_format") or request.form.get("design_file_type") or "EMB").strip().upper()
    if file_format_raw.startswith("."):
        file_format_raw = file_format_raw[1:]

    try:
        needles = int(needles_raw)
        if needles < 1 or needles > 15:
            needles = 1
    except (TypeError, ValueError):
        needles = 1

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
        "needles": needles,
        "file_format": file_format_raw,
        "design_file_type": file_format_raw.lower(),
        "price": float(price),
        "thumbnail": thumbnail_data,
        "design_file_path": design_file_path,
        "additional_images": additional_image_data,
        "file_names": file_names,
        "emb_metadata": emb_metadata,
        "total_stitch_count": total_stitch_count,
        "emb_files_count": len(file_names),
        "status": "pending"
    }

    # Guard: MongoDB BSON limit is 16MB. Check total image data size before inserting.
    total_image_size = len(thumbnail_data.encode("utf-8")) + sum(len(img.encode("utf-8")) for img in additional_image_data)
    if total_image_size > 14 * 1024 * 1024:
        return jsonify({"error": "Total image size is too large. Please use smaller or fewer images (max ~10MB each)."}), 400

    # Save to database
    DESIGNS_COLLECTION.insert_one(design_document)

    # Clean up session if it still exists
    session_id = request.form.get("session_id")
    if session_id and session_id in TEMP_UPLOADS:
        del TEMP_UPLOADS[session_id]
    
    return jsonify({
        "message": "Design uploaded successfully, pending approval",
        "design_id": design_id
    }), 201


@sel_design_bp.route("/categories", methods=["GET"])
def get_categories():
    """Get all available categories"""
    from constants.categories import _fetch_categories_from_db
    categories_dict = _fetch_categories_from_db()
    return jsonify({"categories": categories_dict}), 200


@sel_design_bp.route("/my-designs", methods=["GET"])
def get_my_designs():
    """Get all designs uploaded by the seller"""
    token = request.headers.get("Authorization")
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
    """Update design details, thumbnail, additional images, or design file"""
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
    
    design_file_updated = False
    update_data = {}
    
    if request.is_json:
        data = request.json or {}
        for field in ["title", "description", "category", "subcategory", "needles", "file_format", "title_original", "title_ai", "title_source", "description_original", "description_ai", "description_source"]:
            if field in data:
                update_data[field] = data[field]
        if "price" in data and data["price"]:
            update_data["price"] = float(data["price"])
        if "existing_additional_images" in data:
            update_data["additional_images"] = data["existing_additional_images"]
    else:
        # Multipart form data
        data = request.form
        for field in ["title", "description", "category", "subcategory", "needles", "file_format", "title_original", "title_ai", "title_source", "description_original", "description_ai", "description_source"]:
            if field in data:
                update_data[field] = data[field]
        if "price" in data and data["price"]:
            update_data["price"] = float(data["price"])
            
        # Handle kept additional images by index list
        existing_imgs = None
        if "kept_image_indices_json" in request.form:
            try:
                kept_indices = json.loads(request.form["kept_image_indices_json"])
                orig_imgs = design.get("additional_images", [])
                existing_imgs = [orig_imgs[i] for i in kept_indices if 0 <= i < len(orig_imgs)]
            except Exception as e:
                print(f"Error parsing kept_image_indices_json: {e}")
                existing_imgs = design.get("additional_images", [])
        elif "existing_additional_images_json" in request.form:
            try:
                existing_imgs = json.loads(request.form["existing_additional_images_json"])
            except Exception as e:
                print(f"Error parsing existing_additional_images_json: {e}")
                existing_imgs = design.get("additional_images", [])
        
        # New thumbnail
        if "thumbnail" in request.files:
            thumb_file = request.files["thumbnail"]
            if thumb_file and thumb_file.filename:
                update_data["thumbnail"] = encode_image_to_base64(thumb_file)
                
        # New additional images
        new_additional_imgs = []
        if "additional_images" in request.files:
            files_list = request.files.getlist("additional_images")
            for f in files_list:
                if f and f.filename:
                    new_additional_imgs.append(encode_image_to_base64(f))
                    
        if existing_imgs is not None or new_additional_imgs:
            base_imgs = existing_imgs if existing_imgs is not None else design.get("additional_images", [])
            update_data["additional_images"] = base_imgs + new_additional_imgs
            
        # New design file (.zip or .emb) -> ONLY THIS REQUIRES ADMIN RE-APPROVAL
        if "design_file" in request.files:
            d_file = request.files["design_file"]
            if d_file and d_file.filename:
                import uuid
                unique_folder_name = str(uuid.uuid4())
                upload_dir = os.path.join(UPLOAD_FILE_FOLDER, unique_folder_name)
                os.makedirs(upload_dir, exist_ok=True)
                
                saved_path = os.path.join(upload_dir, d_file.filename)
                d_file.save(saved_path)
                
                if d_file.filename.lower().endswith(".zip"):
                    extraction = extract_zip_file(saved_path, upload_dir)
                    categorized = categorize_files(extraction["extracted_files"])
                    emb_files = categorized.get("emb_files", [])
                    file_names = [os.path.basename(f) for f in emb_files]
                    update_data["zip_path"] = saved_path
                    update_data["design_file_path"] = saved_path
                    update_data["file_names"] = file_names
                else:
                    update_data["design_file_path"] = saved_path
                    update_data["file_names"] = [d_file.filename]
                
                design_file_updated = True
                
    if design_file_updated:
        update_data["status"] = "pending"
        
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400
        
    DESIGNS_COLLECTION.update_one(
        {"_id": ObjectId(design_id)},
        {"$set": update_data}
    )
    
    msg = "Design file updated successfully, pending admin review" if design_file_updated else "Design updated successfully"
    return jsonify({"message": msg}), 200


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
