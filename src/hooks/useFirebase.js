import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    setLogLevel
} from 'firebase/firestore';
import { firebaseConfig, appId } from '../config/firebase';

export function useFirebase() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);

    // ユーザーごとの独立したコレクションパスを作成
    const contactsCollectionPath = useMemo(() => {
        if (!userId) return null;
        
        // 匿名ユーザーの場合は共通のコレクションを使用（デモ用）
        if (user?.isAnonymous) {
            return `users/${userId}/contacts`;
        }
        
        // 認証済みユーザーの場合は個別のコレクションを使用
        return `users/${userId}/contacts`;
    }, [userId, user]);

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

            const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    setUserId(currentUser.uid);
                } else {
                    setUser(null);
                    setUserId(null);
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization error:", e);
            setError("Firebaseの初期化に失敗しました。");
            setIsAuthReady(true);
        }
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
            setError("ログアウトに失敗しました。");
        }
    };

    return {
        db,
        auth,
        user,
        userId,
        isAuthReady,
        error,
        contactsCollectionPath,
        setError,
        handleSignOut
    };
} 