document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate'; 
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer';
    const BRANCH_NAME = 'main';
    // -------------------

    const form = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    // Correctly constructs the URL to your single paper image
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop the form from submitting the old way

        // --- UI Changes: Show Loading State ---
        form.classList.add('hidden');
        resultDiv.innerHTML = ''; // Clear previous results
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
            // Dynamically create the result content
            resultDiv.innerHTML = `
                <h2>Here is your assignment!</h2>
                <img src="${imageUrl}" alt="Generated Handwritten Assignment" id="resultImage">
                <div class="download-options">
                    <button id="downloadPngBtn" class="download-btn btn-png">Download PNG</button>
                    <button id="downloadPdfBtn" class="download-btn btn-pdf">Download PDF</button>
                    <button id="downloadDocBtn" class="download-btn btn-doc">Download DOCX</button>
                </div>
            `;
            resultDiv.classList.remove('hidden');

            // --- ADD EVENT LISTENERS FOR NEW DOWNLOAD BUTTONS ---

            // PNG Download Handler
            document.getElementById('downloadPngBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = 'assignment.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            // PDF Download Handler
            document.getElementById('downloadPdfBtn').addEventListener('click', () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'px', 'a4'); // A4 size in pixels
                const img = document.getElementById('resultImage');
                const imgWidth = doc.internal.pageSize.getWidth();
                const imgHeight = (img.height * imgWidth) / img.width;
                doc.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight);
                doc.save('assignment.pdf');
            });

            // DOCX Download Handler
            document.getElementById('downloadDocBtn').addEventListener('click', () => {
                const img = document.getElementById('resultImage');
                const doc = new docx.Document({
                    sections: [{
                        properties: {},
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.ImageRun({
                                        data: imageBlob,
                                        transformation: {
                                            width: 600,
                                            height: 848,
                                        },
                                    }),
                                ],
                            }),
                        ],
                    }],
                });

                docx.Packer.toBlob(doc).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'assignment.docx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            });

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
