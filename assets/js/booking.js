import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const navUserName = document.getElementById('navUserName');
    const logoutBtn = document.getElementById('logoutBtn');

    const bookingForm = document.getElementById('bookingForm');
    const steps = document.querySelectorAll('.booking-step');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    let currentUser = null;
    let customerData = null;
    let currentStep = 0;
    let selectedMechanicId = null;
    let selectedVehicleType = null;

    // --- Authentication and Initial Data Load ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const userDocRef = doc(db, 'customers', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                customerData = userDoc.data();
                navUserName.textContent = customerData.fullName || 'Customer';
                // Pre-fill user data
                document.getElementById('bookingAddress').value = customerData.address || '';
                document.getElementById('bookingCity').value = customerData.city || '';
                await loadCustomerVehicles();
            } else {
                alert("Customer data not found.");
                window.location.href = './login.html';
            }
        } else {
            window.location.href = './login.html';
        }
    });

    async function loadCustomerVehicles() {
        const vehicleSelect = document.getElementById('bookingVehicle');
        const vehiclesColRef = collection(db, 'customers', currentUser.uid, 'vehicles');
        const querySnapshot = await getDocs(vehiclesColRef);

        vehicleSelect.innerHTML = '<option value="">Select a vehicle</option>';
        if (querySnapshot.empty) {
            vehicleSelect.innerHTML = '<option value="">No vehicles found. Please add one in your dashboard.</option>';
            return;
        }
        querySnapshot.forEach(doc => {
            const vehicle = doc.data();
            vehicleSelect.innerHTML += `<option value="${doc.id}" data-type="${vehicle.type}">${vehicle.make} ${vehicle.model} (${vehicle.registrationNo})</option>`;
        });
    }

    // --- Step Navigation ---
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            updateStepVisibility();
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateStepVisibility();
    });

    function updateStepVisibility() {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });

        prevBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep < steps.length - 1 ? 'inline-block' : 'none';
        confirmBtn.style.display = currentStep === steps.length - 1 ? 'inline-block' : 'none';

        // Trigger data loading for specific steps
        if (currentStep === 2) { // Mechanic selection step
            loadAvailableMechanics();
        }
        if (currentStep === 3) { // Confirmation step
            generateBookingSummary();
        }
    }

    function validateStep(step) {
        if (step === 0) {
            const vehicleId = document.getElementById('bookingVehicle').value;
            const service = document.getElementById('bookingService').value;
            if (!vehicleId || !service) {
                alert('Please select a vehicle and a service.');
                return false;
            }
            const selectedOption = document.getElementById('bookingVehicle').options[document.getElementById('bookingVehicle').selectedIndex];
            selectedVehicleType = selectedOption.dataset.type;
        }
        if (step === 1) {
            const address = document.getElementById('bookingAddress').value;
            const city = document.getElementById('bookingCity').value;
            if (!address || !city) {
                alert('Please provide your full address and city.');
                return false;
            }
        }
        if (step === 2) {
            if (!selectedMechanicId) {
                alert('Please select a mechanic.');
                return false;
            }
        }
        return true;
    }

    // --- Mechanic Loading ---
    async function loadAvailableMechanics() {
        const mechanicListDiv = document.getElementById('mechanicList');
        mechanicListDiv.innerHTML = '<p style="text-align:center; padding: 2rem;">Finding available mechanics...</p>';

        const city = document.getElementById('bookingCity').value.trim().toLowerCase();
        if (!city) {
            mechanicListDiv.innerHTML = '<p style="text-align:center; padding: 2rem;">Please enter your city to find mechanics.</p>';
            return;
        }

        const mechanicsRef = collection(db, 'mechanics');
        // Query for active, verified mechanics who service the selected vehicle type.
        // A more advanced query would use geolocation. For now, we fetch all and filter.
        const q = query(mechanicsRef, where("status", "==", "verified"), where("isActive", "==", true), where("vehicleTypes", "array-contains", selectedVehicleType.toLowerCase()));

        const querySnapshot = await getDocs(q);
        let availableMechanics = [];
        querySnapshot.forEach(doc => {
            const mechanic = doc.data();
            // Simple city matching (case-insensitive)
            if (mechanic.serviceArea.toLowerCase().includes(city)) {
                availableMechanics.push({ id: doc.id, ...mechanic });
            }
        });

        if (availableMechanics.length === 0) {
            mechanicListDiv.innerHTML = '<p style="text-align:center; padding: 2rem;">Sorry, no mechanics found for your area and vehicle type.</p>';
            return;
        }

        mechanicListDiv.innerHTML = '';
        availableMechanics.forEach(mechanic => {
            const card = document.createElement('div');
            card.className = 'mechanic-card';
            card.dataset.id = mechanic.id;
            card.innerHTML = `
                <i class="fas fa-user-circle avatar"></i>
                <div class="details">
                    <h4>${mechanic.fullName}</h4>
                    <p>Experience: ${mechanic.experience} years</p>
                    <p>Skills: ${mechanic.skills}</p>
                </div>
                <div class="rating">
                    <i class="fas fa-star"></i> ${mechanic.rating.toFixed(1)}
                </div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.mechanic-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedMechanicId = mechanic.id;
            });
            mechanicListDiv.appendChild(card);
        });
    }

    // --- Summary and Booking Submission ---
    async function generateBookingSummary() {
        const summaryDiv = document.getElementById('bookingSummary');
        const vehicleSelect = document.getElementById('bookingVehicle');
        const serviceSelect = document.getElementById('bookingService');
        const mechanicDoc = await getDoc(doc(db, 'mechanics', selectedMechanicId));
        const mechanicData = mechanicDoc.data();

        summaryDiv.innerHTML = `
            <div class="summary-item"><span class="label">Vehicle:</span> <span class="value">${vehicleSelect.options[vehicleSelect.selectedIndex].text}</span></div>
            <div class="summary-item"><span class="label">Service:</span> <span class="value">${serviceSelect.value}</span></div>
            <div class="summary-item"><span class="label">Address:</span> <span class="value">${document.getElementById('bookingAddress').value}</span></div>
            <div class="summary-item"><span class="label">Mechanic:</span> <span class="value">${mechanicData.fullName}</span></div>
        `;
    }

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Booking...';

        try {
            const vehicleSelect = document.getElementById('bookingVehicle');
            const vehicleDoc = await getDoc(doc(db, 'customers', currentUser.uid, 'vehicles', vehicleSelect.value));

            const bookingData = {
                customerId: currentUser.uid,
                customerName: customerData.fullName,
                mechanicId: selectedMechanicId,
                vehicle: {
                    id: vehicleSelect.value,
                    make: vehicleDoc.data().make,
                    model: vehicleDoc.data().model,
                    type: vehicleDoc.data().type,
                },
                service: document.getElementById('bookingService').value,
                description: document.getElementById('bookingDescription').value,
                address: document.getElementById('bookingAddress').value,
                city: document.getElementById('bookingCity').value,
                status: 'pending', // Initial status
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'bookings'), bookingData);

            alert('Booking request sent successfully! You will be notified upon acceptance.');
            window.location.href = './customer-dashboard.html';

        } catch (error) {
            console.error("Booking failed: ", error);
            alert('There was an error creating your booking. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm & Book';
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch(error => console.error('Logout Error:', error));
    });
});