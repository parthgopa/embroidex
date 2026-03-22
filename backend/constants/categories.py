"""
Design Categories and Subcategories for Embroidex
"""

DESIGN_CATEGORIES = {
    "Bulk Design Pack": [
        "Blouse Design Full",
        "Blouse Design-Splitted",
        "Butta & Patch",
        "Creative Flowers & Butta",
        "Cutwork Border & Corner",
        "Figure Butta",
        "Flower Border & Corner",
        "Neck Designs"
    ],
    "Design by Machines": [
        "Designs For Babylock",
        "Designs For Bernina",
        "Designs For Brother",
        "Designs For Husqvarna Viking",
        "Designs For Multi Needle Machine",
        "Designs For Pfaff",
        "Designs For Singer",
        "Designs For Usha Janome"
    ],
    "Multi Head Machines Design": [
        "Agbada Embroidery Design",
        "All over Garment",
        "Anarkali & Readymade Suit",
        "Arabic Jalabia & Kaftan",
        "Beads and Sequin Designs",
        "Blouse & Choli",
        "Butta",
        "Cord Set Designs",
        "Daman Top & Dupatta",
        "Duppata",
        "Fancy Kurti",
        "Gown & Designer Suit",
        "Lace & Border",
        "Lehengha Designs",
        "Long Suit & Duppata",
        "Men's Neck & Kurta",
        "Neck & Gala",
        "Punjabi Dress & Suit",
        "Rajasthani Lehengha"
    ],
    "Small Machine Designs": [
        "All Over Designs",
        "Mart",
        "Alphabets",
        "Baby Applique",
        "Birds & Animals",
        "Blouse Designs Pack",
        "Border & Corner Set",
        "Butta Designs Pack",
        "Car & Vehicle",
        "Cartoons",
        "Creative Designs",
        "Creative Figure & Butta",
        "Flowers & Trees",
        "Food & Drink",
        "Home Decor",
        "Lace & Borders",
        "Logo",
        "Punjabi Suit Designs",
        "Splitted Blouse Designs",
        "Splitted Neck"
    ]
}


def get_all_categories():
    """Returns list of all main categories"""
    return list(DESIGN_CATEGORIES.keys())


def get_subcategories(category):
    """Returns subcategories for a given category"""
    return DESIGN_CATEGORIES.get(category, [])


def validate_category(category, subcategory):
    """Validates if category and subcategory combination is valid"""
    if category not in DESIGN_CATEGORIES:
        return False
    return subcategory in DESIGN_CATEGORIES[category]
