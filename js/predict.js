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

// DOM Elements - UI Passed to ui.js
const uiElements = {
    dynamicFields: document.getElementById('dynamic-fields'),
    adminInput: document.getElementById('admin_spend'),
    marketingInput: document.getElementById('marketing_spend'),
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
// We use location.replace to clear the history stack for maximum security
logoutBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Hard redirect to clear session from memory
        window.location.replace('index.html');
    } catch (err) {
        console.error("Logout failed:", err.message);
        // Fallback redirect
        window.location.href = 'index.html';
    }
});

// ==========================================
// 🎨 UI EVENT LISTENERS
// ==========================================
modelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModelFields(e.target.value, uiElements);
    });
});

// ==========================================
// 🧠 PREDICTION EXECUTION (Fetch to HF)
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    setPredictionState('loading', uiElements);

    const rdValue = parseFloat(document.getElementById('rd_spend').value) || 0;
    const selectedModel = document.querySelector('input[name="model_type"]:checked').value;
    
    const payload = {
        model_type: selectedModel,
        rd_spend: rdValue,
        admin_spend: parseFloat(uiElements.adminInput.value) || 0,
        marketing_spend: parseFloat(uiElements.marketingInput.value) || 0,
        state: document.getElementById('state').value
    };

    try {
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const finalProfit = data.predicted_profit || data.predicted_predicted_profit;

        // 1. Animate the core profit number (with auto-scaling font)
        animateValue(uiElements.resultDisplay, 0, finalProfit, 1000);
        
        // 2. NEW: Trigger the Executive Intelligence Suite
        updateExecutiveCharts(finalProfit);
        updateExecutiveMetrics(finalProfit, rdValue);
        
        setPredictionState('success', uiElements);

    } catch (error) {
        console.error("Prediction Failed:", error);
        setPredictionState('error', uiElements);
    }
});

init();