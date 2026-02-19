// frontend-vercel/js/predict.js
import { supabase, requireAuth } from './supabase.js';
import { 
    animateValue, 
    toggleModelFields, 
    setPredictionState, 
    updateExecutiveCharts, 
    updateExecutiveMetrics,
    updateDeltaAnalysis
} from './ui.js';

// ==========================================
// 🔗 API CONFIGURATION
// ==========================================
const HUGGING_FACE_API_URL = 'https://thisisnemo-aii.hf.space/predict';

// DOM Elements - Data & Auth
const form = document.getElementById('prediction-form');
const modelRadios = document.getElementsByName('model_type');
const nicknameDisplay = document.getElementById('user-nickname');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Inputs & Terminal Errors
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
    const newName = prompt("Enter your Terminal Alias:", nicknameDisplay.innerText);
    if (newName && newName.trim().length > 0) {
        nicknameDisplay.innerText = "UPDATING...";
        const { error } = await supabase.from('profiles').update({ nickname: newName.trim() }).eq('id', currentUser.id);
        if (!error) nicknameDisplay.innerText = newName.trim();
        else fetchNickname();
    }
});

// Nuke Disconnect Logic
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    logoutBtn.innerHTML = 'SEVERING... <i class="fa-solid fa-spinner fa-spin"></i>';
    logoutBtn.disabled = true;

    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Disconnect error:", error);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('index.html');
    }
});

// ==========================================
// 🎨 UI EVENT LISTENERS
// ==========================================
modelRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleModelFields(e.target.value, uiElements);
        clearErrors();
    });
});

function clearErrors() {
    dashError.classList.add('hidden');
    rdInput.classList.remove('input-error');
    rdError.classList.add('hidden');
    adminInput.classList.remove('input-error');
    adminError.classList.add('hidden');
    marketingInput.classList.remove('input-error');
    marketingError.classList.add('hidden');
}

// Helper: Fetch logic isolated for clean dual-requesting
async function fetchPrediction(payload) {
    const response = await fetch(HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API Connection Interrupted (${response.status})`);
    return await response.json();
}

// ==========================================
// 🧠 PREDICTION EXECUTION & FINANCIAL MATH
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const selectedModel = document.querySelector('input[name="model_type"]:checked').value;
    let isValid = true;

    // Strict Terminal Validation - Check for empty OR negative values
    const rdVal = parseFloat(rdInput.value);
    if (!rdInput.value || rdInput.value.trim() === '' || rdVal < 0) {
        rdInput.classList.add('input-error');
        rdError.innerHTML = `<i class="fa-solid fa-xmark mr-1"></i> ${rdVal < 0 ? 'Cannot be negative' : 'Required input'}`;
        rdError.classList.remove('hidden');
        isValid = false;
    }

    if (selectedModel === 'all_features') {
        const adminVal = parseFloat(adminInput.value);
        if (!adminInput.value || adminInput.value.trim() === '' || adminVal < 0) {
            adminInput.classList.add('input-error');
            adminError.innerHTML = `<i class="fa-solid fa-xmark mr-1"></i> ${adminVal < 0 ? 'Cannot be negative' : 'Required for Baseline'}`;
            adminError.classList.remove('hidden');
            isValid = false;
        }

        const mktVal = parseFloat(marketingInput.value);
        if (!marketingInput.value || marketingInput.value.trim() === '' || mktVal < 0) {
            marketingInput.classList.add('input-error');
            marketingError.innerHTML = `<i class="fa-solid fa-xmark mr-1"></i> ${mktVal < 0 ? 'Cannot be negative' : 'Required for Baseline'}`;
            marketingError.classList.remove('hidden');
            isValid = false;
        }
    }

    // Halt execution if any fields failed validation
    if (!isValid) return;

    setPredictionState('loading', uiElements);

    // Structure raw inputs for math derived later
    const inputs = {
        rd: parseFloat(rdInput.value) || 0,
        admin: parseFloat(adminInput.value) || 0,
        mkt: parseFloat(marketingInput.value) || 0
    };

    const basePayload = {
        rd_spend: inputs.rd,
        admin_spend: inputs.admin,
        marketing_spend: inputs.mkt,
        state: document.getElementById('state').value
    };

    try {
        let finalProfit = 0;

        // ⚡ DELTA ANALYSIS ENGINE ⚡
        if (selectedModel === 'optimized') {
            // Standard Single Request
            const data = await fetchPrediction({ ...basePayload, model_type: 'optimized' });
            finalProfit = data.predicted_profit;
            updateDeltaAnalysis(null); // SOTA is active, no noise penalty
        } else {
            // Dual Request: We fetch BOTH to show the CEO the cost of noise
            const [baselineData, sotaData] = await Promise.all([
                fetchPrediction({ ...basePayload, model_type: 'all_features' }),
                fetchPrediction({ ...basePayload, model_type: 'optimized' })
            ]);
            
            finalProfit = baselineData.predicted_profit;
            const optimizedProfit = sotaData.predicted_profit;
            
            // Calculate the financial deviation caused by Admin/Mkt features
            const noisePenalty = optimizedProfit - finalProfit; 
            updateDeltaAnalysis(noisePenalty);
        }

        // 1. Core Oracle Animation
        animateValue(uiElements.resultDisplay, 0, finalProfit, 1200);
        
        // 2. Derive Institutional Metrics (EBITDA, Risk, Burn Horizon)
        updateExecutiveCharts(finalProfit, inputs);
        updateExecutiveMetrics(finalProfit, inputs);
        
        setPredictionState('success', uiElements);

    } catch (error) {
        console.error("Execution Failed:", error);
        setPredictionState('error', uiElements);
        dashErrorText.innerText = error.message || "Subsystem offline. Retrying connection.";
        dashError.classList.remove('hidden');
    }
});

init();
