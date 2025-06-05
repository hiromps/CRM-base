import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase Configuration
export const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyC-kkfkAJ4weIt7bxNNaoxKtUUb0OrDP7w",
    authDomain: "customer-base-a8093.firebaseapp.com",
    projectId: "customer-base-a8093",
    storageBucket: "customer-base-a8093.firebasestorage.app",
    messagingSenderId: "449640039304",
    appId: "1:449640039304:web:d7fa73b6f1b642e5f4f03d",
    measurementId: "G-R1MM5TNMMW"
};

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'customer-base-a8093';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// 開発環境でのエミュレーター接続（本番では無効）
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
    } catch (error) {
        console.warn('Firebase emulator connection failed:', error);
    }
}

export default app;