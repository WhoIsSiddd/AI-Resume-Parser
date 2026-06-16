from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

# Register routes
app.register_blueprint(api_bp, url_prefix='/api')

@app.route("/")
def read_root():
    return {"status": "ok", "message": "AI ATS Engine (Flask) is running"}

def warmup():
    # This ensures models are loaded at startup context
    print("Pre-loading AI models...")
    from ai_engine.skill_extractor import embedding_model
    print("AI models loaded and ready.")

if __name__ == "__main__":
    warmup()
    port = int(os.environ.get("PORT", 8000))
    # use_reloader=False can help with stability on some Windows environments with large models
    app.run(host="127.0.0.1", port=port, debug=True)
