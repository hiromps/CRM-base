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

    // ユーザープロファイルの初期化
    const initializeUserProfile = async () => {
        if (!db || !userId) return;

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
                    isAnonymous: user?.isAnonymous || false
                };

                await setDoc(userDocRef, defaultProfile);
                setUserProfile(defaultProfile);
            } else {
                setUserProfile(userDoc.data());
            }
        } catch (error) {
            console.error('Error initializing user profile:', error);
            setProfileError(`プロファイルの初期化に失敗しました: ${error.message}`);
        } finally {
            setIsProfileLoading(false);
        }
    };

    // ユーザープロファイルの監視
    useEffect(() => {
        if (!isAuthReady || !userId || !db) {
            setIsProfileLoading(false);
            return;
        }

        setIsProfileLoading(true);
        setProfileError(null);

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
                setProfileError(`プロファイルの取得に失敗しました: ${error.message}`);
                setIsProfileLoading(false);
            }
        );

        return () => unsubscribe();
    }, [db, userId, isAuthReady]);

    // グループに参加
    const joinGroup = async (groupId) => {
        if (!db || !userId || !userProfile) return;

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
        if (!db || !userId || !userProfile) return;

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
        if (!db || !userId) return;

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