// frontend-vercel/js/auth.js
import { supabase, redirectIfAuthenticated } from './supabase.js';

// Redirect user if they are already logged in
redirectIfAuthenticated();

const loginForm = document.getElementById('login-form');
const otpForm = document.getElementById('otp-form');
const googleBtn = document.getElementById('google-btn');
const authHeader = document.getElementById('auth-header');

let userEmail = '';

// --- 1. EMAIL OTP REQUEST ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    userEmail = document.getElementById('email').value;

    const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
            shouldCreateUser: true, // Creates account if it doesn't exist
        }
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        // Switch UI to OTP state
        loginForm.classList.add('hidden');
        otpForm.classList.remove('hidden');
        authHeader.querySelector('h2').innerText = "Verify Email";
        authHeader.querySelector('p').innerText = `We sent a code to ${userEmail}`;
    }
});

// --- 2. OTP VERIFICATION ---
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('otp').value;

    const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token,
        type: 'email'
    });

    if (error) {
        alert("Verification failed: " + error.message);
    } else {
        window.location.href = 'dashboard.html';
    }
});

// --- 3. GOOGLE OAUTH ---
googleBtn.addEventListener('click', async () => {
    // We dynamically replace auth.html with dashboard.html in the CURRENT exact URL path.
    // This makes it work perfectly on local Live Server AND Vercel without hardcoding!
    const dynamicRedirectUrl = window.location.href.replace('auth.html', 'dashboard.html');
    
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: dynamicRedirectUrl
        }
    });
    if (error) alert("Google login failed: " + error.message);
});
