// frontend-vercel/js/predict.js
import { supabase, requireAuth } from './supabase.js';
// Added new executive UI imports
import { animateValue, toggleModelFields, setPredictionState, updateExecutiveCharts, updateExecutiveMetrics } from './ui.js';

// ==========================================
// 🔗 API CONFIGURATION
// ==========================================
const HUGGING_FACE_API_URL = 'https://thisisnemo-aii.hf.space/predict';

// DOM Elements - Data
const form = document.getElementById('prediction-form');
const modelRadios = document.getElementsByName('model_type');
const nicknameDisplay = document.getElementById('user-nickname');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Inputs & Premium Errors
const rdInput = document.getElementById('rd_spend');
const rdError = document.getElementById('rd-error');
const adminInput = document.getElementById('admin_spend');
const adminError = document.getElementById('admin-error');
const marketingInput = document.getElementById('marketing_spend');
const marketingError = document.getElementById('marketing-error');
const dashError = document.getElementById('dash-error');
const dashErrorText = document.getElementById('dash-error-text');

// DOM Elements - UI Passed to ui.js
const uiElements = {
    dynamicFields: document.getElementById('dynamic-fields'),
    adminInput: adminInput,
    marketingInput: marketingInput,
    predictBtn: document.getElementById('predict-btn'),
    spinner: document.getElementById('loading-spinner'),
    resultDisplay: document.getElementById('result-display'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text')
};

let currentUser = null;

// ==========================================
// 🛡️ INITIALIZATION & AUTHENTICATION
// ==========================================
async function init() {
    currentUser = await requireAuth();
    if (!currentUser) return;
    fetchNickname();
}

async function fetchNickname() {
    const { data } = await supabase.from('profiles').select('nickname').eq('id', currentUser.id).single();
    if (data && data.nickname) nicknameDisplay.innerText = data.nickname;
}

// Nickname Editing
nicknameDisplay.addEventListener('click', async () => {
    const newName = prompt("Enter your new Agent Nickname:", nicknameDisplay.innerText);
    if (newName && newName.trim().length > 0) {
        nicknameDisplay.innerText = "Updating...";
        const { error } = await supabase.from('profiles').update({ nickname: newName.trim() }).eq('id', currentUser.id);
        if (!error) nicknameDisplay.innerText = newName.trim();
        else fetchNickname();
    }
});

// UPGRADED DISCONNECT LOGIC
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.replace('index.html');
});

// ==========================================
// 🎨 UI EVENT LISTENERS
// ==========================================
modelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModelFields(e.target.value, uiElements);
        clearErrors(); // Hide errors if they switch models
    });
});

// --- PREMIUM VALIDATION HELPER ---
function clearErrors() {
    dashError.classList.add('hidden');
    rdInput.classList.remove('input-error');
    rdError.classList.add('hidden');
    adminInput.classList.remove('input-error');
    adminError.classList.add('hidden');
    marketingInput.classList.remove('input-error');
    marketingError.classList.add('hidden');
}


// ==========================================
// 🧠 PREDICTION EXECUTION (Fetch to HF)
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const selectedModel = document.querySelector('input[name="model_type"]:checked').value;
    let isValid = true;

    // Custom UI Validation
    if (!rdInput.value || rdInput.value.trim() === '') {
        rdInput.classList.add('input-error');
        rdError.classList.remove('hidden');
        isValid = false;
    }

    if (selectedModel === 'all_features') {
        if (!adminInput.value || adminInput.value.trim() === '') {
            adminInput.classList.add('input-error');
            adminError.classList.remove('hidden');
            isValid = false;
        }
        if (!marketingInput.value || marketingInput.value.trim() === '') {
            marketingInput.classList.add('input-error');
            marketingError.classList.remove('hidden');
            isValid = false;
        }
    }

    // Stop execution if parameters are missing
    if (!isValid) return;

    setPredictionState('loading', uiElements);

    const payload = {
        model_type: selectedModel,
        rd_spend: parseFloat(rdInput.value) || 0,
        admin_spend: parseFloat(adminInput.value) || 0,
        marketing_spend: parseFloat(marketingInput.value) || 0,
        state: document.getElementById('state').value
    };

    try {
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Connection Interrupted (${response.status})`);

        const data = await response.json();
        const finalProfit = data.predicted_profit || data.predicted_predicted_profit;

        // 1. Animate the core profit number (with auto-scaling font)
        animateValue(uiElements.resultDisplay, 0, finalProfit, 1000);
        
        // 2. Trigger the Executive Intelligence Suite
        updateExecutiveCharts(finalProfit);
        updateExecutiveMetrics(finalProfit, payload.rd_spend);
        
        setPredictionState('success', uiElements);

    } catch (error) {
        console.error("Prediction Failed:", error);
        setPredictionState('error', uiElements);
        
        // Trigger our custom glowing global error banner
        dashErrorText.innerText = error.message || "System malfunction. Retrying connection.";
        dashError.classList.remove('hidden');
    }
});

init();