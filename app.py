from flask import Flask, request, jsonify, send_file
import os
import cv2

app = Flask(__name__)

output_dir = "frames"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Funzione per estrarre frame
def extract_frames(video_path):
    for file in os.listdir(output_dir):
        file_path = os.path.join(output_dir, file)
        if os.path.isfile(file_path):
            os.unlink(file_path)

    if not os.path.exists(video_path):
        return jsonify({'error': 'Il salvataggio del video non è riuscito'}), 500

    video_capture = cv2.VideoCapture(video_path)
    if not video_capture.isOpened():
        return jsonify({'error': 'Errore nel caricamento del video con OpenCV'}), 500

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

@app.route('/upload-video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    video_path = os.path.join('videos', video.filename)
    if not os.path.exists('videos'):
        os.makedirs('videos')
    
    video.save(video_path)
    num_frames = extract_frames(video_path)

    return jsonify({'message': f'Extracted {num_frames} frames from {video.filename}'})

# Endpoint per ottenere la porta dell'applicazione
@app.route('/get-port', methods=['GET'])
def get_port():
    port = request.environ.get('SERVER_PORT', '0')  # Recupera la porta attuale
    return jsonify({'port': port})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
