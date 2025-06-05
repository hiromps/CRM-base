import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFirebase } from './hooks/useFirebase';
import { useUserProfile } from './hooks/useUserProfile';
import { useWorkspaceSettings } from './hooks/useWorkspaceSettings';
import { useContacts } from './hooks/useContacts';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { GroupSelector } from './components/GroupSelector';
import { WorkspaceSettings } from './components/WorkspaceSettings';
import { SearchAndFilter } from './components/SearchAndFilter';
import { ContactList } from './components/ContactList';
import { ContactModal } from './components/ContactModal';

function App() {
    const [showModal, setShowModal] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    
    const [theme, setTheme] = useTheme();
    const { 
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
    } = useFirebase();
    
    const {
        userProfile,
        isProfileLoading,
        profileError,
        joinGroup,
        leaveGroup,
        updateProfile,
        setProfileError,
        createWorkspace,
        joinWorkspaceByCode,
        generateInviteCode
    } = useUserProfile({ db, user, userId, isAuthReady });
    
    const {
        workspaceSettings,
        workspaceInfo,
        workspacesInfo,
        isSettingsLoading,
        settingsError,
        isWorkspaceAdmin,
        updateWorkspaceSettings,
        setSettingsError,
        loadWorkspacesInfo,
        getWorkspaceDisplayName
    } = useWorkspaceSettings({ db, userId, currentGroupId, user });
    
    const { 
        contacts, 
        isLoading, 
        uniqueGroups,
        hasGroupAccess,
        isLocalMode,
        handleAddContact, 
        handleUpdateContact, 
        handleDeleteContact 
    } = useContacts({ 
        db, 
        userId, 
        isAuthReady, 
        contactsCollectionPath, 
        currentGroupId,
        userProfile,
        user,
        setError 
    });

    // ユーザープロファイルが読み込まれたら、ワークスペース情報を取得
    useEffect(() => {
        if (userProfile?.memberOfGroups && userProfile.memberOfGroups.length > 0) {
            loadWorkspacesInfo(userProfile.memberOfGroups);
        }
    }, [userProfile?.memberOfGroups, loadWorkspacesInfo]);
    
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

    // 認証が準備できていない場合のローディング画面
    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                認証情報を読み込み中...
            </div>
        );
    }

    // ユーザーがログインしていない場合はログイン画面を表示
    if (!userId) {
        return (
            <LoginForm 
                auth={auth} 
                onLoginSuccess={() => {}} 
                error={error} 
                setError={setError} 
            />
        );
    }

    // プロファイル読み込み中
    if (isProfileLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300">
                ユーザープロファイルを読み込み中...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 font-sans transition-colors duration-300">
            <Header 
                user={user} 
                userId={userId} 
                userProfile={userProfile}
                theme={theme} 
                setTheme={setTheme} 
                onSignOut={handleSignOut}
            />

            {(error || profileError || settingsError) && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md relative mb-4 shadow-md" role="alert">
                    {error || profileError || settingsError}
                    <button
                        onClick={() => { setError(null); setProfileError(null); setSettingsError(null); }}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    >
                        ×
                    </button>
                </div>
            )}

            {userProfile && (
                <GroupSelector
                    userProfile={userProfile}
                    currentGroupId={currentGroupId}
                    onGroupChange={switchGroup}
                    joinGroup={joinGroup}
                    leaveGroup={leaveGroup}
                    createWorkspace={createWorkspace}
                    joinWorkspaceByCode={joinWorkspaceByCode}
                    generateInviteCode={generateInviteCode}
                    workspaceInfo={workspaceInfo}
                    workspacesInfo={workspacesInfo}
                    getWorkspaceDisplayName={getWorkspaceDisplayName}
                />
            )}

            <WorkspaceSettings
                currentGroupId={currentGroupId}
                workspaceSettings={workspaceSettings}
                isWorkspaceAdmin={isWorkspaceAdmin}
                updateWorkspaceSettings={updateWorkspaceSettings}
                isSettingsLoading={isSettingsLoading}
            />

            {hasGroupAccess ? (
                <>
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
                        onAddClick={openAddModal}
                        isLocalMode={isLocalMode}
                    />
                </>
            ) : (
                <div className="text-center text-gray-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-2">アクセス権限がありません</h3>
                    <p>このグループの連絡先を表示するには、グループメンバーである必要があります。</p>
                    <p className="text-sm mt-2">グループに参加するか、別のグループを選択してください。</p>
                </div>
            )}

            {showModal && hasGroupAccess && (
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

