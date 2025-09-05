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
let customersData = [];
let mechanicsData = [];
let bookingsData = [];
let paymentsData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    initializeCharts();
});

async function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('userName').textContent = `Welcome, ${user.displayName || 'Admin'}`;
            await loadDashboardData();
        } else {
            // In a real app, you'd check if user is admin
            window.location.href = 'index.html';
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
    
    // Search functionality
    const searchInputs = document.querySelectorAll('input[id$="Search"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const tableType = this.id.replace('Search', '');
            filterTable(tableType);
        });
    });
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('select[id$="Filter"]');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            const tableType = this.id.replace('Filter', '');
            filterTable(tableType);
        });
    });
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
    try {
        // Load all data
        await Promise.all([
            loadCustomers(),
            loadMechanics(),
            loadBookings(),
            loadPayments()
        ]);
        
        // Update statistics
        updateStatistics();
        
        // Update charts
        updateCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadCustomers() {
    try {
        const customersQuery = query(collection(db, collections.customers));
        
        onSnapshot(customersQuery, (snapshot) => {
            customersData = [];
            snapshot.forEach((doc) => {
                customersData.push({ id: doc.id, ...doc.data() });
            });
            
            updateCustomersTable();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function loadMechanics() {
    try {
        const mechanicsQuery = query(collection(db, collections.mechanics));
        
        onSnapshot(mechanicsQuery, (snapshot) => {
            mechanicsData = [];
            snapshot.forEach((doc) => {
                mechanicsData.push({ id: doc.id, ...doc.data() });
            });
            
            updateMechanicsTable();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading mechanics:', error);
    }
}

async function loadBookings() {
    try {
        const bookingsQuery = query(
            collection(db, collections.bookings),
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(bookingsQuery, (snapshot) => {
            bookingsData = [];
            snapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() });
            });
            
            updateBookingsTable();
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
            orderBy('createdAt', 'desc')
        );
        
        onSnapshot(paymentsQuery, (snapshot) => {
            paymentsData = [];
            snapshot.forEach((doc) => {
                paymentsData.push({ id: doc.id, ...doc.data() });
            });
            
            updatePaymentsTable();
            updateStatistics();
        });
        
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function updateCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    customersData.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.fullName || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.city || 'N/A'}</td>
            <td>
                <span class="card-status ${customer.isActive ? 'completed' : 'cancelled'}">
                    ${customer.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn-info" onclick="viewCustomer('${customer.id}')">View</button>
                <button class="btn-danger" onclick="toggleCustomerStatus('${customer.id}', ${!customer.isActive})">
                    ${customer.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateMechanicsTable() {
    const tbody = document.getElementById('mechanicsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    mechanicsData.forEach(mechanic => {
        const statusClass = {
            'pending': 'pending',
            'verified': 'completed',
            'rejected': 'cancelled'
        }[mechanic.status] || 'pending';
        
        const statusText = {
            'pending': 'Pending',
            'verified': 'Verified',
            'rejected': 'Rejected'
        }[mechanic.status] || 'Unknown';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mechanic.fullName || 'N/A'}</td>
            <td>${mechanic.email || 'N/A'}</td>
            <td>${mechanic.phone || 'N/A'}</td>
            <td>${mechanic.experience || 'N/A'}</td>
            <td>${mechanic.serviceArea || 'N/A'}</td>
            <td>
                <span class="card-status ${statusClass}">${statusText}</span>
            </td>
            <td>
                ${mechanic.status === 'pending' ? 
                    `<button class="btn-success" onclick="verifyMechanic('${mechanic.id}', true)">Approve</button>
                     <button class="btn-danger" onclick="verifyMechanic('${mechanic.id}', false)">Reject</button>` :
                    `<button class="btn-info" onclick="viewMechanic('${mechanic.id}')">View</button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    bookingsData.forEach(booking => {
        const statusClass = {
            'pending': 'pending',
            'accepted': 'completed',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'cancelled': 'cancelled'
        }[booking.status] || 'pending';
        
        const statusText = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        }[booking.status] || 'Unknown';
        
        const date = new Date(booking.createdAt.seconds * 1000).toLocaleDateString();
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id.slice(-8)}</td>
            <td>${booking.customerName || 'Customer'}</td>
            <td>${booking.service?.name || 'Service'}</td>
            <td>${booking.city || 'N/A'}</td>
            <td>${booking.mechanicName || 'Not Assigned'}</td>
            <td>
                <span class="card-status ${statusClass}">${statusText}</span>
            </td>
            <td>₹${booking.estimatedCost || 0}</td>
            <td>
                <button class="btn-info" onclick="viewBooking('${booking.id}')">View</button>
                ${booking.status === 'pending' ? 
                    `<button class="btn-danger" onclick="cancelBooking('${booking.id}')">Cancel</button>` : 
                    ''
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    paymentsData.forEach(payment => {
        const statusClass = {
            'pending': 'pending',
            'completed': 'completed',
            'failed': 'cancelled'
        }[payment.status] || 'pending';
        
        const statusText = {
            'pending': 'Pending',
            'completed': 'Completed',
            'failed': 'Failed'
        }[payment.status] || 'Unknown';
        
        const date = new Date(payment.createdAt.seconds * 1000).toLocaleDateString();
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.id.slice(-8)}</td>
            <td>${payment.customerName || 'Customer'}</td>
            <td>₹${payment.amount || 0}</td>
            <td>${payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1) || 'N/A'}</td>
            <td>
                <span class="card-status ${statusClass}">${statusText}</span>
            </td>
            <td>${date}</td>
            <td>
                <button class="btn-info" onclick="viewPayment('${payment.id}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStatistics() {
    // Total customers
    const totalCustomers = customersData.length;
    const totalCustomersElement = document.getElementById('totalCustomers');
    if (totalCustomersElement) {
        totalCustomersElement.textContent = totalCustomers;
    }
    
    // Total mechanics
    const totalMechanics = mechanicsData.length;
    const totalMechanicsElement = document.getElementById('totalMechanics');
    if (totalMechanicsElement) {
        totalMechanicsElement.textContent = totalMechanics;
    }
    
    // Active bookings
    const activeBookings = bookingsData.filter(booking => 
        ['pending', 'accepted', 'in-progress'].includes(booking.status)
    ).length;
    const activeBookingsElement = document.getElementById('activeBookings');
    if (activeBookingsElement) {
        activeBookingsElement.textContent = activeBookings;
    }
    
    // Total revenue
    const totalRevenue = paymentsData
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `₹${totalRevenue}`;
    }
}

function filterTable(tableType) {
    const searchInput = document.getElementById(`${tableType}Search`);
    const statusFilter = document.getElementById(`${tableType}StatusFilter`);
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilterValue = statusFilter.value;
    
    let filteredData = [];
    
    switch (tableType) {
        case 'user':
            filteredData = customersData;
            break;
        case 'mechanic':
            filteredData = mechanicsData;
            break;
        case 'booking':
            filteredData = bookingsData;
            break;
        case 'payment':
            filteredData = paymentsData;
            break;
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredData = filteredData.filter(item => {
            return Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(searchTerm)
            );
        });
    }
    
    // Apply status filter
    if (statusFilterValue !== 'all') {
        filteredData = filteredData.filter(item => {
            if (tableType === 'user') {
                return statusFilterValue === 'active' ? item.isActive : !item.isActive;
            } else {
                return item.status === statusFilterValue;
            }
        });
    }
    
    // Update table display
    updateFilteredTable(tableType, filteredData);
}

function updateFilteredTable(tableType, data) {
    // This would update the specific table with filtered data
    // For now, we'll just log the filtered data
    console.log(`Filtered ${tableType} data:`, data);
}

function initializeCharts() {
    // Initialize Chart.js charts
    if (typeof Chart !== 'undefined') {
        initializeBookingsChart();
        initializeRevenueChart();
        initializePeakHoursChart();
        initializeServicesChart();
        initializeAreasChart();
        initializeMonthlyRevenueChart();
    }
}

function initializeBookingsChart() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending', 'Cancelled'],
            datasets: [{
                data: [45, 15, 25, 15],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initializePeakHoursChart() {
    const ctx = document.getElementById('peakHoursChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
            datasets: [{
                label: 'Bookings',
                data: [5, 15, 25, 20, 30, 10],
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initializeServicesChart() {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Flat Tire', 'Battery', 'Oil Change', 'Brake', 'AC Service'],
            datasets: [{
                label: 'Bookings',
                data: [35, 25, 20, 15, 10],
                backgroundColor: '#10B981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initializeAreasChart() {
    const ctx = document.getElementById('areasChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Others'],
            datasets: [{
                data: [30, 25, 20, 15, 10],
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function initializeMonthlyRevenueChart() {
    const ctx = document.getElementById('monthlyRevenueChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [50000, 75000, 60000, 90000, 85000, 120000],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateCharts() {
    // Update charts with real data
    // This would be called when data changes
}

// Global functions
window.viewCustomer = function(customerId) {
    alert(`View customer details for ID: ${customerId}`);
};

window.toggleCustomerStatus = async function(customerId, isActive) {
    try {
        const customerRef = doc(db, collections.customers, customerId);
        await updateDoc(customerRef, {
            isActive: isActive,
            updatedAt: new Date()
        });
        
        alert(`Customer ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
        console.error('Toggle customer status error:', error);
        alert('Failed to update customer status: ' + error.message);
    }
};

window.viewMechanic = function(mechanicId) {
    alert(`View mechanic details for ID: ${mechanicId}`);
};

window.verifyMechanic = async function(mechanicId, approved) {
    try {
        const mechanicRef = doc(db, collections.mechanics, mechanicId);
        await updateDoc(mechanicRef, {
            status: approved ? 'verified' : 'rejected',
            verifiedAt: new Date(),
            verifiedBy: currentUser.uid
        });
        
        alert(`Mechanic ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
        console.error('Verify mechanic error:', error);
        alert('Failed to verify mechanic: ' + error.message);
    }
};

window.viewBooking = function(bookingId) {
    alert(`View booking details for ID: ${bookingId}`);
};

window.cancelBooking = async function(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            const bookingRef = doc(db, collections.bookings, bookingId);
            await updateDoc(bookingRef, {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: currentUser.uid
            });
            
            alert('Booking cancelled successfully');
        } catch (error) {
            console.error('Cancel booking error:', error);
            alert('Failed to cancel booking: ' + error.message);
        }
    }
};

window.viewPayment = function(paymentId) {
    alert(`View payment details for ID: ${paymentId}`);
};

window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
};
