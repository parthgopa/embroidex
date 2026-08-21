import jwt
import datetime
import os
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "embroidex_super_secret_key_min_32_bytes_long_12345")

def generate_token(user_id, is_admin=False):
    payload = {
        "user_id": str(user_id),
        "admin": is_admin,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_token(token):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user_id_str = payload.get("user_id")
    return ObjectId(user_id_str)

def encode_token(is_admin=False):
    payload = {
        "admin": is_admin,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=180)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
