import React, { useState } from 'react';

export function GroupSelector({ 
    userProfile, 
    currentGroupId, 
    onGroupChange, 
    joinGroup, 
    leaveGroup,
    createWorkspace,
    joinWorkspaceByCode,
    generateInviteCode,
    workspaceInfo,
    workspacesInfo,
    getWorkspaceDisplayName
}) {
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceDescription, setWorkspaceDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInviteCode, setShowInviteCode] = useState(false);
    const [generatedInviteCode, setGeneratedInviteCode] = useState('');

    const memberGroups = userProfile?.memberOfGroups || [];

    // ワークスペース作成
    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (!workspaceName.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const workspaceId = await createWorkspace(workspaceName.trim(), workspaceDescription.trim());
            setWorkspaceName('');
            setWorkspaceDescription('');
            setShowCreateForm(false);
            onGroupChange(workspaceId);
        } catch (error) {
            console.error('Error creating workspace:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 招待コードで参加
    const handleJoinByInviteCode = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const workspaceId = await joinWorkspaceByCode(inviteCode.trim());
            setInviteCode('');
            setShowJoinForm(false);
            onGroupChange(workspaceId);
        } catch (error) {
            console.error('Error joining workspace:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 招待コード生成
    const handleGenerateInviteCode = async () => {
        if (currentGroupId && !currentGroupId.startsWith('personal_')) {
            setIsLoading(true);
            try {
                const code = await generateInviteCode(currentGroupId);
                setGeneratedInviteCode(code);
                setShowInviteCode(true);
            } catch (error) {
                console.error('Error generating invite code:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // 招待コードをクリップボードにコピー
    const copyInviteCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedInviteCode);
            alert('招待コードをクリップボードにコピーしました！');
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('コピーに失敗しました。手動でコピーしてください。');
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (memberGroups.length <= 1) {
            alert('最低1つのワークスペースに所属している必要があります。');
            return;
        }

        const workspaceName = getWorkspaceDisplayName ? getWorkspaceDisplayName(groupId) : getGroupDisplayNameLocal(groupId);
        if (confirm(`ワークスペース "${workspaceName}" から退出しますか？`)) {
            try {
                await leaveGroup(groupId);
                // 現在のグループから脱退した場合、別のグループに切り替え
                if (currentGroupId === groupId) {
                    const remainingGroups = memberGroups.filter(id => id !== groupId);
                    if (remainingGroups.length > 0) {
                        onGroupChange(remainingGroups[0]);
                    }
                }
            } catch (error) {
                console.error('Error leaving group:', error);
            }
        }
    };

    // ローカルの表示名取得関数（フォールバック用）
    const getGroupDisplayNameLocal = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return '個人ワークスペース';
        }
        
        // 新しいワークスペース情報から取得
        if (workspacesInfo && workspacesInfo[groupId]) {
            return workspacesInfo[groupId].displayName;
        }
        
        // 現在のワークスペース情報から取得（フォールバック）
        if (workspaceInfo && workspaceInfo.id === groupId) {
            return workspaceInfo.displayName || groupId;
        }
        
        return groupId;
    };

    // 統一された表示名取得関数
    const getDisplayName = (groupId) => {
        if (getWorkspaceDisplayName) {
            return getWorkspaceDisplayName(groupId);
        }
        return getGroupDisplayNameLocal(groupId);
    };

    const getGroupDescription = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return 'あなた専用のプライベートな連絡先管理';
        }
        
        // 新しいワークスペース情報から取得
        if (workspacesInfo && workspacesInfo[groupId]) {
            return workspacesInfo[groupId].description || 'チームメンバーと共有する連絡先管理';
        }
        
        // 現在のワークスペース情報から取得（フォールバック）
        if (workspaceInfo && workspaceInfo.id === groupId) {
            return workspaceInfo.description || 'チームメンバーと共有する連絡先管理';
        }
        
        return 'チームメンバーと共有する連絡先管理';
    };

    const getGroupIcon = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return '🏠';
        }
        return '👥';
    };

    return (
        <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col space-y-4">
                {/* ワークスペース選択 */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        📁 ワークスペース選択
                    </label>
                    <select
                        value={currentGroupId || ''}
                        onChange={(e) => onGroupChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-base"
                    >
                        {memberGroups.map(groupId => (
                            <option key={groupId} value={groupId}>
                                {getGroupIcon(groupId)} {getDisplayName(groupId)}
                            </option>
                        ))}
                    </select>
                    {currentGroupId && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700 p-2 rounded">
                            💡 {getGroupDescription(currentGroupId)}
                        </p>
                    )}
                </div>

                {/* アクションボタン */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                    >
                        <span className="mr-2">✨</span>
                        {showCreateForm ? 'キャンセル' : '新しいワークスペースを作成'}
                    </button>
                    
                    <button
                        onClick={() => setShowJoinForm(!showJoinForm)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                    >
                        <span className="mr-2">🤝</span>
                        {showJoinForm ? 'キャンセル' : '招待コードで参加'}
                    </button>

                    {currentGroupId && !currentGroupId.startsWith('personal_') && (
                        <>
                            <button
                                onClick={handleGenerateInviteCode}
                                disabled={isLoading}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-purple-300 disabled:to-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                            >
                                <span className="mr-2">🔗</span>
                                {isLoading ? '生成中...' : '招待コード生成'}
                            </button>
                            
                            <button
                                onClick={() => handleLeaveGroup(currentGroupId)}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                            >
                                <span className="mr-2">🚪</span>
                                退出
                            </button>
                        </>
                    )}
                </div>

                {/* ワークスペース作成フォーム */}
                {showCreateForm && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-blue-200 dark:border-slate-600">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <span className="mr-2">✨</span>
                            新しいワークスペースを作成
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            あなた専用のチームワークスペースを作成します。作成後、6桁の招待コードを使って他のメンバーを招待できます。
                        </p>
                        
                        <form onSubmit={handleCreateWorkspace} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ワークスペース名 *
                                </label>
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    placeholder="例: 営業チーム、開発部、プロジェクトA など"
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    説明（任意）
                                </label>
                                <textarea
                                    value={workspaceDescription}
                                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                                    placeholder="このワークスペースの用途や説明を入力..."
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none"
                                    rows="3"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                                        <span className="mr-2">❌</span>
                                        {error}
                                    </p>
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || !workspaceName.trim()}
                                    className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="mr-2">⏳</span>
                                            作成中...
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">✅</span>
                                            作成する
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setError('');
                                        setWorkspaceName('');
                                        setWorkspaceDescription('');
                                    }}
                                    className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-150 ease-in-out"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 招待コードで参加フォーム */}
                {showJoinForm && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-green-200 dark:border-slate-600">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <span className="mr-2">🎯</span>
                            招待コードでワークスペースに参加
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            チームメンバーから受け取った<strong>6桁の招待コード</strong>を入力してください。
                            招待コードは安全で、有効期限は7日間です。
                        </p>
                        
                        <form onSubmit={handleJoinByInviteCode} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    招待コード（6桁の数字） *
                                </label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => {
                                        // 数字のみ入力を許可し、6桁まで制限
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setInviteCode(value);
                                    }}
                                    placeholder="例: 123456"
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-mono text-lg text-center tracking-widest"
                                    disabled={isLoading}
                                    maxLength="6"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    6桁の数字を入力してください
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                                        <span className="mr-2">❌</span>
                                        {error}
                                    </p>
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || inviteCode.length !== 6}
                                    className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="mr-2">⏳</span>
                                            参加中...
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">✅</span>
                                            参加する
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowJoinForm(false);
                                        setError('');
                                        setInviteCode('');
                                    }}
                                    className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-150 ease-in-out"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
                                <span className="mr-2 mt-0.5">🔒</span>
                                <span>
                                    <strong>セキュリティ:</strong> 招待コードは6桁の数字で、有効期限があります。
                                    信頼できる人からのコードのみを使用してください。
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* 招待コード表示モーダル */}
                {showInviteCode && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                        <span className="mr-2">🔗</span>
                                        招待コード
                                    </h3>
                                    <button
                                        onClick={() => setShowInviteCode(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    この6桁のコードを他のメンバーに共有して、ワークスペースに招待してください。
                                    <strong>有効期限は7日間</strong>です。
                                </p>
                                
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-lg mb-4 text-center">
                                    <div className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-widest">
                                        {generatedInviteCode}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        6桁の招待コード
                                    </p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={copyInviteCode}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                                    >
                                        <span className="mr-2">📋</span>
                                        コピー
                                    </button>
                                    <button
                                        onClick={() => setShowInviteCode(false)}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out"
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ワークスペース情報 */}
                {memberGroups.length > 1 && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <span className="mr-2">📊</span>
                            参加中のワークスペース: <strong className="ml-1">{memberGroups.length}個</strong>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {memberGroups.map(groupId => (
                                <span 
                                    key={groupId}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        groupId === currentGroupId 
                                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' 
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {getGroupIcon(groupId)} {getDisplayName(groupId)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 