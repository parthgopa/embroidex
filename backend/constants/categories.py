"""
Design Categories and Subcategories for Embroidex
Migrated to MongoDB, these functions now dynamically fetch from the database.
"""
from config import PLATFORM_CATEGORIES_COLLECTION

def _fetch_categories_from_db():
    """Helper to fetch categories as a dictionary mapping category_name -> subcategories"""
    docs = PLATFORM_CATEGORIES_COLLECTION.find({})
    cat_dict = {}
    for doc in docs:
        cat_dict[doc["category_name"]] = doc.get("subcategories", [])
    return cat_dict

def get_all_categories():
    """Returns list of all main categories"""
    docs = PLATFORM_CATEGORIES_COLLECTION.find({}, {"category_name": 1})
    return [doc["category_name"] for doc in docs]

def get_subcategories(category):
    """Returns subcategories for a given category"""
    doc = PLATFORM_CATEGORIES_COLLECTION.find_one({"category_name": category})
    if doc:
        return doc.get("subcategories", [])
    return []

def validate_category(category, subcategory):
    """Validates if category and subcategory combination is valid"""
    doc = PLATFORM_CATEGORIES_COLLECTION.find_one({"category_name": category})
    if not doc:
        return False
    return subcategory in doc.get("subcategories", [])

# Dynamic proxy for DESIGN_CATEGORIES for any legacy code expecting a dict
class DynamicCategoryDict:
    def keys(self):
        return get_all_categories()
    
    def items(self):
        return _fetch_categories_from_db().items()
        
    def get(self, key, default=None):
        sub = get_subcategories(key)
        return sub if sub else default
        
    def __getitem__(self, key):
        doc = PLATFORM_CATEGORIES_COLLECTION.find_one({"category_name": key})
        if not doc:
            raise KeyError(key)
        return doc.get("subcategories", [])
        
    def __contains__(self, key):
        return PLATFORM_CATEGORIES_COLLECTION.count_documents({"category_name": key}) > 0

DESIGN_CATEGORIES = DynamicCategoryDict()
