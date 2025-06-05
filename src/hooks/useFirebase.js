import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged, 
    signInWithCustomToken 
} from 'firebase/auth';
import { 
    getFirestore, 
    setLogLevel
} from 'firebase/firestore';
import { firebaseConfig, appId } from '../config/firebase';

export function useFirebase() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);

    const contactsCollectionPath = useMemo(() => {
        if (!appId || appId === 'default-app-id') return null;
        return `/artifacts/${appId}/public/data/contacts`;
    }, [appId]);

    // Helper function for anonymous sign in with error handling
    const handleAnonymousSignIn = async (firebaseAuth) => {
        try {
            await signInAnonymously(firebaseAuth);
        } catch (authError) {
            console.error("Anonymous sign-in error:", authError);
            if (authError.code === 'auth/admin-restricted-operation') {
                setError("匿名認証が無効になっています。Firebase Consoleで匿名認証を有効にしてください。");
            } else {
                setError(`認証エラー: ${authError.message}`);
            }
            // Set a dummy user ID to allow the app to function in demo mode
            setUserId('demo-user');
            setIsAuthReady(true);
        }
    };

    // Firebase Initialization and Auth State
    useEffect(() => {
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(firebaseApp);
            const firebaseAuth = getAuth(firebaseApp);
            
            setDb(firestoreDb);
            setAuth(firebaseAuth);
            if (typeof setLogLevel === 'function') {
                setLogLevel('debug');
            }

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
                if (currentUser) {
                    setUserId(currentUser.uid);
                    setIsAuthReady(true);
                } else {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        try {
                            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                        } catch (tokenError) {
                            console.error("Error signing in with custom token:", tokenError);
                            await handleAnonymousSignIn(firebaseAuth);
                        }
                    } else {
                        await handleAnonymousSignIn(firebaseAuth);
                    }
                }
            });
            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization error:", e);
            setError("Firebaseの初期化に失敗しました。");
            setIsAuthReady(true);
        }
    }, []);

    return {
        db,
        auth,
        userId,
        isAuthReady,
        error,
        contactsCollectionPath,
        setError
    };
} 