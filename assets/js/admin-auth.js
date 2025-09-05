import { 
    auth, 
    db,
    doc,
    getDoc,
    signInWithEmailAndPassword 
} from './firebase-config.js';

// Form validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// Admin Login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
});

async function handleAdminLogin(e) {
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

        const isAdmin = await isAdminUser(user.uid);

        if (isAdmin) {
            alert('Login successful! Redirecting to admin dashboard...');
            window.location.href = 'admin-dashboard.html';
        } else {
            alert('Access denied. Admin privileges required.');
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

async function isAdminUser(uid) {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

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
