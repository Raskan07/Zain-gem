import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBVn_EicRWSIa_5N-KQs0w8FMyL9a060NI",
  authDomain: "rr-gems.firebaseapp.com",
  projectId: "rr-gems",
  storageBucket: "rr-gems.firebasestorage.app",
  messagingSenderId: "833551652435",
  appId: "1:833551652435:web:032d30ee8d8f35bca218a6",
  measurementId: "G-6GS6CSH02W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Stones collection reference
export const stonesCollection = collection(db, 'stones');

// Stone types for dropdown
export const stoneTypes = [
  'Sapphire',
  'Spinel', 
  'Ruby',
  'TSV',
  'Mahange',
  'Crysoberal',
  'Emerald',
  'Diamond',
  'Amethyst',
  'Topaz',
  'Garnet',
  'Peridot',
  'Aquamarine',
  'Tourmaline',
  'Zircon',
  'Other'
];

// Status options
export const statusOptions = ['In Stock', 'Sold', 'Pending'];

// Treatment options
export const treatmentOptions = ['Natural', 'Heat', 'Electric'];
