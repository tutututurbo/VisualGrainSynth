import os
import cv2
import tempfile
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask import send_from_directory

app = Flask(__name__, static_folder='static')  # Usa static_folder per il resto del sito
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload-video', methods=['POST'])
def upload_video():
    # Verifica se il file video è stato caricato
    if 'video' not in request.files:
        return jsonify({'message': 'Nessun file video inviato'}), 400

    # Creare una cartella temporanea per i frame
    frames_folder = tempfile.mkdtemp()

    # Salvataggio temporaneo del file video
    video_file = request.files['video']
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(frames_folder, video_filename)
    video_file.save(video_path)

    # Estrazione dei frame
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    frame_filenames = []  # per tenere traccia dei nomi dei frame

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_filename = f'frame_{frame_count}.jpg'
        frame_path = os.path.join(frames_folder, frame_filename)
        cv2.imwrite(frame_path, frame)  # Salva ogni frame come immagine JPEG
        frame_filenames.append(frame_filename)
        frame_count += 1

    cap.release()
    os.remove(video_path)  # Elimina il file video temporaneo

    return jsonify({'message': frame_count, 'frames': frame_filenames})

@app.route('/frames/<filename>')
def get_frame(filename):
    # Servire i frame dalla cartella temporanea
    return send_from_directory(frames_folder, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5001))
