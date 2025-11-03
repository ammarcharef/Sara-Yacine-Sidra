// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, getDocs, query, where, orderBy, increment } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCBSwd5HEgLIqVVPKb3HF_cAHfzPONIgQ",
  authDomain: "algeria-ads-platform.firebaseapp.com",
  projectId: "algeria-ads-platform",
  storageBucket: "algeria-ads-platform.firebasestorage.app",
  messagingSenderId: "198544951909",
  appId: "1:198544951909:web:95489ce6858c4185a6d48c",
  measurementId: "G-NJBJNYRCYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// جعل المتغيرات عامة للاستخدام في الملفات الأخرى
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseGoogleProvider = googleProvider;
window.firebaseFunctions = {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  increment
};
