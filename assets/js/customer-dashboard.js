import { 
    auth, 
    db, 
    collections, 
    onSnapshot,
    query,
    where,
    orderBy,
    collection,
    doc,
    updateDoc,
    getDocs
} from './firebase-config.js';

let currentUser = null;
let bookingsData = [];
let paymentsData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

async function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('userName').textContent = `Welcome, ${user.displayName || 'User'}`;
            await loadDashboardData();
        } else {
            window.location.href = 'customer-login.html';
        }
    });
}

function setupEventListeners() {
    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // History filters
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrderHistory);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterOrderHistory);
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => button.classList.remove('active'));
    
    const activeButton = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Make showSection globally available
window.showSection = showSection;

async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        // Load bookings
        await loadBookings();
        
        // Load payments
        await loadPayments();
        
        // Update statistics
        updateStatistics();
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadBookings() {
    try {
        const bookingsQuery = query(
            collection(db, collections.bookings),
            where('customerId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(bookingsQuery, (snapshot) => {
            bookingsData = [];
            snapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() });
            });
            
            updateBookingsDisplay();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadPayments() {
    try {
        const paymentsQuery = query(
            collection(db, collections.payments),
            where('customerId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(paymentsQuery, (snapshot) => {
            paymentsData = [];
            snapshot.forEach((doc) => {
                paymentsData.push({ id: doc.id, ...doc.data() });
            });
            
            updatePaymentsDisplay();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function updateBookingsDisplay() {
    // Update active bookings
    const activeBookingsList = document.getElementById('activeBookingsList');
    if (activeBookingsList) {
        const activeBookings = bookingsData.filter(booking => 
            ['pending', 'accepted', 'in-progress'].includes(booking.status)
        );
        
        activeBookingsList.innerHTML = '';
        
        if (activeBookings.length === 0) {
            activeBookingsList.innerHTML = '<p>No active bookings</p>';
        } else {
            activeBookings.forEach(booking => {
                const bookingCard = createBookingCard(booking);
                activeBookingsList.appendChild(bookingCard);
            });
        }
    }
    
    // Update order history
    updateOrderHistory();
}

function updateOrderHistory() {
    const orderHistoryList = document.getElementById('orderHistoryList');
    if (orderHistoryList) {
        orderHistoryList.innerHTML = '';
        
        if (bookingsData.length === 0) {
            orderHistoryList.innerHTML = '<p>No booking history</p>';
        } else {
            bookingsData.forEach(booking => {
                const historyCard = createHistoryCard(booking);
                orderHistoryList.appendChild(historyCard);
            });
        }
    }
}

function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = `booking-card ${booking.status}`;
    
    const statusText = {
        'pending': 'Pending',
        'accepted': 'Accepted',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${booking.service.name}</h3>
            <span class="card-status ${booking.status}">${statusText[booking.status]}</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Vehicle Type</span>
                <span class="value">${booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Location</span>
                <span class="value">${booking.city}</span>
            </div>
            <div class="card-detail">
                <span class="label">Urgency</span>
                <span class="value">${booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Estimated Cost</span>
                <span class="value">₹${booking.estimatedCost}</span>
            </div>
        </div>
        <div class="card-actions">
            ${booking.status === 'accepted' || booking.status === 'in-progress' ? 
                `<button class="btn-info" onclick="trackBooking('${booking.id}')">Track Service</button>` : 
                ''
            }
            ${booking.status === 'pending' ? 
                `<button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancel</button>` : 
                ''
            }
        </div>
    `;
    
    return card;
}

function createHistoryCard(booking) {
    const card = document.createElement('div');
    card.className = `history-card ${booking.status}`;
    
    const statusText = {
        'pending': 'Pending',
        'accepted': 'Accepted',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    
    const date = new Date(booking.createdAt.seconds * 1000).toLocaleDateString();
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${booking.service.name}</h3>
            <span class="card-status ${booking.status}">${statusText[booking.status]}</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Date</span>
                <span class="value">${date}</span>
            </div>
            <div class="card-detail">
                <span class="label">Vehicle Type</span>
                <span class="value">${booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Amount</span>
                <span class="value">₹${booking.estimatedCost}</span>
            </div>
        </div>
        <div class="card-actions">
            ${booking.status === 'completed' ? 
                `<button class="btn-info" onclick="downloadInvoice('${booking.id}')">Download Invoice</button>
                 <button class="btn-success" onclick="rateService('${booking.id}')">Rate Service</button>` : 
                ''
            }
        </div>
    `;
    
    return card;
}

function updatePaymentsDisplay() {
    const paymentsList = document.getElementById('paymentsList');
    if (paymentsList) {
        paymentsList.innerHTML = '';
        
        if (paymentsData.length === 0) {
            paymentsList.innerHTML = '<p>No payment history</p>';
        } else {
            paymentsData.forEach(payment => {
                const paymentCard = createPaymentCard(payment);
                paymentsList.appendChild(paymentCard);
            });
        }
    }
}

function createPaymentCard(payment) {
    const card = document.createElement('div');
    card.className = `payment-card`;
    
    const date = new Date(payment.createdAt.seconds * 1000).toLocaleDateString();
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Payment #${payment.id.slice(-8)}</h3>
            <span class="card-status ${payment.status}">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Amount</span>
                <span class="value">₹${payment.amount}</span>
            </div>
            <div class="card-detail">
                <span class="label">Method</span>
                <span class="value">${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Date</span>
                <span class="value">${date}</span>
            </div>
        </div>
    `;
    
    return card;
}

function updateStatistics() {
    // Total services
    const totalServices = bookingsData.length;
    const totalServicesElement = document.getElementById('totalServices');
    if (totalServicesElement) {
        totalServicesElement.textContent = totalServices;
    }
    
    // Active bookings
    const activeBookings = bookingsData.filter(booking => 
        ['pending', 'accepted', 'in-progress'].includes(booking.status)
    ).length;
    const activeBookingsElement = document.getElementById('activeBookings');
    if (activeBookingsElement) {
        activeBookingsElement.textContent = activeBookings;
    }
    
    // Average rating (mock data)
    const averageRating = 4.5;
    const averageRatingElement = document.getElementById('averageRating');
    if (averageRatingElement) {
        averageRatingElement.textContent = averageRating;
    }
    
    // Total spent
    const totalSpent = paymentsData
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);
    const totalSpentElement = document.getElementById('totalSpent');
    if (totalSpentElement) {
        totalSpentElement.textContent = `₹${totalSpent}`;
    }
}

function loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (recentActivity) {
        recentActivity.innerHTML = '';
        
        // Mock recent activity data
        const activities = [
            { icon: 'fa-tools', title: 'Service Completed', description: 'Flat tire repair completed', time: '2 hours ago' },
            { icon: 'fa-calendar', title: 'New Booking', description: 'Battery jumpstart service booked', time: '1 day ago' },
            { icon: 'fa-star', title: 'Rating Given', description: 'Rated mechanic 5 stars', time: '2 days ago' }
        ];
        
        activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <i class="fas ${activity.icon}"></i>
                <div>
                    <h4>${activity.title}</h4>
                    <p>${activity.description} • ${activity.time}</p>
                </div>
            `;
            recentActivity.appendChild(activityItem);
        });
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        // Update customer profile in Firestore
        const customerRef = doc(db, collections.customers, currentUser.uid);
        await updateDoc(customerRef, {
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
            city: data.city,
            pincode: data.pincode,
            updatedAt: new Date()
        });
        
        // Update Firebase Auth profile
        await currentUser.updateProfile({
            displayName: data.fullName
        });
        
        alert('Profile updated successfully!');
        
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Profile update failed: ' + error.message);
    }
}

function filterOrderHistory() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredBookings = [...bookingsData];
    
    // Filter by status
    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
    }
    
    // Filter by date
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBookings = filteredBookings.filter(booking => {
            const bookingDate = new Date(booking.createdAt.seconds * 1000);
            return bookingDate.toDateString() === filterDate.toDateString();
        });
    }
    
    // Update display
    const orderHistoryList = document.getElementById('orderHistoryList');
    if (orderHistoryList) {
        orderHistoryList.innerHTML = '';
        
        if (filteredBookings.length === 0) {
            orderHistoryList.innerHTML = '<p>No bookings found</p>';
        } else {
            filteredBookings.forEach(booking => {
                const historyCard = createHistoryCard(booking);
                orderHistoryList.appendChild(historyCard);
            });
        }
    }
}

// Global functions
window.trackBooking = function(bookingId) {
    // Open tracking modal
    const modal = document.getElementById('trackingModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Initialize map (mock implementation)
        initializeTrackingMap();
    }
};

window.cancelBooking = async function(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            const bookingRef = doc(db, collections.bookings, bookingId);
            await updateDoc(bookingRef, {
                status: 'cancelled',
                cancelledAt: new Date()
            });
            
            alert('Booking cancelled successfully');
        } catch (error) {
            console.error('Cancel booking error:', error);
            alert('Failed to cancel booking: ' + error.message);
        }
    }
};

window.downloadInvoice = function(bookingId) {
    // Mock invoice download
    alert('Invoice download started');
};

window.rateService = function(bookingId) {
    const rating = prompt('Rate the service (1-5 stars):');
    if (rating && rating >= 1 && rating <= 5) {
        // In a real app, you'd save the rating to Firestore
        alert(`Thank you for rating ${rating} stars!`);
    }
};

window.closeTrackingModal = function() {
    const modal = document.getElementById('trackingModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function initializeTrackingMap() {
    // Mock map initialization
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.innerHTML = '<div style="height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666;">Map would be loaded here with Google Maps API</div>';
    }
}

window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
};
