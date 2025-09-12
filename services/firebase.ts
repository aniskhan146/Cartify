// FIX: Switched to Firebase v8 compat imports to resolve module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/functions"; // Import functions compat library

// Firebase configuration provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyDpuOFOvoQb3pIvQmQy3NPb-21ZkSKm4yw",
  authDomain: "cartify-fc045.firebaseapp.com",
  databaseURL: "https://cartify-fc045-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cartify-fc045",
  storageBucket: "cartify-fc045.firebasestorage.app",
  messagingSenderId: "405746912919",
  appId: "1:405746912919:web:263d39fb6b8a39cabce3d2",
  measurementId: "G-JVD0J32M7M"
};


// Initialize Firebase
// FIX: Switched to Firebase v8 compat initialization.
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// FIX: Used v8 compat syntax to get auth and database services.
export const auth = firebase.auth();
export const db = firebase.database();
export const functions = firebase.app().functions('asia-southeast1'); // Initialize and export functions
export const googleProvider = new firebase.auth.GoogleAuthProvider();