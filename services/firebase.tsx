import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAn2Mcoe14NWSSRetg-CcPTDApDACAQLpY",
  authDomain: "ndamhospital.firebaseapp.com",
  projectId: "ndamhospital",
  storageBucket: "ndamhospital.firebasestorage.app",
  messagingSenderId: "1005765191662",
  appId: "1:1005765191662:web:e1ce7193dee4694bf210ff",
  measurementId: "G-6JVGW9BE9X"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth }; 