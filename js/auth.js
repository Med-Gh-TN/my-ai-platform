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

// Toggle Links
const showSignupBtn = document.getElementById('show-signup');
const showLoginFromSignupBtn = document.getElementById('show-login-from-signup');
const showResetBtn = document.getElementById('show-reset');
const showLoginFromResetBtn = document.getElementById('show-login-from-reset');

// Google Button
const googleBtn = document.getElementById('google-btn');

let userEmail = '';

// --- UI TOGGLE LOGIC ---
// Helper function to hide all forms
function hideAllForms() {
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
    userEmail = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Supabase SignUp
    const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
    });

    if (error) {
        alert("Sign Up Error: " + error.message);
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
    const token = document.getElementById('otp').value;

    const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token,
        type: 'signup' // Tells Supabase this is confirming a new account
    });

    if (error) {
        alert("Verification failed: " + error.message);
    } else {
        // Success! Send them to the dashboard
        window.location.href = 'dashboard.html';
    }
});


// --- 3. SIGN IN (Standard Password Login) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Access Denied: " + error.message);
    } else {
        // Success! Send them to the dashboard
        window.location.href = 'dashboard.html';
    }
});


// --- 4. PASSWORD RESET ---
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // We'll redirect them back to the dashboard where they can update it
        redirectTo: window.location.origin + '/dashboard.html', 
    });

    if (error) {
        alert("Reset Error: " + error.message);
    } else {
        alert("Recovery link sent! Please check your email inbox.");
        returnToLogin(); // Send them back to the login screen
    }
});


// --- 5. GOOGLE OAUTH (Untouched, works perfectly) ---
googleBtn.addEventListener('click', async () => {
    const dynamicRedirectUrl = window.location.href.replace('auth.html', 'dashboard.html');
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: dynamicRedirectUrl
        }
    });
    if (error) alert("Google login failed: " + error.message);
});