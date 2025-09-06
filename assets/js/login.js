import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const userTypeRadios = document.querySelectorAll('input[name="user_type"]');

    // Function to set the button color based on user type selection
    function setButtonColor() {
        if (!loginBtn) return;
        const selectedType = document.querySelector('input[name="user_type"]:checked').value;
        if (selectedType === 'customer') {
            loginBtn.classList.add('customer-login');
            loginBtn.classList.remove('mechanic-login');
        } else {
            loginBtn.classList.add('mechanic-login');
            loginBtn.classList.remove('customer-login');
        }
    }

    userTypeRadios.forEach(radio => radio.addEventListener('change', setButtonColor));
    setButtonColor(); // Set initial color on page load

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loginBtn = document.getElementById('loginBtn');
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const selectedUserType = document.querySelector('input[name="user_type"]:checked').value;

            try {
                // 1. Sign in the user with email and password
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Determine the correct collection and redirect path
                const collectionName = selectedUserType === 'customer' ? 'customers' : 'mechanics';
                const redirectURL = selectedUserType === 'customer' ? './customer-dashboard.html' : './mechanic-dashboard.html';

                // 3. Verify the user exists in the correct Firestore collection
                const userDocRef = doc(db, collectionName, user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // User type is correct, proceed with redirect
                   
                    window.location.href = redirectURL;
                } else {
                    // User exists in Auth but not in the right collection (e.g., a mechanic trying to log in as a customer)
                    await auth.signOut(); // Sign out the user
                    throw new Error(`You are not registered as a ${selectedUserType}. Please select the correct role.`);
                }

            } catch (error) {
                console.error("Login Error:", error);
                let errorMessage = "Login failed. Please check your credentials and try again.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = "Invalid email or password.";
                } else if (error.message.includes("not registered as a")) {
                    errorMessage = error.message;
                }
                
                alert(errorMessage);
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    }
});