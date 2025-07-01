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
    
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;
    const linedPaperUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet_lined.png`;

    // --- INITIALIZE THE RICH TEXT EDITOR ---
    const quill = new Quill('#editor', {
        theme: 'snow', // A clean theme with a toolbar
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'], // Text style buttons
                [{ 'align': [] }] // Alignment dropdown
            ]
        }
    });

    // --- MAIN EVENT LISTENER FOR THE FORM ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop the form from reloading the page

        // --- UI Changes: Show Loading State ---
        form.classList.add('hidden');
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // --- Collect Data From Form ---
            const paperType = document.querySelector('input[name="paper"]:checked').value;
            const paperUrl = (paperType === 'A4 Sheet Lined') ? linedPaperUrl : paperImageUrl;
            
            // This is the new way we get the content from the editor
            const editorContent = quill.getContents();

            const requestData = {
                editorContent: editorContent, // Send the rich content instead of plain text
                paperType: paperType,
                ink: document.querySelector('input[name="ink"]:checked').value,
                fontUrl: document.querySelector('input[name="handwriting"]:checked').dataset.url,
                paperUrl: paperUrl
            };

            // --- Call the Render API ---
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
                } catch (e) { /* Ignore if response is not JSON */ }
                throw new Error(errorMsg);
            }

            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            // --- Display Success Result ---
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
            document.getElementById('downloadPngBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = imageUrl;
                a.download = 'assignment.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            document.getElementById('downloadPdfBtn').addEventListener('click', () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'px', 'a4');
                const img = document.getElementById('resultImage');
                const imgWidth = doc.internal.pageSize.getWidth();
                const imgHeight = (img.height * imgWidth) / img.width;
                doc.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight);
                doc.save('assignment.pdf');
            });

            document.getElementById('downloadDocBtn').addEventListener('click', () => {
                const doc = new docx.Document({
                    sections: [{
                        children: [
                            new docx.Paragraph({
                                children: [
                                    new docx.ImageRun({
                                        data: imageBlob,
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
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
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
