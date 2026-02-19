// frontend-vercel/js/auth.js
import { supabase, redirectIfAuthenticated } from './supabase.js';

// Redirect user if they are already logged in
redirectIfAuthenticated();

// --- DOM ELEMENTS ---
// Forms
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const otpForm = document.getElementById('otp-form');
const oauthContainer = document.getElementById('oauth-container');

// Text Elements
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');

// Notification Elements (New Premium UI)
const globalError = document.getElementById('global-error');
const globalErrorText = document.getElementById('global-error-text');
const globalSuccess = document.getElementById('global-success');
const globalSuccessText = document.getElementById('global-success-text');
const passwordLengthError = document.getElementById('password-length-error');
const signupPasswordInput = document.getElementById('signup-password');

// Toggle Links
const showSignupBtn = document.getElementById('show-signup');
const showLoginFromSignupBtn = document.getElementById('show-login-from-signup');
const showResetBtn = document.getElementById('show-reset');
const showLoginFromResetBtn = document.getElementById('show-login-from-reset');

// Google Button
const googleBtn = document.getElementById('google-btn');

let userEmail = '';

// --- NOTIFICATION HELPERS ---
function hideNotifications() {
    globalError.classList.add('hidden');
    globalSuccess.classList.add('hidden');
    signupPasswordInput.classList.remove('input-error');
    passwordLengthError.classList.add('hidden');
}

function showError(message) {
    hideNotifications();
    globalErrorText.innerText = message;
    globalError.classList.remove('hidden');
}

function showSuccess(message) {
    hideNotifications();
    globalSuccessText.innerText = message;
    globalSuccess.classList.remove('hidden');
}


// --- UI TOGGLE LOGIC ---
// Helper function to hide all forms
function hideAllForms() {
    hideNotifications(); // Clear errors when switching screens
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    resetForm.classList.add('hidden');
    otpForm.classList.add('hidden');
    oauthContainer.classList.remove('hidden'); // Usually visible unless in OTP mode
}

showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllForms();
    signupForm.classList.remove('hidden');
    authTitle.innerText = "Request Clearance";
    authSubtitle.innerText = "Create your agent profile.";
});

const returnToLogin = (e) => {
    if (e) e.preventDefault();
    hideAllForms();
    loginForm.classList.remove('hidden');
    authTitle.innerText = "Secure Portal";
    authSubtitle.innerText = "Sign in to access the SOTA models.";
};

showLoginFromSignupBtn.addEventListener('click', returnToLogin);
showLoginFromResetBtn.addEventListener('click', returnToLogin);

showResetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideAllForms();
    resetForm.classList.remove('hidden');
    authTitle.innerText = "Recover Access";
    authSubtitle.innerText = "We'll send you a secure reset link.";
});


// --- 1. SIGN UP (Creates account & triggers OTP) ---
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotifications();
    
    userEmail = document.getElementById('signup-email').value;
    const password = signupPasswordInput.value;

    // Custom UI Validation for Password Length
    if (password.length < 6) {
        signupPasswordInput.classList.add('input-error');
        passwordLengthError.classList.remove('hidden');
        return; // Stop execution, don't ping database
    }

    // Supabase SignUp
    const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
    });

    if (error) {
        showError(error.message);
    } else {
        // Switch UI to OTP state for first-time verification
        hideAllForms();
        oauthContainer.classList.add('hidden'); // Hide Google login during OTP
        otpForm.classList.remove('hidden');
        authTitle.innerText = "Verify Identity";
        authSubtitle.innerText = `We sent a 6-digit code to ${userEmail}`;
    }
});


// --- 2. OTP VERIFICATION (Only for first-time signups) ---
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotifications();
    const token = document.getElementById('otp').value;

    const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token,
        type: 'signup' // Tells Supabase this is confirming a new account
    });

    if (error) {
        showError("Invalid clearance code. Please try again.");
    } else {
        // Success! Send them to the dashboard
        window.location.href = 'dashboard.html';
    }
});


// --- 3. SIGN IN (Standard Password Login) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotifications();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showError("Access Denied: " + error.message);
    } else {
        // Success! Send them to the dashboard
        window.location.href = 'dashboard.html';
    }
});


// --- 4. PASSWORD RESET ---
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideNotifications();
    
    const email = document.getElementById('reset-email').value;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/dashboard.html', 
    });

    if (error) {
        showError("Error: " + error.message);
    } else {
        showSuccess("Recovery link sent! Please check your secure inbox.");
        // We leave them on this screen so they can read the success message, 
        // they can click "Return to Sign in" when ready.
    }
});


// --- 5. GOOGLE OAUTH (Untouched) ---
googleBtn.addEventListener('click', async () => {
    hideNotifications();
    const dynamicRedirectUrl = window.location.href.replace('auth.html', 'dashboard.html');
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: dynamicRedirectUrl
        }
    });
    
    if (error) showError("Google authentication failed: " + error.message);
});