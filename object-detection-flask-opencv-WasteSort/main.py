from flask import Flask, render_template, request, Response, redirect, url_for, jsonify
from flask_bootstrap import Bootstrap
from object_detection import VideoStreaming  # Import VideoStreaming class
from camera_settings import *

# Initialize Flask app
app = Flask(__name__)
Bootstrap(app)

# Check camera settings and initialize video stream
check_settings()
VIDEO = VideoStreaming()

@app.route("/")
def home():
    TITLE = "Object Detection"
    return render_template("index.html", TITLE=TITLE)

@app.route("/video_feed")
def video_feed():
    """
    Video streaming route.
    """
    return Response(
        VIDEO.show(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/get_detected_objects")
def get_detected_objects():
    return jsonify(VIDEO.detected_objects)

# * Button requests
@app.route("/request_preview_switch")
def request_preview_switch():
    VIDEO.preview = not VIDEO.preview
    print("*"*10, VIDEO.preview)
    return "nothing"

@app.route("/request_flipH_switch")
def request_flipH_switch():
    VIDEO.flipH = not VIDEO.flipH
    print("*"*10, VIDEO.flipH)
    return "nothing"

@app.route("/request_model_switch")
def request_model_switch():
    VIDEO.detect = not VIDEO.detect
    print("*"*10, VIDEO.detect)
    return "nothing"

@app.route("/request_exposure_down")
def request_exposure_down():
    VIDEO.exposure -= 1
    print("*"*10, VIDEO.exposure)
    return "nothing"

@app.route("/request_exposure_up")
def request_exposure_up():
    VIDEO.exposure += 1
    print("*"*10, VIDEO.exposure)
    return "nothing"

@app.route("/request_contrast_down")
def request_contrast_down():
    VIDEO.contrast -= 4
    print("*"*10, VIDEO.contrast)
    return "nothing"

@app.route("/request_contrast_up")
def request_contrast_up():
    VIDEO.contrast += 4
    print("*"*10, VIDEO.contrast)
    return "nothing"

@app.route("/reset_camera")
def reset_camera():
    STATUS = reset_settings()
    print("*"*10, STATUS)
    return "nothing"

if __name__ == "__main__":
    app.run(debug=True)