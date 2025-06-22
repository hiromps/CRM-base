import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { CSVImportModal } from './components/CSVImportModal';
// import { CSVImportModal } from './components/CSVImportModal';
// import { 
//     exportContactsToCSV 
//     // importContactsFromCSV, 
//     // validateImportData, 
//     // downloadCSVTemplate 
// } from './utils/csvUtils';

function App() {
    const [showModal, setShowModal] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    
    // CSV インポート関連の状態
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    
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

    // ユーザープロファイルが読み込まれたら、ワークスペース情報を取得（デバウンス付き）
    useEffect(() => {
        if (userProfile?.memberOfGroups && userProfile.memberOfGroups.length > 0) {
            const timer = setTimeout(() => {
                loadWorkspacesInfo(userProfile.memberOfGroups);
            }, 300); // 300msのデバウンス
            
            return () => clearTimeout(timer);
        }
    }, [userProfile?.memberOfGroups]); // loadWorkspacesInfoを依存関係から除外してフリーズを防ぐ
    
    const openAddModal = useCallback(() => {
        setCurrentContact(null);
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((contact) => {
        setCurrentContact(contact);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setCurrentContact(null);
    }, []);

    const handleSave = useCallback(async (contactData) => {
        if (currentContact) {
            await handleUpdateContact(currentContact.id, contactData);
        } else {
            await handleAddContact(contactData);
        }
        closeModal();
    }, [currentContact, handleUpdateContact, handleAddContact, closeModal]);

    const clearAllErrors = useCallback(() => {
        setError(null);
        setProfileError(null);
        setSettingsError(null);
    }, [setError, setProfileError, setSettingsError]);

    // フィルタリングされた連絡先を計算（CSVエクスポート用）
    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
            const groupMatch = selectedGroup ? contact.group === selectedGroup : true;
            return nameMatch && groupMatch;
        });
    }, [contacts, searchTerm, selectedGroup]);

    // ファイルエクスポート処理（CSV/Excel対応）
    const handleExportFile = useCallback(async (format = 'csv') => {
        try {
            setIsExporting(true);
            
            // 実行時にフィルタリング結果を計算
            const currentFilteredContacts = contacts.filter(contact => {
                const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
                const groupMatch = selectedGroup ? contact.group === selectedGroup : true;
                return nameMatch && groupMatch;
            });
            
            const exportData = currentFilteredContacts.length > 0 ? currentFilteredContacts : contacts;
            if (exportData.length === 0) {
                setError('エクスポートする連絡先がありません');
                return;
            }
            
            // 動的インポートでファイルユーティリティを読み込み
            const currentDate = new Date().toISOString().split('T')[0];
            const groupName = currentGroupId?.startsWith('personal_') 
                ? '個人用' 
                : getWorkspaceDisplayName(currentGroupId);
            
            if (format === 'excel') {
                const { exportContactsToExcel } = await import('./utils/csvUtils');
                const filename = `contacts_${groupName}_${currentDate}.xlsx`;
                await exportContactsToExcel(exportData, filename);
                setError(`${exportData.length}件の連絡先をExcelファイルでエクスポートしました`);
            } else {
                const { exportContactsToCSV } = await import('./utils/csvUtils');
                const filename = `contacts_${groupName}_${currentDate}.csv`;
                await exportContactsToCSV(exportData, filename);
                setError(`${exportData.length}件の連絡先をCSVファイルでエクスポートしました`);
            }
            
            setTimeout(() => clearAllErrors(), 3000);
        } catch (error) {
            console.error('File Export error:', error);
            setError(`${format === 'excel' ? 'Excel' : 'CSV'}エクスポートに失敗しました: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    }, [contacts, searchTerm, selectedGroup, currentGroupId, getWorkspaceDisplayName, setError, clearAllErrors]);

    // ファイルインポート処理（CSV/Excel自動判定）
    const handleImportFile = useCallback(async (file) => {
        try {
            setIsImporting(true);
            
            // 動的インポートでファイルユーティリティを読み込み
            const { importContactsFromFile, validateImportData, getFileType } = await import('./utils/csvUtils');
            
            const fileType = getFileType(file);
            const importedContacts = await importContactsFromFile(file);
            const validation = validateImportData(importedContacts, contacts);
            
            setImportData(importedContacts);
            setValidationResult(validation);
            setShowImportModal(true);
        } catch (error) {
            console.error('File Import error:', error);
            setError(`ファイルインポートに失敗しました: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    }, [contacts, setError]);

    // インポート確認処理
    const handleConfirmImport = useCallback(async () => {
        if (!validationResult?.validContacts) return;
        
        try {
            setIsImporting(true);
            
            // 各連絡先を追加
            for (const contact of validationResult.validContacts) {
                await handleAddContact(contact);
            }
            
            setShowImportModal(false);
            setImportData(null);
            setValidationResult(null);
            
            // 成功メッセージ
            setError(`${validationResult.validContacts.length}件の連絡先をインポートしました`);
            setTimeout(() => clearAllErrors(), 3000);
        } catch (error) {
            console.error('Import confirmation error:', error);
            setError(`インポート中にエラーが発生しました: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    }, [validationResult, handleAddContact, setError, clearAllErrors]);

    // インポートモーダルを閉じる
    const closeImportModal = useCallback(() => {
        setShowImportModal(false);
        setImportData(null);
        setValidationResult(null);
    }, []);

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
                <div className={`${
                    error?.includes('エクスポートしました') || error?.includes('インポートしました')
                        ? 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-700 text-green-700 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-700 text-red-700 dark:text-red-200'
                } border px-4 py-3 rounded-md relative mb-4 shadow-md`} role="alert">
                    {error || profileError || settingsError}
                    <button
                        onClick={clearAllErrors}
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
                        onExportFile={handleExportFile}
                        onImportFile={handleImportFile}
                        isExporting={isExporting}
                        isImporting={isImporting}
                    />

                    <ContactList
                        contacts={filteredContacts}
                        isLoading={isLoading || isImporting}
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
                    onClose={closeModal}
                    onSave={handleSave}
                    uniqueGroups={uniqueGroups.filter(g => g !== "")}
                />
            )}

            {showImportModal && (
                <CSVImportModal
                    isOpen={showImportModal}
                    onClose={closeImportModal}
                    onConfirm={handleConfirmImport}
                    importData={importData}
                    validationResult={validationResult}
                />
            )}
        </div>
    );
}

export default App;

