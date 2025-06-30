document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const REPLIT_API_URL = 'https://voici.replit.app/api/generate';
    const GITHUB_USERNAME = 'Eden-Global';
    // -------------------

    const form = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    // CORRECTED SPELLING: "Assigment-writer"
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/Assigment-writer/main/assets/images/A4sheet.png`;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        form.classList.add('hidden');
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const selectedHandwriting = document.querySelector('input[name="handwriting"]:checked');
            if (!selectedHandwriting) {
                throw new Error("Please select a handwriting style.");
            }

            const requestData = {
                text: document.getElementById('paragraph').value,
                paperType: document.querySelector('input[name="paper"]:checked').value,
                ink: document.querySelector('input[name="ink"]:checked').value,
                fontUrl: selectedHandwriting.dataset.url,
                paperUrl: paperImageUrl
            };

            const response = await fetch(REPLIT_API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestData),
            });
            
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'An unknown error occurred on the server.');
            }
            
            resultDiv.innerHTML = `
                <h2>Here is your assignment!</h2>
                <img src="${result.imageUrl}" alt="Generated Handwritten Assignment">
                <br>
                <a href="${result.imageUrl}" download="assignment.png">Download Image</a>
            `;
            resultDiv.classList.remove('hidden');

        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${error.message}</p>`;
            resultDiv.classList.remove('hidden');
            form.classList.remove('hidden');

        } finally {
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });
});
