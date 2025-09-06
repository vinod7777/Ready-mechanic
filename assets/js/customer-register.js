import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const registerBtn = document.getElementById('registerBtn');
            registerBtn.disabled = true;
            registerBtn.textContent = 'Registering...';

            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirmPassword) {
                alert("Passwords do not match!");
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register as Customer';
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                const user = userCredential.user;

                const userData = {
                    uid: user.uid,
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    pincode: data.pincode,
                    userType: 'customer',
                    createdAt: serverTimestamp(),
                    isActive: true
                };

                await setDoc(doc(db, 'customers', user.uid), userData);

                window.location.href = './login.html';
            } catch (error) {
                console.error("Registration Error:", error);
                alert(`Registration failed: ${error.message}`);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register as Customer';
            }
        });
    }
});