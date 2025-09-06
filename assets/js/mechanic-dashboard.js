import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardNavs = document.querySelectorAll('.dashboard-nav .nav-btn');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    let currentUser = null;
    let mechanicData = null;

    // --- Authentication Check ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const userDocRef = doc(db, 'mechanics', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                mechanicData = userDoc.data();

                // Populate user name in the navigation bar
                document.getElementById('navUserName').textContent = mechanicData.fullName || 'Mechanic';

                // Initial data load for active tab
                loadActiveTabData();
            } else {
                alert("No mechanic data found. Redirecting to login.");
                window.location.href = './login.html';
            }
        } else {
            window.location.href = './login.html';
        }
    });

    // --- Navigation Logic ---
    dashboardNavs.forEach(nav => {
        nav.addEventListener('click', () => {
            dashboardNavs.forEach(btn => btn.classList.remove('active'));
            nav.classList.add('active');

            const targetId = nav.getAttribute('data-target');
            dashboardSections.forEach(section => {
                section.classList.toggle('active', section.id === targetId);
            });
            loadActiveTabData();
        });
    });

    // --- Data Loading Router ---
    function loadActiveTabData() {
        const activeSection = document.querySelector('.dashboard-section.active');
        if (!activeSection || !currentUser) return;

        switch (activeSection.id) {
            case 'overview-section':
                // loadOverviewData(); // To be implemented
                break;
            case 'requests-section':
                // loadRequestsData(); // To be implemented
                break;
            case 'jobs-section':
                // loadJobsData(); // To be implemented
                break;
            case 'profile-section':
                loadProfileData();
                break;
        }
    }

    // --- Profile Management ---
    const profileForm = document.getElementById('profileForm');
    
    function loadProfileData() {
        if (!mechanicData) return;
        
        document.getElementById('profileFullName').value = mechanicData.fullName || '';
        document.getElementById('profileEmail').value = mechanicData.email || '';
        document.getElementById('profilePhone').value = mechanicData.phone || '';
        document.getElementById('profileExperience').value = mechanicData.experience || '';
        document.getElementById('profileSkills').value = mechanicData.skills || '';
        document.getElementById('profileServiceArea').value = mechanicData.serviceArea || '';
        document.getElementById('profileBankAccount').value = mechanicData.bankAccount || '';
        document.getElementById('profileIfscCode').value = mechanicData.ifscCode || '';

        // Set checkboxes for vehicle types
        const vehicleCheckboxes = profileForm.querySelectorAll('input[name="vehicleTypes"]');
        vehicleCheckboxes.forEach(checkbox => {
            checkbox.checked = mechanicData.vehicleTypes?.includes(checkbox.value);
        });
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = profileForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Updating...';

        try {
            const vehicleTypes = Array.from(profileForm.querySelectorAll('input[name="vehicleTypes"]:checked'))
                                      .map(cb => cb.value);

            const updatedData = {
                fullName: document.getElementById('profileFullName').value,
                phone: document.getElementById('profilePhone').value,
                experience: document.getElementById('profileExperience').value,
                skills: document.getElementById('profileSkills').value,
                serviceArea: document.getElementById('profileServiceArea').value,
                bankAccount: document.getElementById('profileBankAccount').value,
                ifscCode: document.getElementById('profileIfscCode').value,
                vehicleTypes: vehicleTypes,
            };

            const userDocRef = doc(db, 'mechanics', currentUser.uid);
            await updateDoc(userDocRef, updatedData);

            // Refresh local data
            mechanicData = { ...mechanicData, ...updatedData };
            alert('Profile updated successfully!');

        } catch (error) {
            console.error("Error updating profile: ", error);
            alert('Failed to update profile.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Update Profile';
        }
    });


    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch(error => console.error('Logout Error:', error));
    });
});