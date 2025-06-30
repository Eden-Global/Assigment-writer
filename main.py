# main.py - FINAL VERSION FOR RENDER

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import os
import time
import requests
from io import BytesIO

# --- Basic Flask App Setup ---
# When Render runs this, 'app' is the object that gunicorn will serve.
app = Flask(__name__)
CORS(app) # This is essential to allow requests from your GitHub Pages website.

# --- The Core Image Generation Function ---
def create_handwriting(text, paper_url, font_url, ink_color_name, paper_type):
    try:
        # 1. DOWNLOAD ASSETS FROM GITHUB
        # Download the plain paper image using the URL provided by the frontend
        paper_response = requests.get(paper_url)
        paper_response.raise_for_status() # This will raise an error if the URL is bad (e.g., 404 Not Found)
        paper_image = Image.open(BytesIO(paper_response.content)).convert("RGBA")

        # Download the chosen font file
        font_response = requests.get(font_url)
        font_response.raise_for_status() # Check if the font URL is also valid
        font_data = BytesIO(font_response.content)

        # 2. SETUP THE "CANVAS" FOR DRAWING
        draw = ImageDraw.Draw(paper_image)
        width, height = paper_image.size

        # 3. DEFINE THE RULES FOR THE PAGE LAYOUT
        # These numbers control where the lines and text go. You can tweak them later!
        top_margin = 150
        left_margin = 100
        right_margin = width - 100
        line_spacing = 65

        # 4. DRAW LINES IF THE USER REQUESTED THEM
        if paper_type == "A4 Sheet Lined":
            line_color = (200, 220, 240, 255) # A nice light blue for the lines
            y = top_margin
            while y < height - top_margin:
                draw.line([(left_margin, y), (right_margin, y)], fill=line_color, width=2)
                y += line_spacing

        # 5. PREPARE TO WRITE THE TEXT
        INK_COLORS = {"Black": (0, 0, 0), "Blue": (0, 74, 173), "Red": (255, 0, 0)}
        font_size = 48 # Font size should be smaller than line_spacing
        font = ImageFont.truetype(font_data, size=font_size)
        ink_color = INK_COLORS.get(ink_color_name, (0, 0, 0)) # Default to black

        y_text = top_margin # Start writing text at the same place the lines start
        
        # 6. PROCESS AND WRAP THE USER'S TEXT
        all_lines_to_draw = []
        original_lines = text.replace('\r', '\n').split('\n')
        for line in original_lines:
            words = line.split(' ')
            current_line = ''
            for word in words:
                test_line = current_line + word + ' '
                box = draw.textbbox((0,0), test_line, font=font)
                test_width = box[2] - box[0]
                if test_width > (right_margin - left_margin):
                    all_lines_to_draw.append(current_line)
                    current_line = word + ' '
                else:
                    current_line = test_line
            all_lines_to_draw.append(current_line)

        # 7. DRAW THE FINAL TEXT ONTO THE IMAGE
        for line in all_lines_to_draw:
            box = draw.textbbox((0,0), line, font=font)
            line_height = box[3] - box[1]

            final_y_position = y_text - (line_height / 1.5) - (font_size / 10)
            draw.text((left_margin, final_y_position), line.strip(), font=font, fill=ink_color)
            y_text += line_spacing
            if y_text > height - top_margin:
                break

        # 8. SAVE THE FINAL IMAGE TEMPORARILY
        # We need a place to save the file before we can serve it.
        # Note: On platforms like Render, the '/tmp' directory is a good choice for temporary files.
        output_folder = '/tmp'
        if not os.path.exists(output_folder):
             os.makedirs(output_folder) # Ensure the folder exists
        
        output_filename = f"assignment_{int(time.time())}.png"
        output_path = os.path.join(output_folder, output_filename)
        
        paper_image.save(output_path, 'PNG')
        return output_path

    except Exception as e:
        print(f"ERROR in create_handwriting: {e}")
        return None

# --- API Endpoint that Listens for Requests ---
@app.route('/api/generate', methods=['POST'])
def generate_handler():
    data = request.get_json()
    if not data or not all(k in data for k in ['text', 'paperUrl', 'fontUrl', 'ink', 'paperType']):
        return jsonify({"success": False, "error": "Missing required data from the website."}), 400

    text = data.get('text')
    paper_url = data.get('paperUrl')
    font_url = data.get('fontUrl')
    ink_color = data.get('ink')
    paper_type = data.get('paperType')

    # Call our main function to do the work
    # We no longer need to pass the filename, as it's handled inside the function
    result_path = create_handwriting(text, paper_url, font_url, ink_color, paper_type)

    if result_path:
        try:
            from flask import send_file
            # Send the file directly from the temporary path
            return send_file(result_path, mimetype='image/png')
        except Exception as e:
            print(f"ERROR sending file: {e}")
            return jsonify({"success": False, "error": "Server failed to send the generated image."}), 500
        finally:
            # Clean up the temporary file after sending it
            if os.path.exists(result_path):
                os.remove(result_path)
    else:
        return jsonify({"success": False, "error": "Server failed to create the image."}), 500

# --- A simple "health check" endpoint ---
# This helps us test if the server is running correctly.
@app.route('/')
def home():
    return "<h1>Assignment Writer API is alive!</h1><p>Ready to receive requests at the /api/generate endpoint.</p>", 200

# Note: We don't need the 'if __name__ == "__main__":' block.
# Render's Gunicorn server will run the 'app' object directly.