# main.py - FINAL GENIUS VERSION (IN-MEMORY)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
import io # We need this for in-memory operations

# --- Basic Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- The Core Image Generation Function (Now works in memory) ---
def create_handwriting_in_memory(text, paper_url, font_url, ink_color_name, paper_type):
    try:
        # 1. DOWNLOAD ASSETS FROM GITHUB
        paper_response = requests.get(paper_url)
        paper_response.raise_for_status()
        paper_image = Image.open(io.BytesIO(paper_response.content)).convert("RGBA")

        font_response = requests.get(font_url)
        font_response.raise_for_status()
        font_data = io.BytesIO(font_response.content)

        # 2. SETUP THE CANVAS
        draw = ImageDraw.Draw(paper_image)
        width, height = paper_image.size

        # 3. DEFINE PAGE LAYOUT RULES
        top_margin, left_margin, line_spacing = 150, 100, 65
        right_margin = width - left_margin

        # 4. DRAW LINES IF REQUESTED
        if paper_type == "A4 Sheet Lined":
            line_color = (200, 220, 240, 255)
            y = top_margin
            while y < height - top_margin:
                draw.line([(left_margin, y), (right_margin, y)], fill=line_color, width=2)
                y += line_spacing

        # 5. PREPARE TO WRITE TEXT
        INK_COLORS = {"Black": (0, 0, 0), "Blue": (0, 74, 173), "Red": (255, 0, 0)}
        font_size = 55
        font = ImageFont.truetype(font_data, size=font_size)
        ink_color = INK_COLORS.get(ink_color_name, (0, 0, 0))
        y_text = top_margin

        # 6. PROCESS AND WRAP TEXT
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

        # 7. DRAW THE TEXT
        for line in all_lines_to_draw:
            box = draw.textbbox((0,0), line, font=font)
            line_height = box[3] - box[1]
            final_y_position = y_text - (line_height / 1.5) - (font_size / 10)
            draw.text((left_margin, final_y_position), line.strip(), font=font, fill=ink_color)
            y_text += line_spacing
            if y_text > height - top_margin: break

        # 8. SAVE THE FINAL IMAGE TO MEMORY
        img_io = io.BytesIO() # Create an in-memory byte stream
        paper_image.save(img_io, 'PNG') # Save the image to the stream
        img_io.seek(0) # Rewind the stream to the beginning
        
        return img_io # Return the in-memory image data

    except Exception as e:
        print(f"ERROR in create_handwriting_in_memory: {e}")
        return None

# --- API Endpoint that Listens for Requests ---
@app.route('/api/generate', methods=['POST'])
def generate_handler():
    data = request.get_json()
    if not data or not all(k in data for k in ['text', 'paperUrl', 'fontUrl', 'ink', 'paperType']):
        return jsonify({"success": False, "error": "Missing required data from the website."}), 400

    # Call our new in-memory function
    result_stream = create_handwriting_in_memory(
        text=data.get('text'),
        paper_url=data.get('paperUrl'),
        font_url=data.get('fontUrl'),
        ink_color_name=data.get('ink'),
        paper_type=data.get('paperType')
    )

    if result_stream:
        # Send the in-memory image data directly to the user
        return send_file(result_stream, mimetype='image/png')
    else:
        return jsonify({"success": False, "error": "Server failed to create the image. Check Render logs."}), 500

# --- A "health check" endpoint ---
@app.route('/')
def home():
    return "<h1>Assignment Writer API is alive!</h1>", 200
