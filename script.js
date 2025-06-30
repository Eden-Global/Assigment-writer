document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const REPLIT_API_URL = 'https://voici.replit.app/api/generate';
    const GITHUB_USERNAME = 'Eden-Global'; // Your username is set here!
    // -------------------

    const form = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');

    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/Assigment-writer/main/assets/images/A4sheet.png`;

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
            const fontUrl = selectedHandwriting.dataset.url;

            // --- Prepare Data for API ---
            const requestData = {
                text: text,
                paperType: paperType,
                ink: ink,
                fontUrl: fontUrl,
                paperUrl: paperImageUrl
            };

            // --- Call the Replit API ---
            const response = await fetch(REPLIT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            const result = await response.json();

            if (!response.ok || !result.success) {
                // Throw an error if the API reports a failure
                throw new Error(result.error || 'An unknown error occurred on the server.');
            }
            
            // --- Display Success Result ---
            resultDiv.innerHTML = `
                <h2>Here is your assignment!</h2>
                <img src="${result.imageUrl}" alt="Generated Handwritten Assignment">
                <br>
                <a href="${result.imageUrl}" download="assignment.png">Download Image</a>
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