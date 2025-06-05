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

    // 現在選択されているグループID（デフォルトは個人用グループ）
    const [currentGroupId, setCurrentGroupId] = useState(null);

    // グループベースのコレクションパスを作成
    const contactsCollectionPath = useMemo(() => {
        if (!currentGroupId) return null;
        return `groups/${currentGroupId}/contacts`;
    }, [currentGroupId]);

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
                    // デフォルトで個人用グループを設定
                    setCurrentGroupId(`personal_${currentUser.uid}`);
                } else {
                    setUser(null);
                    setUserId(null);
                    setCurrentGroupId(null);
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
            setCurrentGroupId(null);
        } catch (error) {
            console.error("Sign out error:", error);
            setError("ログアウトに失敗しました。");
        }
    };

    // グループ切り替え
    const switchGroup = (groupId) => {
        setCurrentGroupId(groupId);
    };

    return {
        db,
        auth,
        user,
        userId,
        isAuthReady,
        error,
        contactsCollectionPath,
        currentGroupId,
        setError,
        handleSignOut,
        switchGroup
    };
} 