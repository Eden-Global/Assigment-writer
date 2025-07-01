# main.py - THE ULTIMATE DOCUMENT GENERATOR VERSION
# Tuned for bigger, clearer handwriting.

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
import io

app = Flask(__name__)
CORS(app)

def create_formatted_handwriting(editor_content, paper_url, font_url, ink_color_name, paper_type):
    try:
        paper_response = requests.get(paper_url)
        paper_response.raise_for_status()
        paper_image = Image.open(io.BytesIO(paper_response.content)).convert("RGBA")

        font_response = requests.get(font_url)
        font_response.raise_for_status()
        font_data = io.BytesIO(font_response.content)

        draw = ImageDraw.Draw(paper_image)
        width, height = paper_image.size
        
        # === THE BIG HANDWRITING FIX IS HERE ===
        is_lined_paper = (paper_type == "A4 Sheet Lined")
        if is_lined_paper:
            # Increased font size slightly to better fit the lines. Line spacing is fixed by the paper.
            top_margin, line_spacing, font_size = 160, 41.5, 39
        else:
            # Increased font size and line spacing for better readability on plain paper.
            top_margin, line_spacing, font_size = 150, 72, 62
        # ==========================================
        
        left_margin = 100
        right_margin = width - left_margin
        y_text = top_margin

        INK_COLORS = {"Black": (0, 0, 0), "Blue": (0, 74, 173), "Red": (255, 0, 0)}
        font = ImageFont.truetype(font_data, size=font_size)
        ink_color = INK_COLORS.get(ink_color_name, (0, 0, 0))

        for op in editor_content.get('ops', []):
            text_to_draw = op.get('insert', '')
            attributes = op.get('attributes', {}) or {}
            alignment = attributes.get('align', 'left')

            lines = text_to_draw.split('\n')
            
            for i, line in enumerate(lines):
                if line:
                    box = draw.textbbox((0, 0), line, font=font)
                    line_width, line_height = box[2] - box[0], box[3] - box[1]

                    x_pos = left_margin
                    if alignment == 'center':
                        x_pos = (width / 2) - (line_width / 2)
                    elif alignment == 'right':
                        x_pos = right_margin - line_width

                    final_y_position = y_text - line_height
                    draw.text((x_pos, final_y_position), line, font=font, fill=ink_color)

                if i < len(lines) - 1:
                    y_text += line_spacing
                    if y_text > height - (top_margin / 2): break
            
            if y_text > height - (top_margin / 2): break

        img_io = io.BytesIO()
        paper_image.save(img_io, 'PNG')
        img_io.seek(0)
        return img_io

    except Exception as e:
        print(f"ERROR in create_formatted_handwriting: {e}")
        return None

@app.route('/api/generate', methods=['POST'])
def generate_handler():
    data = request.get_json()
    if not data or 'editorContent' not in data:
        return jsonify({"success": False, "error": "Missing editor content from the website."}), 400

    result_stream = create_formatted_handwriting(
        editor_content=data.get('editorContent'),
        paper_url=data.get('paperUrl'),
        font_url=data.get('fontUrl'),
        ink_color_name=data.get('ink'),
        paper_type=data.get('paperType')
    )
    if result_stream:
        return send_file(result_stream, mimetype='image/png')
    else:
        return jsonify({"success": False, "error": "Server failed to create the image. Check Render logs for details."}), 500

@app.route('/')
def home():
    return "<h1>Shahil Assignment Writer AI API is running!</h1>", 200
