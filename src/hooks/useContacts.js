import { useState, useEffect, useMemo } from 'react';
import { 
    collection, 
    addDoc, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    Timestamp
} from 'firebase/firestore';

export function useContacts({ db, userId, isAuthReady, contactsCollectionPath, currentGroupId, userProfile, user, setError }) {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // グループごとのローカルストレージキーを生成
    const localStorageKey = useMemo(() => {
        if (!currentGroupId) return 'demo-contacts';
        return `contacts-${currentGroupId}`;
    }, [currentGroupId]);

    // 匿名ユーザーかローカルプロファイルかを判定
    const isLocalMode = useMemo(() => {
        return user?.isAnonymous || userProfile?.isLocalProfile || !db || !contactsCollectionPath;
    }, [user?.isAnonymous, userProfile?.isLocalProfile, db, contactsCollectionPath]);

    // Local storage functions for demo mode
    const loadContactsFromLocalStorage = () => {
        try {
            const savedContacts = localStorage.getItem(localStorageKey);
            if (savedContacts) {
                const parsedContacts = JSON.parse(savedContacts);
                setContacts(parsedContacts);
            } else {
                // ゲストユーザーの場合のみデモデータを設定
                if (user?.isAnonymous || userProfile?.isLocalProfile) {
                    const demoContacts = [
                        {
                            id: `demo-${currentGroupId}-1`,
                            name: '田中太郎',
                            group: '営業部',
                            memo: `${currentGroupId.includes('personal') ? '個人用' : 'ワークスペース共有'}の連絡先です。`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: userId
                        },
                        {
                            id: `demo-${currentGroupId}-2`,
                            name: '佐藤花子',
                            group: '開発部',
                            memo: 'React開発者',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            createdBy: userId
                        }
                    ];
                    setContacts(demoContacts);
                    localStorage.setItem(localStorageKey, JSON.stringify(demoContacts));
                } else {
                    // 認証済みユーザーは空の状態から開始
                    setContacts([]);
                }
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Error loading from local storage:", error);
            setContacts([]);
            setIsLoading(false);
        }
    };

    const saveContactsToLocalStorage = (updatedContacts) => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(updatedContacts));
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
    };

    // グループアクセス権限チェック（匿名ユーザーは常にアクセス可能）
    const hasGroupAccess = useMemo(() => {
        if (!userProfile || !currentGroupId) return false;
        
        // 匿名ユーザーまたはローカルプロファイルの場合は常にアクセス可能
        if (user?.isAnonymous || userProfile.isLocalProfile) {
            return true;
        }
        
        return userProfile.memberOfGroups?.includes(currentGroupId) || false;
    }, [userProfile, currentGroupId, user?.isAnonymous]);

    // Fetch Contacts
    useEffect(() => {
        if (!isAuthReady || !userId || !currentGroupId) {
            console.log("Firestore listener prerequisites not met:", { isAuthReady, userId, currentGroupId });
            setIsLoading(false);
            return;
        }

        // ローカルモードの場合は常にローカルストレージを使用
        if (isLocalMode) {
            console.log("Using local storage mode for anonymous user or local profile");
            loadContactsFromLocalStorage();
            return;
        }

        // グループアクセス権限チェック（認証済みユーザーのみ）
        if (!hasGroupAccess) {
            console.log("No access to group:", currentGroupId);
            setError(`グループ "${currentGroupId}" へのアクセス権限がありません。`);
            setContacts([]);
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        console.log(`Setting up Firestore listener for group: ${currentGroupId}`);

        const q = query(collection(db, contactsCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const contactsData = [];
            querySnapshot.forEach((doc) => {
                contactsData.push({ id: doc.id, ...doc.data() });
            });
            contactsData.sort((a, b) => a.name.localeCompare(b.name));
            setContacts(contactsData);
            setIsLoading(false);
            console.log(`Contacts updated for group ${currentGroupId}:`, contactsData.length);
        }, (err) => {
            console.error("Error fetching contacts:", err);
            if (err.code === 'permission-denied') {
                setError(`グループ "${currentGroupId}" へのアクセスが拒否されました。グループメンバーであることを確認してください。`);
            } else {
                setError(`顧客データの取得に失敗しました: ${err.message}`);
            }
            // Fallback to local storage on Firestore error
            console.log("Falling back to local storage due to Firestore error");
            loadContactsFromLocalStorage();
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, contactsCollectionPath, currentGroupId, hasGroupAccess, isLocalMode, setError, localStorageKey]);

    // CRUD Operations
    const handleAddContact = async (contactData) => {
        // ローカルモードまたは権限チェック
        if (isLocalMode || !hasGroupAccess) {
            // ローカルモードの場合は常に許可、認証済みユーザーは権限チェック
            if (!isLocalMode && !hasGroupAccess) {
                setError("このグループへの書き込み権限がありません。");
                return;
            }

            // Demo mode: use local storage
            const newContact = {
                id: `demo-${currentGroupId}-${Date.now()}`,
                ...contactData,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const updatedContacts = [...contacts, newContact].sort((a, b) => a.name.localeCompare(b.name));
            setContacts(updatedContacts);
            saveContactsToLocalStorage(updatedContacts);
            return;
        }

        if (!userId) {
            setError("ユーザー認証が必要です。");
            return;
        }
        try {
            await addDoc(collection(db, contactsCollectionPath), {
                ...contactData,
                createdBy: userId,
                groupId: currentGroupId,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Error adding contact:", err);
            if (err.code === 'permission-denied') {
                setError("このグループへの書き込み権限がありません。");
            } else {
                setError(`連絡先の追加に失敗しました: ${err.message}`);
            }
        }
    };

    const handleUpdateContact = async (contactId, contactData) => {
        // ローカルモードまたは権限チェック
        if (isLocalMode || !hasGroupAccess) {
            if (!isLocalMode && !hasGroupAccess) {
                setError("このグループへの書き込み権限がありません。");
                return;
            }

            // Demo mode: use local storage
            const updatedContacts = contacts.map(contact => 
                contact.id === contactId 
                    ? { ...contact, ...contactData, updatedBy: userId, updatedAt: new Date() }
                    : contact
            ).sort((a, b) => a.name.localeCompare(b.name));
            setContacts(updatedContacts);
            saveContactsToLocalStorage(updatedContacts);
            return;
        }

        if (!userId) {
            setError("ユーザー認証が必要です。");
            return;
        }
        try {
            const contactRef = doc(db, contactsCollectionPath, contactId);
            await setDoc(contactRef, {
                ...contactData,
                updatedBy: userId,
                groupId: currentGroupId,
                updatedAt: Timestamp.now()
            }, { merge: true });
        } catch (err) {
            console.error("Error updating contact:", err);
            if (err.code === 'permission-denied') {
                setError("このグループへの書き込み権限がありません。");
            } else {
                setError(`連絡先の更新に失敗しました: ${err.message}`);
            }
        }
    };

    const handleDeleteContact = async (contactId) => {
        // ローカルモードまたは権限チェック
        if (isLocalMode || !hasGroupAccess) {
            if (!isLocalMode && !hasGroupAccess) {
                setError("このグループへの書き込み権限がありません。");
                return;
            }

            // Demo mode: use local storage
            const updatedContacts = contacts.filter(contact => contact.id !== contactId);
            setContacts(updatedContacts);
            saveContactsToLocalStorage(updatedContacts);
            return;
        }

        try {
            await deleteDoc(doc(db, contactsCollectionPath, contactId));
        } catch (err) {
            console.error("Error deleting contact:", err);
            if (err.code === 'permission-denied') {
                setError("このグループへの書き込み権限がありません。");
            } else {
                setError(`連絡先の削除に失敗しました: ${err.message}`);
            }
        }
    };

    const uniqueGroups = useMemo(() => {
        const groups = new Set(contacts.map(c => c.group).filter(g => g));
        return ["", ...Array.from(groups).sort()];
    }, [contacts]);

    return {
        contacts,
        isLoading,
        uniqueGroups,
        hasGroupAccess,
        isLocalMode,
        handleAddContact,
        handleUpdateContact,
        handleDeleteContact
    };
} 