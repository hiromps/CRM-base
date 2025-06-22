import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { 
    setLogLevel
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export function useFirebase() {
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

    // Auth State - 初回マウント時のみ実行
    useEffect(() => {
        let mounted = true;
        
        try {
            // 本番環境ではログレベルを無効化
            if (typeof setLogLevel === 'function' && process.env.NODE_ENV === 'development') {
                setLogLevel('debug');
            }

            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                if (!mounted) return;
                
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

            return () => {
                mounted = false;
                unsubscribe();
            };
        } catch (e) {
            console.error("Firebase initialization error:", e);
            if (mounted) {
                setError("Firebaseの初期化に失敗しました。");
                setIsAuthReady(true);
            }
        }
    }, []); // 空の依存配列で初回のみ実行

    const handleSignOut = useCallback(async () => {
        try {
            await signOut(auth);
            setCurrentGroupId(null);
        } catch (error) {
            console.error("Sign out error:", error);
            setError("ログアウトに失敗しました。");
        }
    }, []);

    // グループ切り替え
    const switchGroup = useCallback((groupId) => {
        setCurrentGroupId(groupId);
    }, []);

    // エラーセッターをメモ化
    const memoizedSetError = useCallback((error) => {
        setError(error);
    }, []);

    return {
        db,
        auth,
        user,
        userId,
        isAuthReady,
        error,
        contactsCollectionPath,
        currentGroupId,
        setError: memoizedSetError,
        handleSignOut,
        switchGroup
    };
} 