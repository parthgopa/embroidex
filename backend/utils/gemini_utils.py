"""
Gemini API utilities for generating design titles and descriptions
"""
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
if GEMINI_API_KEY:
    from google import genai
    client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = "gemini-2.5-flash"


def _generate(prompt):
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return (response.text or "").strip()


def refine_design_text(field_type, original_text):
    if field_type not in {"title", "description"}:
        raise ValueError("Invalid field_type")

    cleaned_text = (original_text or "").strip()
    if not cleaned_text:
        raise ValueError("Original text is required")

    if not client:
        return cleaned_text

    if field_type == "title":
        prompt = f"""Refine this embroidery design title for an ecommerce listing. Keep the meaning, make it professional and appealing. Return only the refined title, nothing else. Max 60 characters.

Original: {cleaned_text}"""
    else:
        prompt = f"""Refine this embroidery design description for an ecommerce listing. Keep the meaning, make it professional and appealing to buyers. Return only the refined description, nothing else. Max 300 characters.

Original: {cleaned_text}"""

    text = _generate(prompt)
    return text[:60] if field_type == "title" else text[:300]
