from flask import Flask, request, jsonify
import cv2
import os

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_video():
    video = request.files['file']  # Riceve il video dalla lettera (AJAX)
    video_path = os.path.join('uploads', video.filename)
    video.save(video_path)  # Salva il video
    
    # Ora chiama la scatola magica per tagliare il video in fotogrammi
    frame_count = extract_frames(video_path)
    
    return jsonify({"frames_saved": frame_count})  # Risponde con il numero di fotogrammi tagliati

def extract_frames(video_path):
    output_dir = "frames"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Carica il video e inizia a spezzettare
    video_capture = cv2.VideoCapture(video_path)
    frame_count = 0

    while True:
        ret, frame = video_capture.read()
        if not ret:
            break
        frame_filename = os.path.join(output_dir, f'frame_{frame_count}.jpg')
        cv2.imwrite(frame_filename, frame)
        frame_count += 1

    video_capture.release()
    return frame_count  # Restituisce il numero di fotogrammi creati

if __name__ == '__main__':
    app.run(debug=True)
