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
    getDoc,
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

// Customer Registration
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('customerRegisterForm');
    const loginForm = document.getElementById('customerLoginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleCustomerRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleCustomerLogin);
    }
});

async function handleCustomerRegister(e) {
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

    if (!data.address || data.address.trim().length < 10) {
        showError('address', 'Please enter a complete address');
        isValid = false;
    }

    if (!data.city || data.city.trim().length < 2) {
        showError('city', 'Please enter a valid city');
        isValid = false;
    }

    if (!data.pincode || !/^\d{6}$/.test(data.pincode)) {
        showError('pincode', 'Please enter a valid 6-digit pincode');
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

        // Save customer data to Firestore
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

        // Show success message
        alert('Registration successful! Redirecting to dashboard...');
        
        // Redirect to customer dashboard
        window.location.href = 'customer-dashboard.html';

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

async function handleCustomerLogin(e) {
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

        const isCustomer = await isCustomerUser(user.uid);

        if (isCustomer) {
            alert('Login successful! Redirecting to dashboard...');
            window.location.href = 'customer-dashboard.html';
        } else {
            alert('Access denied. Not a customer account.');
            await auth.signOut();
        }

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

async function isCustomerUser(uid) {
    try {
        const userDocRef = doc(db, 'customers', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().userType === 'customer') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking customer status:', error);
        return false;
    }
}

// Google Sign In
window.signInWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in customers collection
        const customerData = {
            uid: user.uid,
            fullName: user.displayName || 'Google User',
            email: user.email,
            phone: user.phoneNumber || '',
            address: '',
            city: '',
            pincode: '',
            userType: 'customer',
            createdAt: new Date(),
            isActive: true
        };

        // Try to create customer document (will not overwrite if exists)
        try {
            await setDoc(doc(db, collections.customers, user.uid), customerData, { merge: true });
        } catch (error) {
            console.log('Customer document already exists or error creating:', error);
        }

        alert('Login successful! Redirecting to dashboard...');
        window.location.href = 'customer-dashboard.html';

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
