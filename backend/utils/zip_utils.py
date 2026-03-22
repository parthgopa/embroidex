"""
ZIP file processing utilities for extracting and analyzing design files
"""
import os
import zipfile
import uuid


def extract_zip_file(zip_path, extract_to):
    """
    Extract ZIP file and return list of extracted files
    
    Args:
        zip_path: Path to ZIP file
        extract_to: Directory to extract files to
        
    Returns:
        list: List of extracted file paths
    """
    try:
        extracted_files = []
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Get list of files
            file_list = zip_ref.namelist()
            
            # Extract all files
            zip_ref.extractall(extract_to)
            
            # Build full paths
            for file_name in file_list:
                if not file_name.endswith('/'):  # Skip directories
                    full_path = os.path.join(extract_to, file_name)
                    if os.path.exists(full_path):
                        extracted_files.append(full_path)
        
        return extracted_files
    
    except Exception as e:
        print(f"Error extracting ZIP: {e}")
        return []


def get_file_names_from_zip(zip_path):
    """
    Get list of file names from ZIP without extracting
    
    Args:
        zip_path: Path to ZIP file
        
    Returns:
        list: List of file names
    """
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            return [f for f in zip_ref.namelist() if not f.endswith('/')]
    except Exception as e:
        print(f"Error reading ZIP: {e}")
        return []


def categorize_files(file_paths):
    """
    Categorize extracted files by type
    
    Args:
        file_paths: List of file paths
        
    Returns:
        dict: Categorized files {emb: [], images: [], others: []}
    """
    categorized = {
        "emb": [],
        "images": [],
        "others": []
    }
    
    for file_path in file_paths:
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.emb':
            categorized["emb"].append(file_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
            categorized["images"].append(file_path)
        else:
            categorized["others"].append(file_path)
    
    return categorized
