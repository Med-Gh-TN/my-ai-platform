// frontend-vercel/js/ui.js

/**
 * Animates a number counting up to the final prediction value.
 */
export function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Ease out quad for smooth deceleration
        const easeProgress = progress * (2 - progress); 
        const currentVal = (easeProgress * (end - start) + start);
        
        // Format as comma-separated USD
        obj.innerHTML = currentVal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Toggles the visibility of Administration and Marketing inputs 
 * based on whether the SOTA (Optimized) model is selected.
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
 * Handles the UI state transitions (Loading, Success, Error)
 */
export function setPredictionState(state, elements) {
    const { predictBtn, spinner, statusDot, statusText, resultDisplay } = elements;

    if (state === 'loading') {
        predictBtn.disabled = true;
        spinner.classList.remove('hidden');
        statusDot.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-pulse';
        statusText.innerText = 'Calculating Matrix...';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-yellow-400';
    } 
    else if (state === 'success') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        statusDot.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]';
        statusText.innerText = 'Prediction Secured';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-cyan-400';
    } 
    else if (state === 'error') {
        predictBtn.disabled = false;
        spinner.classList.add('hidden');
        resultDisplay.innerText = "ERR";
        statusDot.className = 'w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]';
        statusText.innerText = 'Connection to AI Failed';
        statusText.className = 'text-xs uppercase font-mono tracking-wider text-red-400';
    }
}