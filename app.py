import os
import cv2
import tempfile
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})

frames_folder = '/tmp/frames'

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload-video', methods=['POST'])
def upload_video():
    global frames_folder

    if 'video' not in request.files:
        return jsonify({'message': 'Nessun file video inviato'}), 400

    if not os.path.exists(frames_folder):
        os.makedirs(frames_folder)
    else:
        for file in os.listdir(frames_folder):
            file_path = os.path.join(frames_folder, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

    video_file = request.files['video']
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(frames_folder, video_filename)
    video_file.save(video_path)

    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    frame_filenames = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_filename = f'frame_{frame_count}.jpg'
        frame_path = os.path.join(frames_folder, frame_filename)
        cv2.imwrite(frame_path, frame)
        frame_filenames.append(frame_filename)
        frame_count += 1

    cap.release()
    os.remove(video_path)

    print(f'Frames salvati: {frame_filenames}')  # Log dei frame salvati

    return jsonify({'message': frame_count, 'frames': frame_filenames})

@app.route('/frames/<filename>')
def get_frame(filename):
    return send_from_directory(frames_folder, filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)