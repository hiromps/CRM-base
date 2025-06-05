import { useState, useEffect } from 'react';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    onSnapshot,
    Timestamp 
} from 'firebase/firestore';

export function useUserProfile({ db, user, userId, isAuthReady }) {
    const [userProfile, setUserProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);

    // 匿名ユーザー用のローカルプロファイル管理
    const getLocalStorageKey = () => `userProfile-${userId}`;

    const createLocalProfile = () => {
        const localProfile = {
            uid: userId,
            email: user?.email || null,
            displayName: user?.displayName || user?.email?.split('@')[0] || 'ゲストユーザー',
            memberOfGroups: [`personal_${userId}`],
            createdAt: new Date(),
            updatedAt: new Date(),
            isAnonymous: user?.isAnonymous || false,
            isLocalProfile: true // ローカルプロファイルフラグ
        };
        
        try {
            localStorage.setItem(getLocalStorageKey(), JSON.stringify(localProfile));
        } catch (error) {
            console.error('Error saving local profile:', error);
        }
        
        return localProfile;
    };

    const loadLocalProfile = () => {
        try {
            const saved = localStorage.getItem(getLocalStorageKey());
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading local profile:', error);
        }
        return null;
    };

    const updateLocalProfile = (updates) => {
        try {
            const current = loadLocalProfile() || createLocalProfile();
            const updated = {
                ...current,
                ...updates,
                updatedAt: new Date()
            };
            localStorage.setItem(getLocalStorageKey(), JSON.stringify(updated));
            setUserProfile(updated);
        } catch (error) {
            console.error('Error updating local profile:', error);
        }
    };

    // ユーザープロファイルの初期化
    const initializeUserProfile = async () => {
        if (!userId) return;

        // 匿名ユーザーの場合はローカルストレージを使用
        if (user?.isAnonymous || !db) {
            console.log('Using local profile for anonymous user');
            const localProfile = loadLocalProfile() || createLocalProfile();
            setUserProfile(localProfile);
            setIsProfileLoading(false);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // 新規ユーザーの場合、プロファイルを作成
                const defaultProfile = {
                    uid: userId,
                    email: user?.email || null,
                    displayName: user?.displayName || user?.email?.split('@')[0] || 'ユーザー',
                    memberOfGroups: [`personal_${userId}`], // 個人用グループを自動作成
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    isAnonymous: false
                };

                await setDoc(userDocRef, defaultProfile);
                setUserProfile(defaultProfile);
            } else {
                setUserProfile(userDoc.data());
            }
        } catch (error) {
            console.error('Error initializing user profile:', error);
            // Firestoreエラーの場合はローカルプロファイルにフォールバック
            console.log('Falling back to local profile due to Firestore error');
            const localProfile = loadLocalProfile() || createLocalProfile();
            setUserProfile(localProfile);
            setProfileError(null); // エラーをクリア
        } finally {
            setIsProfileLoading(false);
        }
    };

    // ユーザープロファイルの監視
    useEffect(() => {
        if (!isAuthReady || !userId) {
            setIsProfileLoading(false);
            return;
        }

        setIsProfileLoading(true);
        setProfileError(null);

        // 匿名ユーザーの場合はローカルプロファイルのみ使用
        if (user?.isAnonymous || !db) {
            initializeUserProfile();
            return;
        }

        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, 
            (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                    setIsProfileLoading(false);
                } else {
                    // プロファイルが存在しない場合は初期化
                    initializeUserProfile();
                }
            },
            (error) => {
                console.error('Error listening to user profile:', error);
                // エラーの場合はローカルプロファイルにフォールバック
                console.log('Falling back to local profile due to listener error');
                const localProfile = loadLocalProfile() || createLocalProfile();
                setUserProfile(localProfile);
                setIsProfileLoading(false);
                setProfileError(null); // エラーをクリア
            }
        );

        return () => unsubscribe();
    }, [db, userId, isAuthReady, user?.isAnonymous]);

    // グループに参加
    const joinGroup = async (groupId) => {
        if (!userId || !userProfile) return;

        // ローカルプロファイルの場合
        if (userProfile.isLocalProfile || user?.isAnonymous || !db) {
            const currentGroups = userProfile.memberOfGroups || [];
            if (!currentGroups.includes(groupId)) {
                const updatedGroups = [...currentGroups, groupId];
                updateLocalProfile({ memberOfGroups: updatedGroups });
            }
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            const currentGroups = userProfile.memberOfGroups || [];
            
            if (!currentGroups.includes(groupId)) {
                const updatedGroups = [...currentGroups, groupId];
                await updateDoc(userDocRef, {
                    memberOfGroups: updatedGroups,
                    updatedAt: Timestamp.now()
                });
            }
        } catch (error) {
            console.error('Error joining group:', error);
            setProfileError(`グループ参加に失敗しました: ${error.message}`);
        }
    };

    // グループから脱退
    const leaveGroup = async (groupId) => {
        if (!userId || !userProfile) return;

        // ローカルプロファイルの場合
        if (userProfile.isLocalProfile || user?.isAnonymous || !db) {
            const currentGroups = userProfile.memberOfGroups || [];
            const updatedGroups = currentGroups.filter(id => id !== groupId);
            updateLocalProfile({ memberOfGroups: updatedGroups });
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            const currentGroups = userProfile.memberOfGroups || [];
            const updatedGroups = currentGroups.filter(id => id !== groupId);
            
            await updateDoc(userDocRef, {
                memberOfGroups: updatedGroups,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error leaving group:', error);
            setProfileError(`グループ脱退に失敗しました: ${error.message}`);
        }
    };

    // プロファイル更新
    const updateProfile = async (updates) => {
        if (!userId) return;

        // ローカルプロファイルの場合
        if (userProfile?.isLocalProfile || user?.isAnonymous || !db) {
            updateLocalProfile(updates);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                ...updates,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileError(`プロファイル更新に失敗しました: ${error.message}`);
        }
    };

    return {
        userProfile,
        isProfileLoading,
        profileError,
        joinGroup,
        leaveGroup,
        updateProfile,
        setProfileError
    };
} 