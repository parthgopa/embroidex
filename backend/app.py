from flask import Flask, request, make_response
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

app = Flask(__name__)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://embroidex.merishiksha.com",
    "https://www.embroidex.merishiksha.com"
]

@app.after_request
def after_request(response):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

@app.route("/", defaults={"path": ""}, methods=["OPTIONS"])
@app.route("/<path:path>", methods=["OPTIONS"])
def handle_preflight(path=None):
    origin = request.headers.get("Origin", "")
    response = make_response()
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response, 204


app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(sel_design_bp, url_prefix="/seller")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(payment_bp, url_prefix="/payment")
app.register_blueprint(seller_earnings_bp, url_prefix="/seller")
app.register_blueprint(webhook_bp, url_prefix="/webhooks")
app.register_blueprint(withdrawal_bp, url_prefix="/withdrawal")
app.register_blueprint(settings_bp, url_prefix="/settings")

# Serve uploads folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)