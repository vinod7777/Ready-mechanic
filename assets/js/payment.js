import { 
    auth, 
    db, 
    collections, 
    addDoc,
    collection,
    doc,
    updateDoc
} from './firebase-config.js';

let currentUser = null;
let bookingData = null;

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadBookingData();
    setupEventListeners();
});

async function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
        } else {
            window.location.href = 'customer-login.html';
        }
    });
}

function loadBookingData() {
    // Get booking data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (bookingId) {
        // Load booking data from Firestore
        loadBookingFromFirestore(bookingId);
    } else {
        // Load from localStorage (for demo)
        const storedData = localStorage.getItem('bookingData');
        if (storedData) {
            bookingData = JSON.parse(storedData);
            updatePaymentSummary();
        } else {
            // Mock data for demo
            bookingData = {
                service: { name: 'Flat Tire Repair', price: 500 },
                vehicleType: 'bike',
                city: 'Mumbai',
                urgency: 'high',
                estimatedCost: 500
            };
            updatePaymentSummary();
        }
    }
}

async function loadBookingFromFirestore(bookingId) {
    try {
        // In a real app, you'd fetch the booking document
        console.log('Loading booking:', bookingId);
        // For now, use mock data
        bookingData = {
            service: { name: 'Flat Tire Repair', price: 500 },
            vehicleType: 'bike',
            city: 'Mumbai',
            urgency: 'high',
            estimatedCost: 500
        };
        updatePaymentSummary();
    } catch (error) {
        console.error('Error loading booking:', error);
        alert('Error loading booking data');
    }
}

function updatePaymentSummary() {
    if (!bookingData) return;
    
    const serviceType = document.getElementById('serviceType');
    const vehicleType = document.getElementById('vehicleType');
    const serviceLocation = document.getElementById('serviceLocation');
    const urgency = document.getElementById('urgency');
    const totalAmount = document.getElementById('totalAmount');
    
    if (serviceType) serviceType.textContent = bookingData.service.name;
    if (vehicleType) vehicleType.textContent = bookingData.vehicleType.charAt(0).toUpperCase() + bookingData.vehicleType.slice(1);
    if (serviceLocation) serviceLocation.textContent = bookingData.city;
    if (urgency) urgency.textContent = bookingData.urgency.charAt(0).toUpperCase() + bookingData.urgency.slice(1);
    if (totalAmount) totalAmount.textContent = `₹${bookingData.estimatedCost}`;
}

function setupEventListeners() {
    // Payment method selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.dataset.method;
            showPaymentDetails(method);
        });
    });
    
    // Form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
    
    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', formatCardNumber);
    }
    
    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', formatExpiryDate);
    }
    
    // CVV validation
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', validateCVV);
    }
}

function showPaymentDetails(method) {
    // Hide all payment details
    const allDetails = document.querySelectorAll('.payment-details');
    allDetails.forEach(detail => detail.style.display = 'none');
    
    // Show selected payment details
    const selectedDetails = document.getElementById(method + 'Details');
    if (selectedDetails) {
        selectedDetails.style.display = 'block';
    }
}

function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
}

function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
}

function validateCVV(e) {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value.substring(0, 3);
}

async function handlePayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentMethod = formData.get('paymentMethod');
    
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    // Validate payment details based on method
    if (!validatePaymentDetails(paymentMethod, formData)) {
        return;
    }
    
    setLoading('payBtn', true);
    
    try {
        // Process payment
        const paymentResult = await processPayment(paymentMethod, formData);
        
        if (paymentResult.success) {
            // Save payment record
            await savePaymentRecord(paymentMethod, paymentResult);
            
            // Update booking status
            if (bookingData.id) {
                await updateBookingStatus(bookingData.id);
            }
            
            // Show success modal
            showPaymentSuccess(paymentResult.transactionId);
            
        } else {
            throw new Error(paymentResult.error || 'Payment failed');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    } finally {
        setLoading('payBtn', false);
    }
}

function validatePaymentDetails(method, formData) {
    switch (method) {
        case 'upi':
            const upiId = formData.get('upiId');
            if (!upiId || !isValidUPI(upiId)) {
                alert('Please enter a valid UPI ID');
                return false;
            }
            break;
            
        case 'card':
            const cardNumber = formData.get('cardNumber');
            const expiryDate = formData.get('expiryDate');
            const cvv = formData.get('cvv');
            const cardName = formData.get('cardName');
            
            if (!cardNumber || !isValidCardNumber(cardNumber)) {
                alert('Please enter a valid card number');
                return false;
            }
            if (!expiryDate || !isValidExpiryDate(expiryDate)) {
                alert('Please enter a valid expiry date');
                return false;
            }
            if (!cvv || !isValidCVV(cvv)) {
                alert('Please enter a valid CVV');
                return false;
            }
            if (!cardName || cardName.trim().length < 2) {
                alert('Please enter the name on card');
                return false;
            }
            break;
            
        case 'wallet':
            const walletType = formData.get('walletType');
            const walletNumber = formData.get('walletNumber');
            
            if (!walletType) {
                alert('Please select a wallet type');
                return false;
            }
            if (!walletNumber || walletNumber.trim().length < 5) {
                alert('Please enter a valid wallet number');
                return false;
            }
            break;
            
        case 'cod':
            // No validation needed for COD
            break;
    }
    
    return true;
}

function isValidUPI(upiId) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return upiRegex.test(upiId);
}

function isValidCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19;
}

function isValidExpiryDate(expiryDate) {
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    return expMonth >= 1 && expMonth <= 12 && 
           (expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth));
}

function isValidCVV(cvv) {
    return cvv.length === 3 && /^\d{3}$/.test(cvv);
}

async function processPayment(method, formData) {
    // Mock payment processing
    // In a real app, this would integrate with payment gateways like Razorpay, Stripe, etc.
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate payment processing
            const success = Math.random() > 0.1; // 90% success rate for demo
            
            if (success) {
                resolve({
                    success: true,
                    transactionId: 'TXN' + Date.now(),
                    amount: bookingData.estimatedCost,
                    method: method
                });
            } else {
                resolve({
                    success: false,
                    error: 'Payment gateway temporarily unavailable'
                });
            }
        }, 2000); // Simulate network delay
    });
}

async function savePaymentRecord(method, paymentResult) {
    try {
        const paymentData = {
            customerId: currentUser.uid,
            bookingId: bookingData.id || 'demo-booking',
            amount: paymentResult.amount,
            method: method,
            status: 'completed',
            transactionId: paymentResult.transactionId,
            createdAt: new Date()
        };
        
        await addDoc(collection(db, collections.payments), paymentData);
        
    } catch (error) {
        console.error('Error saving payment record:', error);
        throw error;
    }
}

async function updateBookingStatus(bookingId) {
    try {
        const bookingRef = doc(db, collections.bookings, bookingId);
        await updateDoc(bookingRef, {
            status: 'payment_completed',
            paymentCompletedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating booking status:', error);
        // Don't throw error as payment is already successful
    }
}

function showPaymentSuccess(transactionId) {
    const modal = document.getElementById('paymentSuccessModal');
    const transactionIdElement = document.getElementById('transactionId');
    
    if (transactionIdElement) {
        transactionIdElement.textContent = transactionId;
    }
    
    if (modal) {
        modal.style.display = 'block';
    }
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

// Global functions
window.goBack = function() {
    window.history.back();
};

window.goToDashboard = function() {
    window.location.href = 'customer-dashboard.html';
};

// UPI App buttons
document.addEventListener('DOMContentLoaded', function() {
    const appButtons = document.querySelectorAll('.app-btn');
    appButtons.forEach(button => {
        button.addEventListener('click', function() {
            const app = this.dataset.app;
            handleUPIApp(app);
        });
    });
});

function handleUPIApp(app) {
    const upiId = document.getElementById('upiId').value;
    if (!upiId) {
        alert('Please enter your UPI ID first');
        return;
    }
    
    // In a real app, this would open the respective UPI app
    const apps = {
        'phonepe': 'PhonePe',
        'gpay': 'Google Pay',
        'paytm': 'Paytm'
    };
    
    alert(`Opening ${apps[app]} for UPI payment...`);
    
    // Simulate UPI app opening
    setTimeout(() => {
        // In a real app, you'd handle the UPI app response
        alert('UPI payment completed successfully!');
        showPaymentSuccess('UPI' + Date.now());
    }, 2000);
}
