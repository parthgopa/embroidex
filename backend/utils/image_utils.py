import base64


def encode_image_to_base64(file_storage):
    """
    Encode a Flask FileStorage (or any file-like object) to a base64 data URI.
    Returns a string like: "data:image/jpeg;base64,/9j/4AAQ..."
    """
    file_storage.seek(0)
    raw_bytes = file_storage.read()
    file_storage.seek(0)

    mime_type = _detect_mime(file_storage.filename, raw_bytes)
    b64_string = base64.b64encode(raw_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64_string}"


def encode_bytes_to_base64(raw_bytes, filename=""):
    """
    Encode raw bytes to a base64 data URI.
    """
    mime_type = _detect_mime(filename, raw_bytes)
    b64_string = base64.b64encode(raw_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64_string}"


def _detect_mime(filename, raw_bytes):
    """
    Detect MIME type from filename extension first,
    then fall back to magic-byte sniffing — no external libraries.
    """
    ext = (filename or "").rsplit(".", 1)[-1].lower()
    ext_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    if ext in ext_map:
        return ext_map[ext]

    # Magic byte sniffing
    header = raw_bytes[:12] if len(raw_bytes) >= 12 else raw_bytes
    if header[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if header[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if header[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "image/webp"

    return "image/jpeg"
