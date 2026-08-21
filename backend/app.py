from flask import Flask, request, make_response
from flask_cors import CORS
import os
from flask import send_from_directory
from routes.auth_routes import auth_bp
from routes.Sel_design_routes import sel_design_bp
from routes.Admin_routes import admin_bp
from routes.Payment_routes import payment_bp
from routes.Seller_earnings_routes import seller_earnings_bp
from routes.Webhook_routes import webhook_bp
from routes.Withdrawal_routes import withdrawal_bp
from routes.Settings_routes import settings_bp
from routes.Chatbot_routes import chatbot_bp
from routes.Homepage_routes import homepage_bp

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max payload size

# Enable CORS for all routes, supporting localhost, production, and ngrok tunnel origins
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    }
})

def is_allowed_origin(origin):
    if not origin:
        return False
    if origin in ["http://localhost:5173", "http://127.0.0.1:5173", "https://embroidex.merishiksha.com", "https://www.embroidex.merishiksha.com"]:
        return True
    if "ngrok" in origin or "localhost" in origin or "127.0.0.1" in origin:
        return True
    return True

# Explicit preflight handler for all routes
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, ngrok-skip-browser-warning"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
        response.status_code = 204
        return response

# Ensure CORS headers on all responses
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, ngrok-skip-browser-warning"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    return response


app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(sel_design_bp, url_prefix="/seller")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(payment_bp, url_prefix="/payment")
app.register_blueprint(seller_earnings_bp, url_prefix="/seller")
app.register_blueprint(webhook_bp, url_prefix="/webhooks")
app.register_blueprint(withdrawal_bp, url_prefix="/withdrawal")
app.register_blueprint(settings_bp, url_prefix="/settings")
app.register_blueprint(chatbot_bp, url_prefix="/chatbot")
app.register_blueprint(homepage_bp, url_prefix="/homepage")

# Health check endpoint for Coolify
@app.route("/health")
def health():
    return {"status": "ok"}, 200

# Serve uploads folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)