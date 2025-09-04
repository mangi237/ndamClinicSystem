import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage} from 'firebase/storage';

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
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
export const storage = getStorage(app);
// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth }; 