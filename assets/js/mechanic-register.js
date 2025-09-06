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
                registerBtn.textContent = 'Register as Mechanic';
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                const user = userCredential.user;

                const vehicleTypes = formData.getAll('vehicleTypes');
                const userData = {
                    uid: user.uid,
                    fullName: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    experience: data.experience,
                    vehicleTypes: vehicleTypes,
                    skills: data.skills,
                    serviceArea: data.serviceArea,
                    licenseNumber: data.licenseNumber,
                    aadharNumber: data.aadharNumber,
                    bankAccount: data.bankAccount,
                    ifscCode: data.ifscCode,
                    userType: 'mechanic',
                    status: 'verified',
                    createdAt: serverTimestamp(),
                    isActive: true,
                    rating: 0,
                    totalJobs: 0,
                    totalEarnings: 0
                };

                await setDoc(doc(db, 'mechanics', user.uid), userData);

                window.location.href = './login.html';
            } catch (error) {
                console.error("Registration Error:", error);
                alert(`Registration failed: ${error.message}`);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register as Mechanic';
            }
        });
    }
});