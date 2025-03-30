from flask import Flask, render_template, Response, jsonify, send_from_directory
from flask_bootstrap import Bootstrap
from object_detection import VideoStreaming
from camera_settings import *
import smtplib
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
Bootstrap(app)

# Initialize camera with error handling
if not check_settings():
    print("Warning: Camera settings check failed. Some features may not work properly.")

VIDEO = VideoStreaming()
if not VIDEO.initialize_camera():
    print("Warning: Camera initialization failed. Video feed will not be available.")

def send_bin_email(bin_type):
    try:
        message = f"""\
Subject: {bin_type} Bin Full Alert - Eco-Rakshak
To: {os.getenv('RECIPIENT_EMAIL')}
From: {os.getenv('EMAIL_ADDRESS')}

The {bin_type} waste bin at {os.getenv('LOCATION')} is full (100% capacity).

Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        with smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT'))) as server:
            server.starttls()
            server.login(os.getenv('EMAIL_ADDRESS'), os.getenv('EMAIL_PASSWORD'))
            server.sendmail(os.getenv('EMAIL_ADDRESS'), os.getenv('RECIPIENT_EMAIL'), message)
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

@app.route("/")
def home():
    return render_template("index.html", TITLE="Waste Detection")

@app.route("/video_feed")
def video_feed():
    if hasattr(VIDEO, 'VIDEO') and VIDEO.VIDEO.isOpened():
        return Response(VIDEO.show(), mimetype="multipart/x-mixed-replace; boundary=frame")
    return Response("Camera not available", status=500)

@app.route("/get_detected_objects")
def get_detected_objects():
    return jsonify(VIDEO.detected_objects)

@app.route("/bin_full/<bin_type>")
def bin_full(bin_type):
    if send_bin_email(bin_type.capitalize()):
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 500

@app.route("/request_preview_switch")
def request_preview_switch():
    VIDEO.preview = not VIDEO.preview
    return jsonify({"status": "success", "preview": VIDEO.preview})

@app.route("/request_flipH_switch")
def request_flipH_switch():
    VIDEO.flipH = not VIDEO.flipH
    return jsonify({"status": "success", "flipH": VIDEO.flipH})

@app.route("/request_model_switch")
def request_model_switch():
    VIDEO.detect = not VIDEO.detect
    return jsonify({"status": "success", "detect": VIDEO.detect})

@app.route("/request_exposure_down")
def request_exposure_down():
    VIDEO.exposure -= 1
    return jsonify({"status": "success", "exposure": VIDEO.exposure})

@app.route("/request_exposure_up")
def request_exposure_up():
    VIDEO.exposure += 1
    return jsonify({"status": "success", "exposure": VIDEO.exposure})

@app.route("/request_contrast_down")
def request_contrast_down():
    VIDEO.contrast -= 4
    return jsonify({"status": "success", "contrast": VIDEO.contrast})

@app.route("/request_contrast_up")
def request_contrast_up():
    VIDEO.contrast += 4
    return jsonify({"status": "success", "contrast": VIDEO.contrast})

@app.route("/reset_camera")
def reset_camera():
    STATUS = reset_settings()
    return jsonify({"status": "success" if STATUS else "error"})

@app.route("/camera_status")
def camera_status():
    return jsonify({
        "working": hasattr(VIDEO, 'VIDEO') and VIDEO.VIDEO.isOpened()
    })

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'images'),
                             'favicon.png', mimetype='image/png')

@app.route("/feedback")
def feedback():
    return render_template("fb.html")

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')