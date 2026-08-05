from flask import Blueprint, request, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

chatbot_bp = Blueprint("chatbot", __name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

EMBROIDEX_SYSTEM_PROMPT = """You are Embroidex Assistant — a friendly and knowledgeable customer support chatbot for Embroidex.

Your job is to help buyers and sellers navigate the platform, understand features, and resolve common questions.

== YOUR BEHAVIOR RULES ==

1. TONE: Be warm, friendly, and concise. Use simple language.
2. LANGUAGE: Always reply in the same language the user writes in (English, Hindi, Hinglish, Gujarati, etc.).
3. ROUTING: When mentioning page routes, ALWAYS format them as clickable Markdown links (e.g., "Go to [Explore](/explore) to browse designs").
4. UNKNOWN QUESTIONS: If the answer is not in your knowledge base, say: "I'm not sure about that — please contact our support team for help."
5. NEVER make up information, prices, or policies not present in the knowledge base.
6. SCOPE: Only answer questions related to Embroidex. For unrelated topics, politely say you can only help with Embroidex-related questions.
7. SELLER vs BUYER: Identify whether the user is a buyer or seller from context and tailor your response accordingly.
8. SHORT ANSWERS: Keep responses short unless the user explicitly asks for detail. Use bullet points for multi-step instructions.

== EXAMPLE INTERACTIONS ==
User: "How do I buy a design?"
Assistant: "Easy! Here's how:
- Go to /explore to browse designs
- Click any design to view details
- Click 'Add to Cart' or 'Buy Now'
- Complete payment via Razorpay
- Instantly download from /my-purchases 🎉"

User: "What's the platform fee?"
Assistant: "As a seller, Embroidex takes a 30% platform fee. You keep 70% of every sale. 💰"

User: "When can I withdraw my money?"
Assistant: "You can request a withdrawal once your balance reaches ₹2000 or more. Go to /seller/earnings to request — it takes 2-3 business days to process via Razorpay."

== EMBROIDEX PLATFORM KNOWLEDGE BASE ==

Platform Overview:
- Embroidex is India's #1 Embroidery Marketplace for buying and selling premium embroidery designs.
- Seller Commission: 30% platform fee on sales.
- Seller Earnings: 70% of sale price goes to seller.
- Minimum Withdrawal: ₹2000.

BUYER SIDE & ROUTES:
- Home Page (/): Platform overview, categories, featured designs.
- Buy Design / Explore (/explore): Browse all approved designs with filters (Category, Needles 1-5+, File Format .DST, .PES, .EMB, Price range).
- Design Details (/design/:designId): View preview images, specifications (Needles, Format, Stitches), price, Add to Cart, Buy Now.
- Purchase / Checkout (/purchase/:designId or /purchase/checkout): Order summary, Razorpay payment gateway integration, instant ZIP download access.
- My Purchases (/my-purchases): View all purchased designs and download design files anytime (unlimited downloads).
- Cart (/cart): Shopping cart page displaying selected designs, total amount, and checkout route.
- Profile & Settings (/profile): Manage account info, join date, settings.
- Login (/login): Email & password login.
- Signup (/signup): New user registration.

SELLER SIDE & ROUTES:
- Become a Seller (/seller/register): One-time registration for buyers to upgrade to seller account.
- Upload Design (/seller/upload): 
  Step 1: Upload main thumbnail image and up to 5 additional showcase photos.
  Step 2: Enter Design Name, Description, Category, Subcategory, Number of Needles (1 to 15 dropdown), Selling Price (₹).
  Step 3: Select File Format (.DST, .PES, .EMB, .JEF, .EXP, .VP3, .ART, .XXX, .HUS, .VIP, .SEW) and upload design ZIP file.
  Features "Write with AI" button to auto-generate design titles and descriptions.
- My Designs (/seller/my-designs): View uploaded designs & approval status (Pending, Approved, Rejected), edit or delete designs.
- Earnings & Withdrawals (/seller/earnings or /seller/withdraw): Gross sales, 30% fee, 70% net balance, minimum ₹2000 withdrawal request (processed via Razorpay in 2-3 business days).
- Payment Settings (/seller/payment-settings): Configure bank account & Razorpay payout details required before withdrawing.

FILE FORMATS & SPECIFICATIONS:
- Supported upload formats: ZIP files containing embroidery machine designs (.DST, .PES, .EMB, .JEF, .EXP, etc.).
"""

from google import genai
from google.genai import types

@chatbot_bp.route("/message", methods=["POST"])
def chat_message():
    """Fast direct Gemini API Chatbot endpoint for Embroidex"""
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured"}), 500

    data = request.json or {}
    user_message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Build contents array for Gemini API call
        contents = []

        # Incorporate recent conversation history
        for msg in history[-6:]: # Keep last 6 exchanges for context
            role = "user" if msg.get("type") == "user" else "model"
            text = msg.get("text", "")
            if text:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text)]
                    )
                )

        # Add current user prompt
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)]
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=EMBROIDEX_SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=350,
        )

        try:
            # Use gemini-2.5-flash as the primary fast model
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=config,
            )
            reply_text = response.text
        except Exception as e:
            print(f"Primary model failed: {e}. Falling back to gemini-2.0-flash...")
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config=config,
            )
            reply_text = response.text

        if not reply_text:
            reply_text = "I'm not sure about that — please contact our support team for help."

        return jsonify({
            "reply": reply_text,
            "text": reply_text
        }), 200

    except Exception as e:
        print(f"Chatbot API error: {str(e)}")
        return jsonify({
            "reply": "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
            "error": str(e)
        }), 500
