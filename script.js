document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const API_URL = 'https://assigment-writer-2.onrender.com/api/generate';
    const GITHUB_USERNAME = 'Eden-Global';
    const REPO_NAME = 'Assigment-writer';
    const BRANCH_NAME = 'main';
    const ADMIN_PASSWORD = 'Ansif@5964';

    // --- MAIN UI SELECTORS ---
    const formContainer = document.getElementById('assignmentForm');
    const generateBtn = document.getElementById('generateBtn');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    
    // --- ADMIN MODAL SELECTORS ---
    const devButton = document.getElementById('devButton');
    const adminModal = document.getElementById('adminModal');
    const passwordSection = document.getElementById('passwordSection');
    const settingsSection = document.getElementById('settingsSection');
    const adminPasswordInput = document.getElementById('adminPassword');
    const passwordSubmitBtn = document.getElementById('passwordSubmit');
    const passwordError = document.getElementById('passwordError');
    const configPaperRadios = document.querySelectorAll('input[name="config-paper"]');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const lineGapSlider = document.getElementById('lineGapSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const lineGapValue = document.getElementById('lineGapValue');
    const updateSettingsBtn = document.getElementById('updateSettingsBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const settingsSavedText = document.getElementById('settingsSaved');

    // --- URLS & EDITOR ---
    const paperImageUrl = `https://raw.githubusercontent.com/...`; // Shortened for brevity
    const linedPaperUrl = `https://raw.githubusercontent.com/...`;
    const quill = new Quill('#editor', { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'align': [] }]] } });

    // --- ADMIN PANEL LOGIC ---
    let adminSettings = JSON.parse(localStorage.getItem('adminSettings')) || {};

    function showModal() { adminModal.classList.remove('hidden'); }
    function hideModal() { adminModal.classList.add('hidden'); }

    devButton.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);

    passwordSubmitBtn.addEventListener('click', () => {
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            passwordSection.classList.add('hidden');
            settingsSection.classList.remove('hidden');
            loadSettingsForSelectedPaper();
        } else {
            passwordError.classList.remove('hidden');
            setTimeout(() => passwordError.classList.add('hidden'), 2000);
        }
    });

    configPaperRadios.forEach(radio => {
        radio.addEventListener('change', loadSettingsForSelectedPaper);
    });

    function loadSettingsForSelectedPaper() {
        const selectedPaper = document.querySelector('input[name="config-paper"]:checked').value;
        const currentSettings = adminSettings[selectedPaper] || {};
        
        // Use default values if nothing is saved for this paper type
        const defaultFontSize = selectedPaper === 'A4 Sheet Lined' ? 36 : 55;
        const defaultLineGap = selectedPaper === 'A4 Sheet Lined' ? 41.5 : 65;
        
        fontSizeSlider.value = currentSettings.fontSize || defaultFontSize;
        lineGapSlider.value = currentSettings.lineGap || defaultLineGap;
        
        fontSizeValue.textContent = fontSizeSlider.value;
        lineGapValue.textContent = lineGapSlider.value;
    }
    
    fontSizeSlider.addEventListener('input', (e) => fontSizeValue.textContent = e.target.value);
    lineGapSlider.addEventListener('input', (e) => lineGapValue.textContent = e.target.value);

    updateSettingsBtn.addEventListener('click', () => {
        const selectedPaper = document.querySelector('input[name="config-paper"]:checked').value;
        adminSettings[selectedPaper] = {
            fontSize: parseFloat(fontSizeSlider.value),
            lineGap: parseFloat(lineGapSlider.value)
        };
        localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
        
        settingsSavedText.classList.remove('hidden');
        setTimeout(() => settingsSavedText.classList.add('hidden'), 2000);
    });

    // --- MAIN GENERATION LOGIC ---
    generateBtn.addEventListener('click', async () => {
        formContainer.classList.add('hidden');
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // Validation remains the same
            const selectedPaper = document.querySelector('input[name="paper"]:checked');
            if (!selectedPaper) throw new Error("Please select a Paper Style.");
            // ... other validations ...
            
            const paperType = selectedPaper.value;
            const paperUrl = (paperType === 'A4 Sheet Lined') ? linedPaperUrl : paperImageUrl;
            
            // **GENIUS PART**: Get custom settings from localStorage for the selected paper
            const savedSettings = JSON.parse(localStorage.getItem('adminSettings')) || {};
            const customSettings = savedSettings[paperType] || {};

            const requestData = {
                editorContent: quill.getContents(),
                paperType: paperType,
                ink: document.querySelector('input[name="ink"]:checked').value,
                fontUrl: document.querySelector('input[name="handwriting"]:checked').dataset.url,
                paperUrl: paperUrl,
                // Send the custom settings to the backend!
                fontSize: customSettings.fontSize, // Will be undefined if not set
                lineGap: customSettings.lineGap   // Will be undefined if not set
            };
            
            // API call and result handling remain the same
            // ...
            
        } catch (error) {
            displayError(error.message);
        } finally {
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    // Helper functions displayResults and displayError remain the same
    // ...
});
