import {
    auth,
    db,
    collections,
    createUserWithEmailAndPassword,
    updateProfile,
    doc,
    setDoc
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    const userTypeRadios = document.querySelectorAll('input[name="user_type"]');
    const customerFields = document.querySelector('.customer-fields');
    const mechanicFields = document.querySelector('.mechanic-fields');
    const submitButton = document.getElementById('registerBtn');

    // Function to toggle fields based on user type
    const toggleFields = (userType) => {
        if (userType === 'customer') {
            customerFields.style.display = 'block';
            mechanicFields.style.display = 'none';
            submitButton.classList.remove('mechanic');
            submitButton.classList.add('customer');
        } else {
            customerFields.style.display = 'none';
            mechanicFields.style.display = 'block';
            submitButton.classList.remove('customer');
            submitButton.classList.add('mechanic');
        }
    };

    // Check for URL params to set initial state
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role === 'mechanic') {
        document.getElementById('user-type-mechanic').checked = true;
        toggleFields('mechanic');
    } else {
        document.getElementById('user-type-customer').checked = true;
        toggleFields('customer');
    }

    // Add event listeners to radio buttons
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            toggleFields(e.target.value);
        });
    });

    // Handle form submission
    signupForm.addEventListener('submit', handleRegister);
});

async function handleRegister(e) {
    e.preventDefault();
    // In a real app, you would add comprehensive error handling and validation here.
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const userType = data.user_type;

    // Basic validation
    if (data.password !== data.confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
    if (data.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // 2. Update Firebase Auth profile
        await updateProfile(user, {
            displayName: data.fullName
        });

        // 3. Save user data to Firestore
        if (userType === 'customer') {
            await registerCustomer(user, data);
        } else {
            await registerMechanic(user, data);
        }

        alert('Registration successful! Redirecting to your dashboard.');
        window.location.href = userType === 'customer' ? 'customer-dashboard.html' : 'mechanic-dashboard.html';

    } catch (error) {
        console.error("Registration Error:", error);
        handleAuthError(error);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
}

async function registerCustomer(user, data) {
    const customerData = {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        userType: 'customer',
        createdAt: new Date(),
        isActive: true
    };
    await setDoc(doc(db, collections.customers, user.uid), customerData);
}

async function registerMechanic(user, data) {
    const mechanicData = {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        serviceArea: data.serviceArea,
        experience: data.experience,
        vehicleTypes: data.vehicleTypes ? (Array.isArray(data.vehicleTypes) ? data.vehicleTypes : [data.vehicleTypes]) : [],
        skills: data.skills,
        licenseNumber: data.licenseNumber,
        aadharNumber: data.aadharNumber,
        bankAccount: data.bankAccount,
        ifscCode: data.ifscCode,
        userType: 'mechanic',
        status: 'pending', // All new mechanics start as pending
        createdAt: new Date(),
        isActive: true,
        rating: 0,
        totalJobs: 0,
        totalEarnings: 0
    };
    await setDoc(doc(db, collections.mechanics, user.uid), mechanicData);
}

function handleAuthError(error) {
    let message = 'An unknown error occurred. Please try again.';
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'This email address is already in use by another account.';
            break;
        case 'auth/invalid-email':
            message = 'The email address is not valid.';
            break;
        case 'auth/operation-not-allowed':
            message = 'Email/password accounts are not enabled.';
            break;
        case 'auth/weak-password':
            message = 'The password is too weak.';
            break;
        default:
            message = error.message;
            break;
    }
    alert(`Registration failed: ${message}`);
}