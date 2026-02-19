// frontend-vercel/js/ui.js

let chartInstance = null;

/**
 * Animates a number counting up and dynamically scales font size to prevent overflow.
 */
export function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    
    // Fix for the "Giant Number" bug: 
    // If the number is huge, we shrink the text so it stays inside the glass panel.
    const digitCount = Math.floor(end).toString().length;
    if (digitCount > 12) {
        obj.style.fontSize = "clamp(2rem, 8vw, 4rem)";
    } else if (digitCount > 9) {
        obj.style.fontSize = "clamp(3rem, 10vw, 6rem)";
    } else {
        obj.style.fontSize = ""; // Reset to default CSS
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
 * Renders a premium, glowing line chart showing a mock growth trajectory.
 */
export function updateExecutiveCharts(profit) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    const canvas = document.getElementById('growthChart');
    canvas.style.opacity = "1";

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Generate a mock trajectory based on the AI's predicted profit
    const dataPoints = [profit * 0.4, profit * 0.6, profit * 0.55, profit * 0.85, profit * 0.9, profit];

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1 2027', 'Current Proj.'],
            datasets: [{
                label: 'Market Trajectory',
                data: dataPoints,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#a855f7',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { 
                    ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

/**
 * Calculates and updates ROI, Risk, and Market Tier metrics.
 */
export function updateExecutiveMetrics(profit, rdSpend) {
    const roiDisplay = document.getElementById('roi-display');
    const tierDisplay = document.getElementById('tier-display');
    const riskDisplay = document.getElementById('risk-display');

    // Calculate ROI
    const roi = rdSpend > 0 ? ((profit - rdSpend) / rdSpend) * 100 : 0;
    roiDisplay.innerText = `${roi.toLocaleString(undefined, {maximumFractionDigits: 1})}%`;
    roiDisplay.className = roi >= 0 ? "text-2xl font-bold text-cyan-400" : "text-2xl font-bold text-red-400";

    // Determine Market Tier
    if (profit > 500000000) tierDisplay.innerText = "Unicorn";
    else if (profit > 100000000) tierDisplay.innerText = "Tier 1";
    else tierDisplay.innerText = "Emerging";

    // Mock Risk Index (Lower is better)
    const risk = Math.max(1.2, (10 - (profit / 1000000)).toFixed(1));
    riskDisplay.innerText = risk;
    riskDisplay.className = risk < 5 ? "text-2xl font-bold text-cyan-400" : "text-2xl font-bold text-yellow-400";
}

/**
 * Toggles the visibility of Administration and Marketing inputs.
 */
export function toggleModelFields(selectedModel, elements) {
    const { dynamicFields, adminInput, marketingInput } = elements;
    if (selectedModel === 'all_features') {
        dynamicFields.classList.remove('hidden');
        setTimeout(() => dynamicFields.classList.remove('opacity-0'), 10);
        adminInput.setAttribute('required', 'true');
        marketingInput.setAttribute('required', 'true');
    } else {
        dynamicFields.classList.add('opacity-0');
        setTimeout(() => dynamicFields.classList.add('hidden'), 300);
        adminInput.removeAttribute('required');
        marketingInput.removeAttribute('required');
        adminInput.value = '';
        marketingInput.value = '';
    }
}

/**
 * Handles the UI state transitions (Loading, Success, Error).
 */
export function setPredictionState(state, elements) {
    const { predictBtn, spinner, statusDot, statusText, resultDisplay } = elements;
    if (state === 'loading') {
        predictBtn.disabled = true;
        spinner.classList.remove('hidden');
        statusDot.className = 'w-3 h-3 rounded-full bg-yellow-400 animate-pulse';
        statusText.innerText = 'Calculating Matrix...';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-yellow-400';
    } 
    else if (state === 'success') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        statusDot.className = 'w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]';
        statusText.innerText = 'Prediction Secured';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-cyan-400';
    } 
    else if (state === 'error') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        resultDisplay.innerText = "ERR";
        statusDot.className = 'w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]';
        statusText.innerText = 'Connection Failed';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-red-400';
    }
}