"""
Gemini API utilities for generating design titles and descriptions
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

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
