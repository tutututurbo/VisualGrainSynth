from flask import Flask, request, jsonify
import os
import cv2

from flask_cors import CORS  # Importa la libreria CORS

app = Flask(__name__)

# Abilita CORS per tutte le route
CORS(app, origins=["http://127.0.0.1:5500"])



# Cartella in cui salvare i frame
output_dir = "frames"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Funzione per estrarre frame
def extract_frames(video_path):
    # Elimina tutti i file esistenti nella cartella dei frame
    for file in os.listdir(output_dir):
        file_path = os.path.join(output_dir, file)
        if os.path.isfile(file_path):
            os.unlink(file_path)

    # Carica il video
    video_capture = cv2.VideoCapture(video_path)

    frame_count = 0
    while video_capture.isOpened():
        ret, frame = video_capture.read()
        if not ret:
            break

        frame_filename = os.path.join(output_dir, f'frame_{frame_count}.jpg')
        cv2.imwrite(frame_filename, frame)
        frame_count += 1

    video_capture.release()
    return frame_count

# Endpoint per ricevere il video
@app.route('/upload-video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    video_path = os.path.join('videos', video.filename)

    # Salva il video caricato nella cartella 'videos'
    if not os.path.exists('videos'):
        os.makedirs('videos')
    
    video.save(video_path)
    
    # Esegui l'estrazione dei frame
    num_frames = extract_frames(video_path)

    return jsonify({'message': f'Extracted {num_frames} frames from {video.filename}'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)

