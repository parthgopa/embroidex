import os
from config import ALLOWED_IMAGE_EXT, ALLOWED_FILE_EXT, MAX_FILE_SIZE

def allowed_file(filename, allowed_ext):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_ext

def validate_file(file, allowed_ext):
    if not allowed_file(file.filename, allowed_ext):
        return False, "Invalid file type"

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    if size > MAX_FILE_SIZE:
        return False, "File too large"

    return True, "Valid"