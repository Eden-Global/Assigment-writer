document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate';
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer';
    const BRANCH_NAME = 'main';

    // --- STATE MANAGEMENT ---
    let currentStep = 1;
    const userSelections = {};

    // --- ELEMENT SELECTORS ---
    const steps = document.querySelectorAll('.form-step');
    const formContainer = document.getElementById('form-container');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const characters = {
        professor: document.getElementById('char-professor'),
        walter: document.getElementById('char-walter'),
        steve: document.getElementById('char-steve'),
        squidgame: document.getElementById('char-squidgame'),
        berlin: document.getElementById('char-berlin')
    };
    
    // --- URLs ---
    const paperImageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet.png`;
    const linedPaperUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH_NAME}/Assets/images/A4sheet_lined.png`;

    // --- INITIALIZE RICH TEXT EDITOR ---
    const quill = new Quill('#editor', {
        theme: 'snow',
        modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'align': [] }]] }
    });

    // --- NAVIGATION LOGIC ---
    const navigateToStep = (stepNumber) => {
        currentStep = stepNumber;
        steps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateCharacterVignette();
    };

    const updateCharacterVignette = () => {
        Object.values(characters).forEach(char => char.classList.remove('active'));
        switch (currentStep) {
            case 1:
                characters.professor.classList.add('active');
                characters.berlin.classList.add('active');
                break;
            case 2:
                characters.walter.classList.add('active');
                break;
            case 3:
                characters.squidgame.classList.add('active');
                break;
            case 4:
                characters.steve.classList.add('active');
                break;
        }
    };

    // --- EVENT LISTENERS FOR "CONTINUE" BUTTONS ---
    document.getElementById('btn-step-1').addEventListener('click', () => {
        if (quill.getLength() <= 1) {
            alert("The text editor cannot be empty.");
            return;
        }
        userSelections.editorContent = quill.getContents();
        navigateToStep(2);
    });
    document.getElementById('btn-step-2').addEventListener('click', () => {
        const selected = document.querySelector('input[name="paper"]:checked');
        userSelections.paperType = selected.value;
        userSelections.paperUrl = (selected.value === 'A4 Sheet Lined') ? linedPaperUrl : paperImageUrl;
        navigateToStep(3);
    });
    document.getElementById('btn-step-3').addEventListener('click', () => {
        userSelections.ink = document.querySelector('input[name="ink"]:checked').value;
        navigateToStep(4);
    });

    // --- GENERATE BUTTON EVENT LISTENER ---
    document.getElementById('generateBtn').addEventListener('click', async () => {
        const selectedHandwriting = document.querySelector('input[name="handwriting"]:checked');
        userSelections.fontUrl = selectedHandwriting.dataset.url;
        formContainer.classList.add('hidden');
        resultDiv.classList.add('hidden');
        Object.values(characters).forEach(char => char.classList.remove('active'));
        loadingDiv.classList.remove('hidden');
        try {
            const requestData = { editorContent: userSelections.editorContent, paperType: userSelections.paperType, ink: userSelections.ink, fontUrl: userSelections.fontUrl, paperUrl: userSelections.paperUrl };
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData) });
            if (!response.ok) { let errorMsg = `Server error: ${response.statusText}`; try { const errorResult = await response.json(); errorMsg = errorResult.error || errorResult.message || errorMsg; } catch (e) { /* Ignore */ } throw new Error(errorMsg); }
            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            displayResults(imageUrl, imageBlob);
        } catch (error) {
            displayError(error.message);
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });

    // --- HELPER & DOWNLOAD FUNCTIONS ---
    function displayResults(imageUrl, imageBlob) {
        resultDiv.innerHTML = `<div class="container result-container"><h2>Generation Complete!</h2><p style="color: #ccc; margin-top: -10px; margin-bottom: 20px;">Your document has been successfully created.</p><img src="${imageUrl}" alt="Generated Handwritten Assignment" id="resultImage"><div class="download-options"><button id="downloadPngBtn" class="download-btn btn-png">Download PNG</button><button id="downloadPdfBtn" class="download-btn btn-pdf">Download PDF</button><button id="downloadDocBtn" class="download-btn btn-doc">Download DOCX</button></div><button id="startOverBtn" class="btn-next" style="margin-top: 20px;">Start Over</button></div>`;
        resultDiv.classList.remove('hidden');
        document.getElementById('downloadPngBtn').addEventListener('click', () => { downloadFile(imageUrl, 'assignment.png'); });
        document.getElementById('downloadPdfBtn').addEventListener('click', () => { downloadPdf(); });
        document.getElementById('downloadDocBtn').addEventListener('click', () => { downloadDocx(imageBlob); });
        document.getElementById('startOverBtn').addEventListener('click', () => { location.reload(); });
    }
    function displayError(message) {
        resultDiv.innerHTML = `<div class="container result-container"><h2 class="error-message">An Error Occurred</h2><p style="color: #ccc;">${message}</p><button id="startOverBtn" class="btn-next" style="margin-top: 20px;">Try Again</button></div>`;
        resultDiv.classList.remove('hidden');
        document.getElementById('startOverBtn').addEventListener('click', () => { location.reload(); });
    }
    const downloadFile = (url, filename) => { const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
    const downloadPdf = () => { const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'px', 'a4'); const img = document.getElementById('resultImage'); const imgWidth = doc.internal.pageSize.getWidth(); const imgHeight = (img.height * imgWidth) / img.width; doc.addImage(img, 'PNG', 0, 0, imgWidth, imgHeight); doc.save('assignment.pdf'); };
    const downloadDocx = (imageBlob) => { const doc = new docx.Document({ sections: [{ children: [ new docx.Paragraph({ children: [ new docx.ImageRun({ data: imageBlob, transformation: { width: 600, height: 848 } }) ] }) ] }] }); docx.Packer.toBlob(doc).then(blob => { const url = URL.createObjectURL(blob); downloadFile(url, 'assignment.docx'); URL.revokeObjectURL(url); }); };
    
    // --- INITIALIZE THE PAGE ---
    navigateToStep(1);
});
