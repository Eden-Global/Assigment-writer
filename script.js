document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    // YOUR NEW RENDER URL IS SET HERE!
    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate'; 
    
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer'; // Using the exact spelling from your repo
    const BRANCH_NAME = 'main';
    // -------------------

    const form = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    // Constructs the URL to your single paper image
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop the form from submitting the old way

        // --- UI Changes: Show Loading State ---
        form.classList.add('hidden');
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // --- Collect Data From Form ---
            const text = document.getElementById('paragraph').value;
            const paperType = document.querySelector('input[name="paper"]:checked').value;
            const ink = document.querySelector('input[name="ink"]:checked').value;
            const selectedHandwriting = document.querySelector('input[name="handwriting"]:checked');
            
            if (!selectedHandwriting) {
                throw new Error("Please select a handwriting style.");
            }
            const fontUrl = selectedHandwriting.dataset.url;

            // --- Prepare Data for API ---
            const requestData = {
                text: text,
                paperType: paperType,
                ink: ink,
                fontUrl: fontUrl,
                paperUrl: paperImageUrl
            };

            // --- Call the Render API ---
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            // --- Handle the Response ---
            if (!response.ok) {
                // If the server sends an error (like 400 or 500), this block will run.
                let errorMsg = `Server returned an error: ${response.status} ${response.statusText}`;
                try {
                    // Try to get a more specific error message from the server's response body
                    const errorResult = await response.json();
                    if (errorResult.error) {
                        errorMsg = errorResult.error;
                    }
                } catch (e) {
                    console.log("Could not parse error JSON from server.");
                }
                throw new Error(errorMsg);
            }

            // If the response is OK (200), the server is sending us the image file directly.
            // We convert the image data (a "blob") into a temporary URL the browser can display.
            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            // --- Display Success Result ---
            resultDiv.innerHTML = `
                <h2>Here is your assignment!</h2>
                <img src="${imageUrl}" alt="Generated Handwritten Assignment">
                <br>
                <a href="${imageUrl}" download="assignment.png">Download Image</a>
            `;
            resultDiv.classList.remove('hidden');

        } catch (error) {
            // --- Display Error Message ---
            resultDiv.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${error.message}</p>`;
            resultDiv.classList.remove('hidden');
            form.classList.remove('hidden'); // Show the form again so the user can retry

        } finally {
            // --- UI Changes: Hide Loading State ---
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });
});
