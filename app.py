import os
import cv2
import tempfile
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

 # --- > HEROKU
 # app = Flask(__name__, static_folder='static')  # Usa static_folder per il resto del sito
 # CORS(app, resources={r"/*": {"origins": "*"}})

 # --- > LOCALHOST
app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500"])



# Variabile globale per tenere traccia della cartella dei frame
 # --- > HEROKU
 # frames_folder = '/tmp/frames'  # Usa la cartella temporanea di Heroku (localizzata in /tmp)

 # --- > LOCALHOST
frames_folder = 'frames'  # Usa la cartella locale (localizzata in /frames)

# --- > HEROKU
# @app.route('/')
# def home():
#     return render_template('index.html')  # Serve la pagina HTML

@app.route('/upload-video', methods=['POST'])
def upload_video():
    global frames_folder  # Utilizza la variabile globale per tenere traccia della cartella dei frame

    # Verifica se il file video è stato caricato
    if 'video' not in request.files:
        return jsonify({'message': 'Nessun file video inviato'}), 400

    # Creare la cartella dei frame nella cartella temporanea di Heroku
    if not os.path.exists(frames_folder):
        os.makedirs(frames_folder)  # Crea la cartella per i frame in /tmp
    else:
        # Svuota la cartella frames
        for file in os.listdir(frames_folder):
            file_path = os.path.join(frames_folder, file)
            if os.path.isfile(file_path):
                os.remove(file_path)
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
    # Restituisce il frame dalla cartella temporanea /tmp
    return send_from_directory(frames_folder, filename)

if __name__ == '__main__':
    # --- > HEROKU
    # app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5001))

    # --- > LOCALHOST
    app.run(debug=True, port=5001)
