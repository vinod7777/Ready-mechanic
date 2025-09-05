// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your own Firebase project's configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNaavKygiGHPlC1ukYq5ClVk0YPlQ1Kkg",
    authDomain: "readymechanic-f07ca.firebaseapp.com",
    projectId: "readymechanic-f07ca",
    storageBucket: "readymechanic-f07ca.firebasestorage.app",
    messagingSenderId: "954137926104",
    appId: "1:954137926104:web:f2ce6c9a91d0a25847baad",
    measurementId: "G-M860060V3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Database collections
const collections = {
  users: 'users',
  customers: 'customers',
  mechanics: 'mechanics',
  services: 'services',
  bookings: 'bookings',
  payments: 'payments',
  reviews: 'reviews',
  notifications: 'notifications'
};

export { 
  app, 
  auth, 
  db, 
  storage, 
  googleProvider, 
  collections,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  collection,
  ref,
  uploadBytes,
  getDownloadURL
};