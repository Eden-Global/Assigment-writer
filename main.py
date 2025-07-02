# main.py - FINAL VERSION WITH ADMIN CONTROL PARAMETERS

from flask import Flask, request, jsonify, send_file
# ... other imports ...
import io

app = Flask(__name__)
CORS(app)

# The function signature now accepts optional custom parameters
def create_formatted_handwriting(editor_content, paper_url, font_url, ink_color_name, paper_type, custom_font_size=None, custom_line_gap=None):
    try:
        # ... asset downloading ...

        draw = ImageDraw.Draw(paper_image)
        width, height = paper_image.size
        
        # --- **GENIUS PART**: Check for custom admin settings ---
        is_lined_paper = (paper_type == "A4 Sheet Lined")
        
        # Set default values
        default_font_size = 36 if is_lined_paper else 55
        default_line_gap = 41.5 if is_lined_paper else 65

        # If the admin sent custom values, use them. Otherwise, use the defaults.
        font_size = custom_font_size if custom_font_size is not None else default_font_size
        line_spacing = custom_line_gap if custom_line_gap is not None else default_line_gap
        
        # ... the rest of the drawing logic remains exactly the same ...
        # It will now use the correct font_size and line_spacing variables.

        # ...
        
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
    # ... validation for required fields ...

    # Get the new, optional admin parameters from the request
    # .get() is safe because it returns None if the key doesn't exist
    custom_font_size = data.get('fontSize')
    custom_line_gap = data.get('lineGap')

    result_stream = create_formatted_handwriting(
        editor_content=data.get('editorContent'),
        paper_url=data.get('paperUrl'),
        font_url=data.get('fontUrl'),
        ink_color_name=data.get('ink'),
        paper_type=data.get('paperType'),
        # Pass the custom values to the function
        custom_font_size=custom_font_size,
        custom_line_gap=custom_line_gap
    )
    # ... rest of the function remains the same ...

# Health check route is the same
# ...
