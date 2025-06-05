import React, { useState, useMemo } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirebase } from './hooks/useFirebase';
import { useContacts } from './hooks/useContacts';
import { Header } from './components/Header';
import { SearchAndFilter } from './components/SearchAndFilter';
import { ContactList } from './components/ContactList';
import { ContactModal } from './components/ContactModal';

function App() {
    const [showModal, setShowModal] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    
    const [theme, setTheme] = useTheme();
    const { db, userId, isAuthReady, error, contactsCollectionPath, setError } = useFirebase();
    const { 
        contacts, 
        isLoading, 
        uniqueGroups, 
        handleAddContact, 
        handleUpdateContact, 
        handleDeleteContact 
    } = useContacts({ db, userId, isAuthReady, contactsCollectionPath, setError });

    const openAddModal = () => {
        setCurrentContact(null);
        setShowModal(true);
    };

    const openEditModal = (contact) => {
        setCurrentContact(contact);
        setShowModal(true);
    };

    const handleSave = async (contactData) => {
        if (currentContact) {
            await handleUpdateContact(currentContact.id, contactData);
        } else {
            await handleAddContact(contactData);
        }
        setShowModal(false);
        setCurrentContact(null);
    };

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
            const groupMatch = selectedGroup ? contact.group === selectedGroup : true;
            return nameMatch && groupMatch;
        });
    }, [contacts, searchTerm, selectedGroup]);

    if (!isAuthReady && isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                認証情報を読み込み中...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300">
            <Header userId={userId} theme={theme} setTheme={setTheme} />

            {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md relative mb-4 shadow-md" role="alert">
                    {error}
                </div>
            )}
            
            <SearchAndFilter
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                uniqueGroups={uniqueGroups}
                onAddClick={openAddModal}
            />

            <ContactList
                contacts={filteredContacts}
                isLoading={isLoading}
                onEdit={openEditModal}
                onDelete={handleDeleteContact}
            />

            {showModal && (
                <ContactModal
                    contact={currentContact}
                    onClose={() => { setShowModal(false); setCurrentContact(null); }}
                    onSave={handleSave}
                    uniqueGroups={uniqueGroups.filter(g => g !== "")}
                />
            )}
        </div>
    );
}

export default App;

