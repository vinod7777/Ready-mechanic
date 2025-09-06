import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, serverTimestamp, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardNavs = document.querySelectorAll('.dashboard-nav .nav-btn');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    let currentUser = null;

    // --- Authentication Check ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const userDocRef = doc(db, 'customers', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Populate user name in the navigation bar
                document.getElementById('navUserName').textContent = userData.fullName || 'Customer';

                // Initial data load for active tab
                loadActiveTabData();
            } else {
                // This case handles if a non-customer logs in and gets redirected here.
                alert("No customer data found. Redirecting to login.");
                window.location.href = './login.html';
            }
        } else {
            // User is signed out
            window.location.href = './login.html';
        }
    });

    // --- Navigation Logic ---
    dashboardNavs.forEach(nav => {
        nav.addEventListener('click', () => {
            // Update active button
            dashboardNavs.forEach(btn => btn.classList.remove('active'));
            nav.classList.add('active');

            // Show target section
            const targetId = nav.getAttribute('data-target');
            dashboardSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            // Load data for the newly active tab
            loadActiveTabData();
        });
    });

    // --- Data Loading based on Active Tab ---
    function loadActiveTabData() {
        const activeSection = document.querySelector('.dashboard-section.active');
        if (!activeSection || !currentUser) return;

        switch (activeSection.id) {
            case 'overview-section':
                loadOverviewData();
                break;
            case 'profile-section':
                loadProfileData();
                break;
            case 'vehicles-section':
                loadVehiclesData();
                break;
            case 'bookings-section':
                // loadBookingsData(); // This function is not yet implemented
                break;
        }
    }

    // --- Overview Data ---
    async function loadOverviewData() {
        const bookingsQuery = query(collection(db, 'bookings'), where("customerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(bookingsQuery);
        
        let completedServices = 0;
        querySnapshot.forEach(doc => {
            if (doc.data().status === 'completed') {
                completedServices++;
            }
        });

        document.getElementById('totalBookingsStat').textContent = querySnapshot.size;
        document.getElementById('completedServicesStat').textContent = completedServices;
    }

    // --- Profile Management ---
    const profileForm = document.getElementById('profileForm');
    async function loadProfileData() {
        const userDoc = await getDoc(doc(db, 'customers', currentUser.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('profileFullName').value = data.fullName || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profilePhone').value = data.phone || '';
            document.getElementById('profileCity').value = data.city || '';
            document.getElementById('profileAddress').value = data.address || '';
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = profileForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const userDocRef = doc(db, 'customers', currentUser.uid);
            await updateDoc(userDocRef, {
                fullName: document.getElementById('profileFullName').value,
                phone: document.getElementById('profilePhone').value,
                city: document.getElementById('profileCity').value,
                address: document.getElementById('profileAddress').value,
            });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert('Failed to update profile.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update Profile';
        }
    });

    // --- Vehicle Management ---
    const addVehicleForm = document.getElementById('addVehicleForm');
    const vehiclesList = document.getElementById('vehiclesList');

    async function loadVehiclesData() {
        const vehiclesColRef = collection(db, 'customers', currentUser.uid, 'vehicles');
        const q = query(vehiclesColRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        vehiclesList.innerHTML = ''; // Clear list
        if (querySnapshot.empty) {
            vehiclesList.innerHTML = '<tr><td colspan="5" style="text-align:center;">No vehicles added yet.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const vehicle = doc.data();
            const vehicleId = doc.id;
            const row = `
                <tr data-id="${vehicleId}">
                    <td>${vehicle.type}</td>
                    <td>${vehicle.make}</td>
                    <td>${vehicle.model}</td>
                    <td>${vehicle.registrationNo}</td>
                    <td><button class="btn-danger btn-sm delete-vehicle-btn">Delete</button></td>
                </tr>
            `;
            vehiclesList.innerHTML += row;
        });
    }

    addVehicleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('addVehicleBtn');
        btn.disabled = true;
        btn.textContent = 'Adding...';

        try {
            const vehiclesColRef = collection(db, 'customers', currentUser.uid, 'vehicles');
            await addDoc(vehiclesColRef, {
                type: addVehicleForm.type.value,
                make: addVehicleForm.make.value,
                model: addVehicleForm.model.value,
                registrationNo: addVehicleForm.registrationNo.value,
                createdAt: serverTimestamp()
            });
            addVehicleForm.reset();
            await loadVehiclesData(); // Refresh the list
        } catch (error) {
            console.error("Error adding vehicle: ", error);
            alert('Failed to add vehicle.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Add Vehicle';
        }
    });

    vehiclesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-vehicle-btn')) {
            const vehicleRow = e.target.closest('tr');
            const vehicleId = vehicleRow.dataset.id;
            if (confirm('Are you sure you want to delete this vehicle?')) {
                try {
                    await deleteDoc(doc(db, 'customers', currentUser.uid, 'vehicles', vehicleId));
                    vehicleRow.remove(); // Remove from UI
                } catch (error) {
                    console.error("Error deleting vehicle: ", error);
                    alert('Failed to delete vehicle.');
                }
            }
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });
});