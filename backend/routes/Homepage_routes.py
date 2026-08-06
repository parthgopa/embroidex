from flask import Blueprint, jsonify
from config import HOMEPAGE_CONFIG_COLLECTION
from constants.categories import get_subcategories

homepage_bp = Blueprint("homepage", __name__)

@homepage_bp.route("/data", methods=["GET"])
def get_homepage_data():
    """
    Returns public homepage data:
    - topCategories with their subcategories
    - showcases as fully static content (title, description, images, link)
    """
    config = HOMEPAGE_CONFIG_COLLECTION.find_one({})

    if not config:
        return jsonify({
            "topCategories": [],
            "showcases": []
        }), 200

    # 1. Format Top Categories with Subcategories
    top_categories_list = config.get("topCategories", [])
    formatted_top_categories = []
    for cat in top_categories_list:
        formatted_top_categories.append({
            "name": cat,
            "subcategories": get_subcategories(cat)
        })

    # 2. Return showcases as-is (fully static content managed by admin)
    showcases = config.get("showcases", [])

    return jsonify({
        "topCategories": formatted_top_categories,
        "showcases": showcases
    }), 200
