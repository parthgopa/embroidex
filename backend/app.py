from flask import Flask
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

app = Flask(__name__)

# Proper Flask-CORS configuration per official documentation
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "https://embroidex.merishiksha.com",
            "https://www.embroidex.merishiksha.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})


app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(sel_design_bp, url_prefix="/seller")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(payment_bp, url_prefix="/payment")
app.register_blueprint(seller_earnings_bp, url_prefix="/seller")
app.register_blueprint(webhook_bp, url_prefix="/webhooks")
app.register_blueprint(withdrawal_bp, url_prefix="/withdrawal")
app.register_blueprint(settings_bp, url_prefix="/settings")

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
    app.run(host="0.0.0.0", port=port)