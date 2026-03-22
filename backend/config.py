from pymongo import MongoClient
import os
import dotenv

# from backend.routes.Settings_routes import SETTINGS_COLLECTION

dotenv.load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "embroidex_db")
ADMIN_KEY = os.getenv("ADMIN_SECRET_KEY", "embroidex")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

USERS_COLLECTION = db["users"]
DESIGNS_COLLECTION = db["designs"]
PURCHASES_COLLECTION = db["purchases"]
SELLERS_COLLECTION = db["sellers"]
TRANSACTIONS_COLLECTION = db["transactions"]
WITHDRAWALS_COLLECTION = db["withdrawals"]
SETTINGS_COLLECTION = db["settings"]

UPLOAD_IMAGE_FOLDER = "uploads/images"
UPLOAD_FILE_FOLDER = "uploads/files"

ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg"}
ALLOWED_FILE_EXT = {"zip", "emb"}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB