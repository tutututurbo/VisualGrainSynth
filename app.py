import os
import cv2
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')  # Modifica la configurazione per la cartella 'static'

CORS(app, resources={r"/*": {"origins": "*"}})  # Abilita CORS per l'indirizzo della pagina HTML

# Percorso della cartella dei frame
frames_folder = 'static/frames'  # Aggiungi "static" nel percorso

# Funzione per pulire la cartella dei frame
def clear_frames_folder():
    if os.path.exists(frames_folder):
        for file in os.listdir(frames_folder):
            file_path = os.path.join(frames_folder, file)
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Errore nell'eliminazione del file {file_path}: {e}")
    else:
        os.makedirs(frames_folder)



@app.route('/')
def home():
 return render_template('index.html')
 # Serve la pagina HTML


@app.route('/upload-video', methods=['POST'])
def upload_video():
    # Verifica se il file video è stato caricato
    if 'video' not in request.files:
        return jsonify({'message': 'Nessun file video inviato'}), 400

    # Svuota la cartella dei frame prima di un nuovo caricamento
    clear_frames_folder()

    # Salvataggio temporaneo del file video
    video_file = request.files['video']
    video_filename = secure_filename(video_file.filename)
    video_path = os.path.join(frames_folder, video_filename)
    video_file.save(video_path)

    # Estrazione dei frame
    cap = cv2.VideoCapture(video_path)
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_filename = f'{frames_folder}/frame_{frame_count}.jpg'
        cv2.imwrite(frame_filename, frame)  # Salva ogni frame come immagine JPEG
        frame_count += 1

    cap.release()
    os.remove(video_path)  # Elimina il file video temporaneo, se non è più necessario

    return jsonify({'message': frame_count})

if __name__ == '__main__':
     app.run(debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5001))
