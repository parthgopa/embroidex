"""
Gemini API utilities for generating design titles and descriptions
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def _build_context(file_names=None, category=None, subcategory=None):
    parts = []
    if file_names:
        parts.append(f"Embroidery files: {', '.join(file_names[:15])}")
    if category:
        parts.append(f"Category: {category}")
    if subcategory:
        parts.append(f"Subcategory: {subcategory}")
    return "\n".join(parts)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None


def generate_design_metadata(file_names, category=None, subcategory=None):
    """
    Generate title and description for embroidery design based on file names
    
    Args:
        file_names: List of file names in the design package
        category: Optional category for context
        subcategory: Optional subcategory for context
        
    Returns:
        dict: {"title": str, "description": str}
    """
    if not model:
        return {
            "title": "Embroidery Design",
            "description": "Beautiful embroidery design for your creative projects"
        }
    
    try:
        files_str = ", ".join(file_names[:10])
        
        prompt = f"""You are an expert in embroidery design naming and description.
        
Given these embroidery design file names: {files_str}
{f'Category: {category}' if category else ''}
{f'Subcategory: {subcategory}' if subcategory else ''}

Generate:
1. A catchy, professional title (max 60 characters) for this embroidery design
2. A compelling description (max 200 characters) highlighting the design's features and use cases

Format your response as:
TITLE: [your title here]
DESCRIPTION: [your description here]"""

        response = model.generate_content(prompt)
        text = response.text
        
        title = "Embroidery Design"
        description = "Beautiful embroidery design for your creative projects"
        
        for line in text.split('\n'):
            if line.startswith('TITLE:'):
                title = line.replace('TITLE:', '').strip()[:60]
            elif line.startswith('DESCRIPTION:'):
                description = line.replace('DESCRIPTION:', '').strip()[:200]
        
        return {
            "title": title,
            "description": description
        }
    
    except Exception as e:
        print(f"Gemini API error: {e}")
        return {
            "title": "Embroidery Design",
            "description": "Beautiful embroidery design for your creative projects"
        }


def refine_design_text(field_type, original_text, file_names=None, category=None, subcategory=None):
    if field_type not in {"title", "description"}:
        raise ValueError("Invalid field_type")

    cleaned_text = (original_text or "").strip()
    if not cleaned_text:
        raise ValueError("Original text is required")

    if not model:
        return cleaned_text

    context = _build_context(file_names=file_names, category=category, subcategory=subcategory)
    instruction = "Create a polished ecommerce-ready title under 60 characters." if field_type == "title" else "Create a polished ecommerce-ready description under 300 characters with strong buyer-facing clarity."
    label = field_type.upper()

    prompt = f"""You are an expert embroidery ecommerce copywriter.

Refine the seller's {field_type} while keeping the core meaning accurate to the design.
Do not invent technical details that are not supported.
Keep the tone professional, clear, and appealing for embroidery buyers.
Return only the refined {field_type}.

{context}
Seller {field_type}: {cleaned_text}

Task: {instruction}
Output format: {label}: [refined text]"""

    response = model.generate_content(prompt)
    text = (response.text or "").strip()

    for line in text.split("\n"):
        if line.startswith(f"{label}:"):
            value = line.replace(f"{label}:", "", 1).strip()
            return value[:60] if field_type == "title" else value[:300]

    return text[:60] if field_type == "title" else text[:300]
