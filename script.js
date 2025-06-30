document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate';
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer';
    const BRANCH_NAME = 'main';

    const form = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');

    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;

    // --- GENIUS HELPER FUNCTION FOR IMAGE COMPRESSION ---
    function compressImage(imageBlob) {
        return new Promise((resolve, reject) => {
            const imageUrl = URL.createObjectURL(imageBlob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(imageUrl); // Clean up memory
                        resolve(blob);
                    },
                    'image/jpeg', // Convert to JPEG for compression
                    0.8 // 80% quality, a good balance
                );
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(imageUrl);
                reject(err);
            };
            img.src = imageUrl;
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        form.classList.add('hidden');
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const requestData = {
                text: document.getElementById('paragraph').value,
                paperType: document.querySelector('input[name="paper"]:checked').value,
                ink: document.querySelector('input[name="ink"]:checked').value,
                fontUrl: document.querySelector('input[name="handwriting"]:checked').dataset.url,
                paperUrl: paperImageUrl
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                let errorMsg = `Server error: ${response.statusText}`;
                try {
                    const errorResult = await response.json();
                    errorMsg = errorResult.error || errorMsg;
                } catch (e) { /* Ignore */ }
                throw new Error(errorMsg);
            }
            
            // Get the original high-quality image blob
            const originalImageBlob = await response.blob();
            // Create a temporary URL for displaying the original image
            const originalImageUrl = URL.createObjectURL(originalImageBlob);

            // NOW, COMPRESS THE IMAGE FOR PDF/DOCX
            const compressedImageBlob = await compressImage(originalImageBlob);

            resultDiv.innerHTML = `
                <h2>Here is your assignment!</h2>
                <img src="${originalImageUrl}" alt="Generated Handwritten Assignment" id="resultImage">
                <div class="download-options">
                    <button id="downloadPngBtn" class="download-btn btn-png">Download PNG (High Quality)</button>
                    <button id="downloadPdfBtn" class="download-btn btn-pdf">Download PDF</button>
                    <button id="downloadDocBtn" class="download-btn btn-doc">Download DOCX</button>
                </div>
            `;
            resultDiv.classList.remove('hidden');

            // --- ADD EVENT LISTENERS FOR BUTTONS ---

            // PNG Download (uses original high-quality image)
            document.getElementById('downloadPngBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = originalImageUrl;
                a.download = 'assignment.png';
                a.click();
            });

            // PDF Download (uses the new, SMALL compressed image)
            document.getElementById('downloadPdfBtn').addEventListener('click', () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'px', 'a4');
                const compressedUrl = URL.createObjectURL(compressedImageBlob);
                const img = document.getElementById('resultImage'); // Use displayed image for dimensions
                const imgWidth = doc.internal.pageSize.getWidth();
                const imgHeight = (img.height * imgWidth) / img.width;
                doc.addImage(compressedUrl, 'JPEG', 0, 0, imgWidth, imgHeight);
                doc.save('assignment.pdf');
                URL.revokeObjectURL(compressedUrl);
            });

            // DOCX Download (also uses the SMALL compressed image)
            document.getElementById('downloadDocBtn').addEventListener('click', () => {
                const img = document.getElementById('resultImage');
                const doc = new docx.Document({
                    sections: [{
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.ImageRun({
                                        data: compressedImageBlob,
                                        transformation: { width: 600, height: 848 },
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
                    a.click();
                    URL.revokeObjectURL(url);
                });
            });

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
