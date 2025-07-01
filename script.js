document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate';
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer';
    const BRANCH_NAME = 'main';

    // --- ELEMENT SELECTORS ---
    const formContainer = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    // --- URLs ---
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;
    const linedPaperUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet_lined.png`;

    // --- INITIALIZE RICH TEXT EDITOR ---
    const quill = new Quill('#editor', {
        theme: 'snow',
        modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'align': [] }]] }
    });

    // --- BULLETPROOF CLICK HANDLER ---
    generateBtn.addEventListener('click', async () => {
        // STEP 1: Immediately show loading animation
        formContainer.classList.add('hidden');
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // STEP 2: Validate all inputs
            const selectedPaper = document.querySelector('input[name="paper"]:checked');
            if (!selectedPaper) throw new Error("Please select a Paper Style.");

            const selectedInk = document.querySelector('input[name="ink"]:checked');
            if (!selectedInk) throw new Error("Please select an Ink Color.");

            const selectedHandwriting = document.querySelector('input[name="handwriting"]:checked');
            if (!selectedHandwriting) throw new Error("Please select a Handwriting Style.");
            
            if (quill.getLength() <= 1) {
                throw new Error("The Mission Briefing cannot be empty.");
            }

            // STEP 3: Gather data if validation passes
            const paperType = selectedPaper.value;
            const paperUrl = (paperType === 'A4 Sheet Lined') ? linedPaperUrl : paperImageUrl;
            const editorContent = quill.getContents();

            const requestData = {
                editorContent: editorContent,
                paperType: paperType,
                ink: selectedInk.value,
                fontUrl: selectedHandwriting.dataset.url,
                paperUrl: paperUrl
            };

            // STEP 4: Call the API
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

            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            // STEP 5: Display results
            displayResults(imageUrl, imageBlob);

        } catch (error) {
            displayError(error.message);
        } finally {
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    // --- Helper function to display results ---
    function displayResults(imageUrl, imageBlob) {
        resultDiv.innerHTML = `
            <h2>Mission Complete.</h2>
            <p style="color: #a0a0a0; margin-top: -10px; margin-bottom: 20px;">The document has been executed successfully.</p>
            <img src="${imageUrl}" alt="Generated Handwritten Assignment" id="resultImage">
            <div class="download-options">
                <button id="downloadPngBtn" class="download-btn btn-png">Download PNG</button>
                <button id="downloadPdfBtn" class="download-btn btn-pdf">Download PDF</button>
                <button id="downloadDocBtn" class="download-btn btn-doc">Download DOCX</button>
            </div>
        `;
        resultDiv.classList.remove('hidden');

        document.getElementById('downloadPngBtn').addEventListener('click', () => {
             const a = document.createElement('a'); a.href = imageUrl; a.download = 'assignment.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
             const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'px', 'a4'); const img = document.getElementById('resultImage'); const imgWidth = doc.internal.pageSize.getWidth(); const imgHeight = (img.height * imgWidth) / img.width; doc.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight); doc.save('assignment.pdf');
        });
        document.getElementById('downloadDocBtn').addEventListener('click', () => {
            const doc = new docx.Document({ sections: [{ children: [ new docx.Paragraph({ children: [ new docx.ImageRun({ data: imageBlob, transformation: { width: 600, height: 848 } }) ] }) ] }] });
            docx.Packer.toBlob(doc).then(blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'assignment.docx'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); });
        });
    }

    // --- Helper function to display errors ---
    function displayError(message) {
        resultDiv.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${message}</p>`;
        resultDiv.classList.remove('hidden');
        formContainer.classList.remove('hidden');
    }
});
