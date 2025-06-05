import React, { useState } from 'react';

export function GroupSelector({ 
    userProfile, 
    currentGroupId, 
    onGroupChange, 
    joinGroup, 
    leaveGroup,
    verifyWorkspacePassword 
}) {
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [newGroupId, setNewGroupId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const memberGroups = userProfile?.memberOfGroups || [];

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!newGroupId.trim()) return;

        setIsLoading(true);
        setPasswordError('');

        try {
            // パスワード確認
            const isPasswordValid = await verifyWorkspacePassword(newGroupId.trim(), password);
            
            if (!isPasswordValid) {
                setPasswordError('あいことばが正しくありません。');
                setIsLoading(false);
                return;
            }

            await joinGroup(newGroupId.trim());
            setNewGroupId('');
            setPassword('');
            setShowJoinForm(false);
        } catch (error) {
            console.error('Error joining group:', error);
            setPasswordError('参加に失敗しました。ワークスペース名を確認してください。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (memberGroups.length <= 1) {
            alert('最低1つのワークスペースに所属している必要があります。');
            return;
        }

        if (confirm(`ワークスペース "${getGroupDisplayName(groupId)}" から退出しますか？`)) {
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

    const getGroupDisplayName = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return '個人ワークスペース';
        }
        return groupId;
    };

    const getGroupDescription = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return 'あなた専用のプライベートな連絡先管理';
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
                                {getGroupIcon(groupId)} {getGroupDisplayName(groupId)}
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
                        onClick={() => setShowJoinForm(!showJoinForm)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                    >
                        <span className="mr-2">🤝</span>
                        {showJoinForm ? 'キャンセル' : 'チームワークスペースに参加'}
                    </button>
                    
                    {currentGroupId && !currentGroupId.startsWith('personal_') && (
                        <button
                            onClick={() => handleLeaveGroup(currentGroupId)}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm flex items-center justify-center"
                        >
                            <span className="mr-2">🚪</span>
                            退出
                        </button>
                    )}
                </div>

                {/* 参加フォーム */}
                {showJoinForm && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-blue-200 dark:border-slate-600">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <span className="mr-2">🎯</span>
                            チームワークスペースに参加
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            チームメンバーから教えてもらった<strong>ワークスペース名</strong>を入力してください。
                            参加すると、そのチームの連絡先を共有できるようになります。
                        </p>
                        
                        <form onSubmit={handleJoinGroup} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ワークスペース名
                                </label>
                                <input
                                    type="text"
                                    value={newGroupId}
                                    onChange={(e) => setNewGroupId(e.target.value)}
                                    placeholder="例: 営業チーム、開発部、プロジェクトA など"
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    あいことば（必要な場合のみ）
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="あいことばを入力..."
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ワークスペースがパスワード保護されている場合は入力してください
                                </p>
                            </div>

                            {passwordError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                                        <span className="mr-2">❌</span>
                                        {passwordError}
                                    </p>
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || !newGroupId.trim()}
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
                                        setPasswordError('');
                                        setPassword('');
                                        setNewGroupId('');
                                    }}
                                    className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-150 ease-in-out"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start">
                                <span className="mr-2 mt-0.5">💡</span>
                                <span>
                                    <strong>ヒント:</strong> ワークスペース名とあいことば（設定されている場合）は、チームリーダーや管理者から教えてもらってください。
                                    参加後は、そのチームの連絡先を閲覧・編集できるようになります。
                                </span>
                            </p>
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
                                    {getGroupIcon(groupId)} {getGroupDisplayName(groupId)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 