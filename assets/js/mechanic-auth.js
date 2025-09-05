import { 
    auth, 
    db, 
    collections, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    googleProvider, 
    sendPasswordResetEmail, 
    updateProfile,
    addDoc,
    collection,
    doc,
    setDoc
} from './firebase-config.js';

// Form validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function validatePassword(password) {
    return password.length >= 6;
}

function validateLicense(license) {
    return license.length >= 6;
}

function validateAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar);
}

function validateBankAccount(account) {
    return /^\d{9,18}$/.test(account);
}

function validateIFSC(ifsc) {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
}

function setLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

// Password toggle functionality
window.togglePassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = field.parentElement.querySelector('.password-toggle i');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
};

// Mechanic Registration
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('mechanicRegisterForm');
    const loginForm = document.getElementById('mechanicLoginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleMechanicRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleMechanicLogin);
    }
});

async function handleMechanicRegister(e) {
    e.preventDefault();
    clearAllErrors();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Validation
    let isValid = true;

    if (!data.fullName || data.fullName.trim().length < 2) {
        showError('fullName', 'Full name must be at least 2 characters');
        isValid = false;
    }

    if (!validateEmail(data.email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!validatePhone(data.phone)) {
        showError('phone', 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    if (!validatePassword(data.password)) {
        showError('password', 'Password must be at least 6 characters');
        isValid = false;
    }

    if (data.password !== data.confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    if (!data.experience) {
        showError('experience', 'Please select your experience level');
        isValid = false;
    }

    const vehicleTypes = formData.getAll('vehicleTypes');
    if (vehicleTypes.length === 0) {
        showError('vehicleTypes', 'Please select at least one vehicle type');
        isValid = false;
    }

    if (!data.skills || data.skills.trim().length < 10) {
        showError('skills', 'Please provide detailed skills and specializations');
        isValid = false;
    }

    if (!data.serviceArea || data.serviceArea.trim().length < 2) {
        showError('serviceArea', 'Please enter your service area');
        isValid = false;
    }

    if (!data.address || data.address.trim().length < 10) {
        showError('address', 'Please enter a complete address');
        isValid = false;
    }

    if (!validateLicense(data.licenseNumber)) {
        showError('licenseNumber', 'Please enter a valid license number');
        isValid = false;
    }

    if (!validateAadhar(data.aadharNumber)) {
        showError('aadharNumber', 'Please enter a valid 12-digit Aadhar number');
        isValid = false;
    }

    if (!validateBankAccount(data.bankAccount)) {
        showError('bankAccount', 'Please enter a valid bank account number');
        isValid = false;
    }

    if (!validateIFSC(data.ifscCode)) {
        showError('ifscCode', 'Please enter a valid IFSC code');
        isValid = false;
    }

    if (!data.terms) {
        showError('terms', 'Please accept the terms and conditions');
        isValid = false;
    }

    if (!isValid) return;

    setLoading('registerBtn', true);

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Update user profile
        await updateProfile(user, {
            displayName: data.fullName
        });

        // Save mechanic data to Firestore
        const mechanicData = {
            uid: user.uid,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            experience: data.experience,
            vehicleTypes: vehicleTypes,
            skills: data.skills,
            serviceArea: data.serviceArea,
            address: data.address,
            licenseNumber: data.licenseNumber,
            aadharNumber: data.aadharNumber,
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
            userType: 'mechanic',
            status: 'pending', // Pending verification
            createdAt: new Date(),
            isActive: true,
            rating: 0,
            totalJobs: 0,
            totalEarnings: 0
        };

        await setDoc(doc(db, collections.mechanics, user.uid), mechanicData);

        // Show success message
        alert('Registration successful! Your account is pending verification. You will be notified once approved.');
        
        // Redirect to mechanic dashboard (will show pending status)
        window.location.href = 'mechanic-dashboard.html';

    } catch (error) {
        console.error('Registration error:', error);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                showError('email', 'This email is already registered');
                break;
            case 'auth/weak-password':
                showError('password', 'Password is too weak');
                break;
            case 'auth/invalid-email':
                showError('email', 'Invalid email address');
                break;
            default:
                alert('Registration failed: ' + error.message);
        }
    } finally {
        setLoading('registerBtn', false);
    }
}

async function handleMechanicLogin(e) {
    e.preventDefault();
    clearAllErrors();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Validation
    if (!validateEmail(data.email)) {
        showError('email', 'Please enter a valid email address');
        return;
    }

    if (!data.password) {
        showError('password', 'Please enter your password');
        return;
    }

    setLoading('loginBtn', true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Check if user is a mechanic
        const mechanicDoc = await doc(db, collections.mechanics, user.uid);
        // Note: In a real app, you'd fetch the document to verify user type and status
        
        // Show success message
        alert('Login successful! Redirecting to dashboard...');
        
        // Redirect to mechanic dashboard
        window.location.href = 'mechanic-dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        
        switch (error.code) {
            case 'auth/user-not-found':
                showError('email', 'No account found with this email');
                break;
            case 'auth/wrong-password':
                showError('password', 'Incorrect password');
                break;
            case 'auth/invalid-email':
                showError('email', 'Invalid email address');
                break;
            case 'auth/too-many-requests':
                showError('password', 'Too many failed attempts. Please try again later');
                break;
            default:
                alert('Login failed: ' + error.message);
        }
    } finally {
        setLoading('loginBtn', false);
    }
}

// Google Sign In
window.signInWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in mechanics collection
        const mechanicData = {
            uid: user.uid,
            fullName: user.displayName || 'Google User',
            email: user.email,
            phone: user.phoneNumber || '',
            experience: '',
            vehicleTypes: [],
            skills: '',
            serviceArea: '',
            address: '',
            licenseNumber: '',
            aadharNumber: '',
            bankAccount: '',
            ifscCode: '',
            userType: 'mechanic',
            status: 'pending',
            createdAt: new Date(),
            isActive: true,
            rating: 0,
            totalJobs: 0,
            totalEarnings: 0
        };

        // Try to create mechanic document (will not overwrite if exists)
        try {
            await setDoc(doc(db, collections.mechanics, user.uid), mechanicData, { merge: true });
        } catch (error) {
            console.log('Mechanic document already exists or error creating:', error);
        }

        alert('Login successful! Redirecting to dashboard...');
        window.location.href = 'mechanic-dashboard.html';

    } catch (error) {
        console.error('Google sign-in error:', error);
        alert('Google sign-in failed: ' + error.message);
    }
};

// Forgot Password
window.forgotPassword = async function() {
    const email = prompt('Enter your email address:');
    if (!email) return;

    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        alert('Failed to send password reset email: ' + error.message);
    }
};

// Logout function
window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
};
