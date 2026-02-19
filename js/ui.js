// frontend-vercel/js/ui.js

let lineChartInstance = null;
let radarChartInstance = null;

// Terminal Theme Colors
const COLORS = {
    cyan: '#06b6d4',
    purple: '#8b5cf6',
    red: '#ef4444',
    green: '#10b981',
    amber: '#f59e0b',
    border: '#1f1f2e',
    text: '#8b949e',
    grid: 'rgba(255, 255, 255, 0.05)'
};

/**
 * Animates a number counting up and dynamically scales font size to prevent overflow.
 */
export function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    
    // Auto-scale font for massive terminal numbers
    const digitCount = Math.floor(end).toString().length;
    if (digitCount > 10) {
        obj.style.fontSize = "clamp(3rem, 6vw, 4.5rem)";
    } else {
        obj.style.fontSize = ""; // Fallback to tailwind classes
    }

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = progress * (2 - progress); 
        const currentVal = (easeProgress * (end - start) + start);
        
        obj.innerHTML = currentVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Renders terminal-grade charts: A Break-Even Horizon (Line) and Risk Matrix (Radar).
 */
export function updateExecutiveCharts(profit, inputs) {
    const { rd, admin, mkt } = inputs;
    const totalSpend = rd + admin + mkt;
    
    // --- 1. BREAK-EVEN HORIZON (LINE CHART) ---
    const lineCtx = document.getElementById('growthChart').getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();

    // Simulate a 5-year trajectory from negative spend to final profit
    const lineData = [-totalSpend, profit * 0.1, profit * 0.45, profit * 0.8, profit];

    lineChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Y1 (Burn)', 'Y2', 'Y3', 'Y4', 'Y5 (Proj)'],
            datasets: [{
                label: 'Cash Flow Trajectory',
                data: lineData,
                borderColor: COLORS.cyan,
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: COLORS.purple,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    grid: { color: COLORS.grid },
                    ticks: { color: COLORS.text, font: { family: 'JetBrains Mono', size: 9 }, callback: (val) => '$' + (val/1000000).toFixed(1) + 'M' }
                },
                x: { 
                    grid: { display: false },
                    ticks: { color: COLORS.text, font: { family: 'JetBrains Mono', size: 9 } }
                }
            }
        }
    });

    // --- 2. RISK MATRIX (RADAR CHART) ---
    const radarCtx = document.getElementById('riskChart').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();

    // Mathematically derive mock risk scores (1-10, lower is better) based on financial ratios
    const burnRisk = totalSpend > profit ? 9 : 2;
    const opexRisk = (admin + mkt) > rd ? 8 : 3;
    const executionRisk = profit > 100000 ? 4 : 7;
    const marketRisk = 5; // Baseline market risk
    const scalingRisk = rd < 50000 ? 8 : 2;

    radarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['Burn Rate', 'OpEx Bloat', 'Execution', 'Market', 'Scaling'],
            datasets: [{
                label: 'Risk Exposure',
                data: [burnRisk, opexRisk, executionRisk, marketRisk, scalingRisk],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: COLORS.red,
                pointBackgroundColor: COLORS.red,
                pointBorderColor: '#fff',
                borderWidth: 1.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    angleLines: { color: COLORS.grid },
                    grid: { color: COLORS.grid },
                    pointLabels: { color: COLORS.text, font: { family: 'JetBrains Mono', size: 8 } },
                    ticks: { display: false, min: 0, max: 10 }
                }
            }
        }
    });
}

/**
 * Calculates derived institutional metrics (EBITDA, Ratios).
 */
export function updateExecutiveMetrics(profit, inputs) {
    const { rd, admin, mkt } = inputs;
    const totalOpEx = admin + mkt;
    const totalSpend = rd + totalOpEx;

    // DOM Elements
    const roiDisplay = document.getElementById('roi-display');
    const ebitdaDisplay = document.getElementById('ebitda-display');
    const opexRatioDisplay = document.getElementById('opex-ratio-display');
    const tierDisplay = document.getElementById('tier-display');
    const riskBadge = document.getElementById('risk-badge');

    // Derived Math
    const roi = totalSpend > 0 ? ((profit - totalSpend) / totalSpend) * 100 : ((profit - rd) / rd) * 100;
    const impliedRevenue = profit + totalSpend;
    const ebitdaMargin = impliedRevenue > 0 ? (profit / impliedRevenue) * 100 : 0;
    const opexRatio = rd > 0 ? (totalOpEx / rd) : 0;

    // Render ROI
    roiDisplay.innerText = `${roi > 0 ? '+' : ''}${roi.toLocaleString(undefined, {maximumFractionDigits: 1})}%`;
    roiDisplay.className = roi >= 0 ? "text-xl font-bold font-mono text-green-400 tabular-nums" : "text-xl font-bold font-mono text-red-500 tabular-nums";

    // Render EBITDA
    ebitdaDisplay.innerText = `${ebitdaMargin.toLocaleString(undefined, {maximumFractionDigits: 1})}%`;

    // Render OpEx Ratio
    if (totalOpEx === 0) {
        opexRatioDisplay.innerText = "0.00x (Lean)";
        opexRatioDisplay.className = "text-xl font-bold font-mono text-green-400 tabular-nums";
    } else {
        opexRatioDisplay.innerText = `${opexRatio.toLocaleString(undefined, {maximumFractionDigits: 2})}x`;
        opexRatioDisplay.className = opexRatio > 1.0 ? "text-xl font-bold font-mono text-amber-500 tabular-nums" : "text-xl font-bold font-mono text-cyan-400 tabular-nums";
    }

    // Render Tier
    if (profit > 500000000) tierDisplay.innerText = "Unicorn";
    else if (profit > 100000000) tierDisplay.innerText = "Tier 1";
    else tierDisplay.innerText = "Emerging";

    // Render Overall Risk Badge
    const avgRisk = opexRatio > 1.0 || roi < 0 ? "HIGH RISK" : "OPTIMIZED";
    if (avgRisk === "OPTIMIZED") {
        riskBadge.innerText = "LOW EXPOSURE";
        riskBadge.className = "text-[9px] bg-green-500/10 border border-green-500/30 px-2 py-1 rounded font-mono text-green-400 tracking-widest";
    } else {
        riskBadge.innerText = "HIGH EXPOSURE";
        riskBadge.className = "text-[9px] bg-red-500/10 border border-red-500/30 px-2 py-1 rounded font-mono text-red-400 tracking-widest";
    }
}

/**
 * Updates the Delta Analysis panel (Noise Penalty).
 */
export function updateDeltaAnalysis(noisePenalty) {
    const penaltyDisplay = document.getElementById('penalty-display');
    if (noisePenalty === null) {
        penaltyDisplay.innerText = "N/A (SOTA Active)";
        penaltyDisplay.className = "text-sm font-bold text-terminal-cyan font-mono drop-shadow-md";
    } else {
        penaltyDisplay.innerText = `-$${noisePenalty.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        penaltyDisplay.className = "text-sm font-bold text-red-500 font-mono drop-shadow-md blink";
    }
}

/**
 * Toggles the visibility of Administration and Marketing inputs.
 */
export function toggleModelFields(selectedModel, elements) {
    const { dynamicFields, adminInput, marketingInput } = elements;
    if (selectedModel === 'all_features') {
        dynamicFields.classList.remove('hidden');
        setTimeout(() => dynamicFields.classList.remove('opacity-0'), 10);
    } else {
        dynamicFields.classList.add('opacity-0');
        setTimeout(() => dynamicFields.classList.add('hidden'), 300);
        adminInput.value = '';
        marketingInput.value = '';
    }
}

/**
 * Handles the UI state transitions for the Terminal.
 */
export function setPredictionState(state, elements) {
    const { predictBtn, spinner, statusDot, statusText, resultDisplay } = elements;
    
    if (state === 'loading') {
        predictBtn.disabled = true;
        spinner.classList.remove('hidden');
        statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 blink';
        statusText.innerText = 'Compiling Matrix...';
        statusText.className = 'text-[10px] uppercase font-mono tracking-widest text-amber-400';
    } 
    else if (state === 'success') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        statusDot.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]';
        statusText.innerText = 'Vector Established';
        statusText.className = 'text-[10px] uppercase font-mono tracking-widest text-cyan-400';
    } 
    else if (state === 'error') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        resultDisplay.innerText = "ERR_NULL";
        statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]';
        statusText.innerText = 'Connection Severed';
        statusText.className = 'text-[10px] uppercase font-mono tracking-widest text-red-500';
    }
}