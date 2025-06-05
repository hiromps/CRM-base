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

export function useContacts({ db, userId, isAuthReady, contactsCollectionPath, setError }) {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ユーザーごとのローカルストレージキーを生成
    const localStorageKey = useMemo(() => {
        if (!userId) return 'demo-contacts';
        return `contacts-${userId}`;
    }, [userId]);

    // Local storage functions for demo mode
    const loadContactsFromLocalStorage = () => {
        try {
            const savedContacts = localStorage.getItem(localStorageKey);
            if (savedContacts) {
                const parsedContacts = JSON.parse(savedContacts);
                setContacts(parsedContacts);
            } else {
                // 新しいユーザーの場合はデモデータを設定
                const demoContacts = [
                    {
                        id: `demo-${userId}-1`,
                        name: '田中太郎',
                        group: '営業部',
                        memo: 'あなた専用のデモ連絡先です。',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    {
                        id: `demo-${userId}-2`,
                        name: '佐藤花子',
                        group: '開発部',
                        memo: 'React開発者（あなた専用）',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];
                setContacts(demoContacts);
                localStorage.setItem(localStorageKey, JSON.stringify(demoContacts));
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

    // Fetch Contacts
    useEffect(() => {
        if (!isAuthReady || !userId) {
            console.log("Firestore listener prerequisites not met:", { isAuthReady, userId });
            return;
        }

        // If using demo mode (no Firebase connection or anonymous user without proper setup), use local storage
        if (!db || !contactsCollectionPath) {
            console.log("Using demo mode with local storage - no Firebase connection");
            loadContactsFromLocalStorage();
            return;
        }
        
        setIsLoading(true);
        setError(null);
        console.log(`Setting up Firestore listener for user-specific path: ${contactsCollectionPath}`);

        const q = query(collection(db, contactsCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const contactsData = [];
            querySnapshot.forEach((doc) => {
                contactsData.push({ id: doc.id, ...doc.data() });
            });
            contactsData.sort((a, b) => a.name.localeCompare(b.name));
            setContacts(contactsData);
            setIsLoading(false);
            console.log(`Contacts updated for user ${userId}:`, contactsData.length);
        }, (err) => {
            console.error("Error fetching contacts:", err);
            setError(`顧客データの取得に失敗しました: ${err.message}`);
            // Fallback to local storage on Firestore error
            console.log("Falling back to local storage due to Firestore error");
            loadContactsFromLocalStorage();
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, contactsCollectionPath, setError, localStorageKey]);

    // CRUD Operations
    const handleAddContact = async (contactData) => {
        if (!db || !contactsCollectionPath) {
            // Demo mode: use local storage
            const newContact = {
                id: `demo-${userId}-${Date.now()}`,
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
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Error adding contact:", err);
            setError(`連絡先の追加に失敗しました: ${err.message}`);
        }
    };

    const handleUpdateContact = async (contactId, contactData) => {
        if (!db || !contactsCollectionPath) {
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
                updatedAt: Timestamp.now()
            }, { merge: true });
        } catch (err) {
            console.error("Error updating contact:", err);
            setError(`連絡先の更新に失敗しました: ${err.message}`);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!db || !contactsCollectionPath) {
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
            setError(`連絡先の削除に失敗しました: ${err.message}`);
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
        handleAddContact,
        handleUpdateContact,
        handleDeleteContact
    };
} 