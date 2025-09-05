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
let earningsData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

async function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('userName').textContent = `Welcome, ${user.displayName || 'Mechanic'}`;
            await loadDashboardData();
        } else {
            window.location.href = 'mechanic-login.html';
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
        // Load service requests
        await loadServiceRequests();
        
        // Load active jobs
        await loadActiveJobs();
        
        // Load earnings
        await loadEarnings();
        
        // Update statistics
        updateStatistics();
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadServiceRequests() {
    try {
        const requestsQuery = query(
            collection(db, collections.bookings),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(requestsQuery, (snapshot) => {
            const requestsList = document.getElementById('serviceRequestsList');
            if (requestsList) {
                requestsList.innerHTML = '';
                
                if (snapshot.empty) {
                    requestsList.innerHTML = '<p>No new service requests</p>';
                } else {
                    snapshot.forEach((doc) => {
                        const request = { id: doc.id, ...doc.data() };
                        const requestCard = createRequestCard(request);
                        requestsList.appendChild(requestCard);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading service requests:', error);
    }
}

async function loadActiveJobs() {
    try {
        const jobsQuery = query(
            collection(db, collections.bookings),
            where('mechanicId', '==', currentUser.uid),
            where('status', 'in', ['accepted', 'in-progress']),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(jobsQuery, (snapshot) => {
            const activeJobsList = document.getElementById('activeJobsList');
            if (activeJobsList) {
                activeJobsList.innerHTML = '';
                
                if (snapshot.empty) {
                    activeJobsList.innerHTML = '<p>No active jobs</p>';
                } else {
                    snapshot.forEach((doc) => {
                        const job = { id: doc.id, ...doc.data() };
                        const jobCard = createJobCard(job);
                        activeJobsList.appendChild(jobCard);
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading active jobs:', error);
    }
}

async function loadEarnings() {
    try {
        const earningsQuery = query(
            collection(db, collections.payments),
            where('mechanicId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(earningsQuery, (snapshot) => {
            earningsData = [];
            snapshot.forEach((doc) => {
                earningsData.push({ id: doc.id, ...doc.data() });
            });
            
            updateEarningsDisplay();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading earnings:', error);
    }
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    
    const date = new Date(request.createdAt.seconds * 1000).toLocaleDateString();
    const time = new Date(request.createdAt.seconds * 1000).toLocaleTimeString();
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${request.service.name}</h3>
            <span class="card-status pending">New Request</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Vehicle Type</span>
                <span class="value">${request.vehicleType.charAt(0).toUpperCase() + request.vehicleType.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Location</span>
                <span class="value">${request.city}</span>
            </div>
            <div class="card-detail">
                <span class="label">Urgency</span>
                <span class="value">${request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}</span>
            </div>
            <div class="card-detail">
                <span class="label">Estimated Cost</span>
                <span class="value">₹${request.estimatedCost}</span>
            </div>
            <div class="card-detail">
                <span class="label">Requested At</span>
                <span class="value">${date} ${time}</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="btn-info" onclick="viewRequestDetails('${request.id}')">View Details</button>
            <button class="btn-success" onclick="acceptRequest('${request.id}')">Accept</button>
            <button class="btn-danger" onclick="rejectRequest('${request.id}')">Reject</button>
        </div>
    `;
    
    return card;
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = `job-card ${job.status}`;
    
    const statusText = {
        'accepted': 'Accepted',
        'in-progress': 'In Progress',
        'completed': 'Completed'
    };
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${job.service.name}</h3>
            <span class="card-status ${job.status}">${statusText[job.status]}</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Customer</span>
                <span class="value">${job.customerName || 'Customer'}</span>
            </div>
            <div class="card-detail">
                <span class="label">Location</span>
                <span class="value">${job.city}</span>
            </div>
            <div class="card-detail">
                <span class="label">Amount</span>
                <span class="value">₹${job.estimatedCost}</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="btn-info" onclick="updateJobStatus('${job.id}')">Update Status</button>
            <button class="btn-success" onclick="navigateToJob('${job.id}')">Navigate</button>
        </div>
    `;
    
    return card;
}

function updateEarningsDisplay() {
    const earningsList = document.getElementById('earningsList');
    if (earningsList) {
        earningsList.innerHTML = '';
        
        if (earningsData.length === 0) {
            earningsList.innerHTML = '<p>No earnings yet</p>';
        } else {
            earningsData.forEach(earning => {
                const earningCard = createEarningCard(earning);
                earningsList.appendChild(earningCard);
            });
        }
    }
    
    // Update earnings summary
    updateEarningsSummary();
}

function createEarningCard(earning) {
    const card = document.createElement('div');
    card.className = 'payment-card';
    
    const date = new Date(earning.createdAt.seconds * 1000).toLocaleDateString();
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Earning #${earning.id.slice(-8)}</h3>
            <span class="card-status ${earning.status}">${earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}</span>
        </div>
        <div class="card-details">
            <div class="card-detail">
                <span class="label">Amount</span>
                <span class="value">₹${earning.amount}</span>
            </div>
            <div class="card-detail">
                <span class="label">Service</span>
                <span class="value">${earning.serviceName || 'Service'}</span>
            </div>
            <div class="card-detail">
                <span class="label">Date</span>
                <span class="value">${date}</span>
            </div>
        </div>
    `;
    
    return card;
}

function updateEarningsSummary() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todayEarnings = earningsData
        .filter(earning => new Date(earning.createdAt.seconds * 1000) >= startOfDay)
        .reduce((sum, earning) => sum + earning.amount, 0);
    
    const weekEarnings = earningsData
        .filter(earning => new Date(earning.createdAt.seconds * 1000) >= startOfWeek)
        .reduce((sum, earning) => sum + earning.amount, 0);
    
    const monthEarnings = earningsData
        .filter(earning => new Date(earning.createdAt.seconds * 1000) >= startOfMonth)
        .reduce((sum, earning) => sum + earning.amount, 0);
    
    const todayEarningsElement = document.getElementById('todayEarnings');
    const weekEarningsElement = document.getElementById('weekEarnings');
    const monthEarningsElement = document.getElementById('monthEarnings');
    
    if (todayEarningsElement) todayEarningsElement.textContent = `₹${todayEarnings}`;
    if (weekEarningsElement) weekEarningsElement.textContent = `₹${weekEarnings}`;
    if (monthEarningsElement) monthEarningsElement.textContent = `₹${monthEarnings}`;
}

function updateStatistics() {
    // Total jobs
    const totalJobs = bookingsData.length;
    const totalJobsElement = document.getElementById('totalJobs');
    if (totalJobsElement) {
        totalJobsElement.textContent = totalJobs;
    }
    
    // Active jobs
    const activeJobs = bookingsData.filter(booking => 
        ['accepted', 'in-progress'].includes(booking.status)
    ).length;
    const activeJobsElement = document.getElementById('activeJobs');
    if (activeJobsElement) {
        activeJobsElement.textContent = activeJobs;
    }
    
    // Average rating (mock data)
    const averageRating = 4.7;
    const averageRatingElement = document.getElementById('averageRating');
    if (averageRatingElement) {
        averageRatingElement.textContent = averageRating;
    }
    
    // Total earnings
    const totalEarnings = earningsData
        .filter(earning => earning.status === 'completed')
        .reduce((sum, earning) => sum + earning.amount, 0);
    const totalEarningsElement = document.getElementById('totalEarnings');
    if (totalEarningsElement) {
        totalEarningsElement.textContent = `₹${totalEarnings}`;
    }
}

function loadRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    if (recentActivity) {
        recentActivity.innerHTML = '';
        
        // Mock recent activity data
        const activities = [
            { icon: 'fa-tools', title: 'Job Completed', description: 'Flat tire repair completed', time: '1 hour ago' },
            { icon: 'fa-bell', title: 'New Request', description: 'Battery jumpstart service requested', time: '2 hours ago' },
            { icon: 'fa-star', title: 'Rating Received', description: 'Received 5 star rating', time: '1 day ago' }
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
        // Update mechanic profile in Firestore
        const mechanicRef = doc(db, collections.mechanics, currentUser.uid);
        await updateDoc(mechanicRef, {
            fullName: data.fullName,
            phone: data.phone,
            experience: data.experience,
            skills: data.skills,
            serviceArea: data.serviceArea,
            address: data.address,
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
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

// Global functions
window.viewRequestDetails = function(requestId) {
    // Open job details modal
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Load request details (mock implementation)
        loadRequestDetails(requestId);
    }
};

window.acceptRequest = async function(requestId) {
    if (confirm('Are you sure you want to accept this request?')) {
        try {
            const requestRef = doc(db, collections.bookings, requestId);
            await updateDoc(requestRef, {
                status: 'accepted',
                mechanicId: currentUser.uid,
                acceptedAt: new Date()
            });
            
            alert('Request accepted successfully!');
        } catch (error) {
            console.error('Accept request error:', error);
            alert('Failed to accept request: ' + error.message);
        }
    }
};

window.rejectRequest = async function(requestId) {
    if (confirm('Are you sure you want to reject this request?')) {
        try {
            const requestRef = doc(db, collections.bookings, requestId);
            await updateDoc(requestRef, {
                status: 'rejected',
                mechanicId: currentUser.uid,
                rejectedAt: new Date()
            });
            
            alert('Request rejected');
        } catch (error) {
            console.error('Reject request error:', error);
            alert('Failed to reject request: ' + error.message);
        }
    }
};

window.updateJobStatus = function(jobId) {
    // Open status update modal
    const modal = document.getElementById('statusModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Store current job ID
        modal.dataset.jobId = jobId;
    }
};

window.navigateToJob = function(jobId) {
    // In a real app, this would open Google Maps with navigation
    alert('Opening navigation to job location...');
};

window.acceptJob = function() {
    // This would be called from the job details modal
    alert('Job accepted!');
    closeJobModal();
};

window.rejectJob = function() {
    // This would be called from the job details modal
    alert('Job rejected!');
    closeJobModal();
};

window.updateStatus = async function(status) {
    const modal = document.getElementById('statusModal');
    const jobId = modal.dataset.jobId;
    
    if (!jobId) return;
    
    try {
        const jobRef = doc(db, collections.bookings, jobId);
        await updateDoc(jobRef, {
            status: status,
            updatedAt: new Date()
        });
        
        alert('Status updated successfully!');
        closeStatusModal();
    } catch (error) {
        console.error('Update status error:', error);
        alert('Failed to update status: ' + error.message);
    }
};

window.closeJobModal = function() {
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.closeStatusModal = function() {
    const modal = document.getElementById('statusModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function loadRequestDetails(requestId) {
    // Mock implementation - in a real app, you'd fetch the request details
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');
    const customerAddress = document.getElementById('customerAddress');
    const serviceType = document.getElementById('serviceType');
    const vehicleType = document.getElementById('vehicleType');
    const description = document.getElementById('description');
    const urgency = document.getElementById('urgency');
    
    if (customerName) customerName.textContent = 'John Doe';
    if (customerPhone) customerPhone.textContent = '+91 9876543210';
    if (customerAddress) customerAddress.textContent = '123 Main St, City';
    if (serviceType) serviceType.textContent = 'Flat Tire Repair';
    if (vehicleType) vehicleType.textContent = 'Bike';
    if (description) description.textContent = 'Tire puncture on rear wheel';
    if (urgency) urgency.textContent = 'High';
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
