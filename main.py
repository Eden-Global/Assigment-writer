# main.py - THE ULTIMATE DOCUMENT GENERATOR VERSION

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import requests
import io

app = Flask(__name__)
CORS(app)

# This function is now a powerful document renderer
def create_formatted_handwriting(editor_content, paper_url, font_url, ink_color_name, paper_type):
    try:
        # Asset downloading is the same
        paper_response = requests.get(paper_url)
        paper_response.raise_for_status()
        paper_image = Image.open(io.BytesIO(paper_response.content)).convert("RGBA")

        font_response = requests.get(font_url)
        font_response.raise_for_status()
        font_data = io.BytesIO(font_response.content)

        draw = ImageDraw.Draw(paper_image)
        width, height = paper_image.size
        
        # --- Page Layout Rules (same as before) ---
        is_lined_paper = (paper_type == "A4 Sheet Lined")
        if is_lined_paper:
            top_margin, line_spacing, font_size = 160, 41.5, 36
        else:
            top_margin, line_spacing, font_size = 150, 65, 55
        
        left_margin = 100
        right_margin = width - left_margin
        y_text = top_margin

        # --- Font and Color Setup (same as before) ---
        INK_COLORS = {"Black": (0, 0, 0), "Blue": (0, 74, 173), "Red": (255, 0, 0)}
        font = ImageFont.truetype(font_data, size=font_size)
        ink_color = INK_COLORS.get(ink_color_name, (0, 0, 0))

        # --- *** THE NEW GENIUS LOGIC: PARSING THE EDITOR CONTENT *** ---
        # The 'editor_content' is a list of operations (called a Delta)
        for op in editor_content['ops']:
            text_to_draw = op.get('insert', '')
            attributes = op.get('attributes', {}) or {}
            alignment = attributes.get('align', 'left') # Default to left align

            # Split text into individual lines to handle alignment for each one
            lines = text_to_draw.split('\n')
            
            for i, line in enumerate(lines):
                # We only process non-empty lines, newlines are handled separately
                if line:
                    # Calculate the width of the current line of text
                    box = draw.textbbox((0, 0), line, font=font)
                    line_width = box[2] - box[0]
                    line_height = box[3] - box[1]

                    # Calculate the X position based on alignment
                    x_pos = left_margin # Default to left
                    if alignment == 'center':
                        x_pos = (width / 2) - (line_width / 2)
                    elif alignment == 'right':
                        x_pos = right_margin - line_width

                    # Calculate Y position to sit on the line
                    final_y_position = y_text - line_height
                    
                    # Draw the text at the calculated position!
                    draw.text((x_pos, final_y_position), line, font=font, fill=ink_color)

                # If this isn't the last line segment from the split, it means there was a newline
                if i < len(lines) - 1:
                    y_text += line_spacing # Move down for the next line
                    if y_text > height - (top_margin / 2): break # Stop if off page
            
            if y_text > height - (top_margin / 2): break # Stop if off page

        # In-memory saving is the same
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
    # We now expect 'editorContent' instead of 'text'
    if not data or 'editorContent' not in data:
        return jsonify({"success": False, "error": "Missing editor content."}), 400

    result_stream = create_formatted_handwriting(
        editor_content=data.get('editorContent'),
        paper_url=data.get('paperUrl'),
        font_url=data.get('fontUrl'),
        ink_color_name=data.get('ink'),
        paper_type=data.get('paperType')
    )
    # ... rest of the function is the same ...

# Health check route is the same
@app.route('/')
def home():
    # ...
