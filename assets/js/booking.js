import { 
    auth, 
    db, 
    collections, 
    addDoc,
    collection,
    doc,
    setDoc,
    getCurrentUser
} from './firebase-config.js';

// Service data
const services = {
    bike: [
        { id: 'flat-tire', name: 'Flat Tire Repair', description: 'Puncture repair and tire replacement', price: 200, icon: 'fa-tire' },
        { id: 'battery-jumpstart', name: 'Battery Jumpstart', description: 'Battery charging and jumpstart service', price: 300, icon: 'fa-battery-half' },
        { id: 'chain-repair', name: 'Chain Repair', description: 'Chain cleaning, lubrication and repair', price: 150, icon: 'fa-link' },
        { id: 'brake-repair', name: 'Brake Repair', description: 'Brake pad replacement and adjustment', price: 400, icon: 'fa-hand-paper' },
        { id: 'engine-service', name: 'Engine Service', description: 'Engine oil change and basic service', price: 500, icon: 'fa-cog' },
        { id: 'electrical', name: 'Electrical Repair', description: 'Wiring and electrical component repair', price: 350, icon: 'fa-bolt' },
        { id: 'horn-repair', name: 'Horn Repair', description: 'Horn replacement and repair', price: 100, icon: 'fa-volume-up' },
        { id: 'lights', name: 'Lights Repair', description: 'Headlight and taillight repair', price: 200, icon: 'fa-lightbulb' }
    ],
    car: [
        { id: 'flat-tire', name: 'Flat Tire Repair', description: 'Puncture repair and tire replacement', price: 500, icon: 'fa-tire' },
        { id: 'battery-jumpstart', name: 'Battery Jumpstart', description: 'Battery charging and jumpstart service', price: 600, icon: 'fa-battery-half' },
        { id: 'oil-change', name: 'Oil Change', description: 'Engine oil and filter change', price: 800, icon: 'fa-oil-can' },
        { id: 'brake-repair', name: 'Brake Repair', description: 'Brake pad and disc replacement', price: 1200, icon: 'fa-hand-paper' },
        { id: 'ac-service', name: 'AC Service', description: 'Air conditioning repair and service', price: 1000, icon: 'fa-snowflake' },
        { id: 'electrical', name: 'Electrical Repair', description: 'Wiring and electrical component repair', price: 700, icon: 'fa-bolt' },
        { id: 'engine-service', name: 'Engine Service', description: 'Complete engine service and maintenance', price: 1500, icon: 'fa-cog' },
        { id: 'emergency-repair', name: 'Emergency Repair', description: 'On-the-spot emergency repairs', price: 2000, icon: 'fa-tools' }
    ]
};

let currentStep = 1;
let selectedVehicleType = '';
let selectedService = null;
let uploadedPhoto = null;
let bookingData = {};

// Initialize booking page
document.addEventListener('DOMContentLoaded', function() {
    initializeBooking();
    setupEventListeners();
});

function initializeBooking() {
    // Show first step
    showStep(1);
    
    // Setup vehicle selection
    setupVehicleSelection();
    
    // Setup photo upload
    setupPhotoUpload();
    
    // Setup location services
    setupLocationServices();
}

function setupEventListeners() {
    // Form submission
    const form = document.getElementById('serviceBookingForm');
    if (form) {
        form.addEventListener('submit', handleBookingSubmission);
    }
}

function setupVehicleSelection() {
    const vehicleOptions = document.querySelectorAll('.vehicle-option');
    vehicleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            vehicleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            
            // Get vehicle type
            selectedVehicleType = this.dataset.vehicle;
            bookingData.vehicleType = selectedVehicleType;
            
            // Load services for selected vehicle type
            loadServices(selectedVehicleType);
            
            // Clear service selection
            selectedService = null;
            
            // Enable next button
            enableNextButton();
        });
    });
}

function loadServices(vehicleType) {
    const serviceSelection = document.getElementById('serviceSelection');
    if (!serviceSelection) return;
    
    const vehicleServices = services[vehicleType] || [];
    
    serviceSelection.innerHTML = '';
    
    vehicleServices.forEach(service => {
        const serviceOption = document.createElement('div');
        serviceOption.className = 'service-option';
        serviceOption.dataset.serviceId = service.id;
        
        serviceOption.innerHTML = `
            <i class="fas ${service.icon}"></i>
            <div>
                <h4>${service.name}</h4>
                <p>${service.description}</p>
                <p class="service-price">₹${service.price}</p>
            </div>
        `;
        
        serviceOption.addEventListener('click', function() {
            // Remove previous selection
            document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            
            // Store selected service
            selectedService = service;
            bookingData.service = service;
            
            // Enable next button
            enableNextButton();
        });
        
        serviceSelection.appendChild(serviceOption);
    });
}

function setupPhotoUpload() {
    const photoUpload = document.getElementById('photoUpload');
    if (!photoUpload) return;
    
    photoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('photoPreview');
                const previewImage = document.getElementById('previewImage');
                
                if (preview && previewImage) {
                    previewImage.src = e.target.result;
                    preview.style.display = 'block';
                    uploadedPhoto = file;
                    bookingData.photo = file;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

function setupLocationServices() {
    // This would integrate with Google Maps API in a real implementation
    console.log('Location services setup - would integrate with Google Maps API');
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // In a real app, you'd reverse geocode to get address
                console.log('Current location:', lat, lng);
                
                // For demo, populate with mock data
                document.getElementById('address').value = '123 Main Street, City';
                document.getElementById('city').value = 'Mumbai';
                document.getElementById('pincode').value = '400001';
            },
            function(error) {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enter manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Make getCurrentLocation globally available
window.getCurrentLocation = getCurrentLocation;

function showStep(stepNumber) {
    // Hide all steps
    const steps = document.querySelectorAll('.booking-step');
    steps.forEach(step => step.classList.remove('active'));
    
    // Show current step
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    currentStep = stepNumber;
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Update summary if on confirmation step
    if (stepNumber === 6) {
        updateBookingSummary();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) {
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    }
    
    if (nextBtn) {
        nextBtn.style.display = currentStep < 6 ? 'block' : 'none';
    }
    
    if (submitBtn) {
        submitBtn.style.display = currentStep === 6 ? 'block' : 'none';
    }
}

function enableNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

function changeStep(direction) {
    if (direction === 1) {
        // Next step
        if (validateCurrentStep()) {
            if (currentStep < 6) {
                showStep(currentStep + 1);
            }
        }
    } else {
        // Previous step
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }
}

// Make changeStep globally available
window.changeStep = changeStep;

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            if (!selectedVehicleType) {
                showError('vehicleTypeError', 'Please select a vehicle type');
                return false;
            }
            clearError('vehicleTypeError');
            return true;
            
        case 2:
            if (!selectedService) {
                showError('serviceTypeError', 'Please select a service type');
                return false;
            }
            clearError('serviceTypeError');
            return true;
            
        case 4:
            return validateLocationStep();
            
        case 5:
            return validateDetailsStep();
            
        default:
            return true;
    }
}

function validateLocationStep() {
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const pincode = document.getElementById('pincode').value.trim();
    
    let isValid = true;
    
    if (!address || address.length < 10) {
        showError('addressError', 'Please enter a complete address');
        isValid = false;
    } else {
        clearError('addressError');
    }
    
    if (!city || city.length < 2) {
        showError('cityError', 'Please enter a valid city');
        isValid = false;
    } else {
        clearError('cityError');
    }
    
    if (!pincode || !/^\d{6}$/.test(pincode)) {
        showError('pincodeError', 'Please enter a valid 6-digit pincode');
        isValid = false;
    } else {
        clearError('pincodeError');
    }
    
    if (isValid) {
        bookingData.address = address;
        bookingData.city = city;
        bookingData.pincode = pincode;
        bookingData.landmark = document.getElementById('landmark').value.trim();
    }
    
    return isValid;
}

function validateDetailsStep() {
    const description = document.getElementById('description').value.trim();
    const urgency = document.getElementById('urgency').value;
    
    let isValid = true;
    
    if (!description || description.length < 10) {
        showError('descriptionError', 'Please provide a detailed description of the issue');
        isValid = false;
    } else {
        clearError('descriptionError');
    }
    
    if (!urgency) {
        showError('urgencyError', 'Please select urgency level');
        isValid = false;
    } else {
        clearError('urgencyError');
    }
    
    if (isValid) {
        bookingData.description = description;
        bookingData.urgency = urgency;
        bookingData.preferredTime = document.getElementById('preferredTime').value;
    }
    
    return isValid;
}

function updateBookingSummary() {
    // Update summary with collected data
    const summaryVehicleType = document.getElementById('summaryVehicleType');
    const summaryServiceType = document.getElementById('summaryServiceType');
    const summaryLocation = document.getElementById('summaryLocation');
    const summaryUrgency = document.getElementById('summaryUrgency');
    const summaryCost = document.getElementById('summaryCost');
    
    if (summaryVehicleType) {
        summaryVehicleType.textContent = selectedVehicleType.charAt(0).toUpperCase() + selectedVehicleType.slice(1);
    }
    
    if (summaryServiceType) {
        summaryServiceType.textContent = selectedService ? selectedService.name : '';
    }
    
    if (summaryLocation) {
        summaryLocation.textContent = `${bookingData.address}, ${bookingData.city} - ${bookingData.pincode}`;
    }
    
    if (summaryUrgency) {
        summaryUrgency.textContent = bookingData.urgency ? bookingData.urgency.charAt(0).toUpperCase() + bookingData.urgency.slice(1) : '';
    }
    
    if (summaryCost) {
        summaryCost.textContent = selectedService ? `₹${selectedService.price}` : '₹0';
    }
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

async function handleBookingSubmission(e) {
    e.preventDefault();
    
    if (!auth.currentUser) {
        alert('Please log in to book a service');
        window.location.href = 'customer-login.html';
        return;
    }
    
    // Create booking data
    const booking = {
        customerId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || 'Customer',
        vehicleType: bookingData.vehicleType,
        service: bookingData.service,
        address: bookingData.address,
        city: bookingData.city,
        pincode: bookingData.pincode,
        landmark: bookingData.landmark,
        description: bookingData.description,
        urgency: bookingData.urgency,
        preferredTime: bookingData.preferredTime,
        status: 'pending',
        createdAt: new Date(),
        estimatedCost: selectedService ? selectedService.price : 0,
        photoUrl: uploadedPhoto ? 'uploaded_photo_url' : null
    };
    
    try {
        // Add booking to Firestore
        const docRef = await addDoc(collection(db, collections.bookings), booking);
        
        // Store booking data for payment
        const bookingWithId = { ...booking, id: docRef.id };
        localStorage.setItem('bookingData', JSON.stringify(bookingWithId));
        
        // Redirect to payment page
        window.location.href = `payment.html?bookingId=${docRef.id}`;
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed: ' + error.message);
    }
}

function removePhoto() {
    const photoUpload = document.getElementById('photoUpload');
    const photoPreview = document.getElementById('photoPreview');
    
    if (photoUpload) photoUpload.value = '';
    if (photoPreview) photoPreview.style.display = 'none';
    
    uploadedPhoto = null;
    bookingData.photo = null;
}

// Make removePhoto globally available
window.removePhoto = removePhoto;
