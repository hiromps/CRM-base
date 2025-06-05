import React, { useState } from 'react';

export function GroupSelector({ 
    userProfile, 
    currentGroupId, 
    onGroupChange, 
    joinGroup, 
    leaveGroup 
}) {
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [newGroupId, setNewGroupId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const memberGroups = userProfile?.memberOfGroups || [];

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!newGroupId.trim()) return;

        setIsLoading(true);
        try {
            await joinGroup(newGroupId.trim());
            setNewGroupId('');
            setShowJoinForm(false);
        } catch (error) {
            console.error('Error joining group:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (memberGroups.length <= 1) {
            alert('最低1つのグループに所属している必要があります。');
            return;
        }

        if (confirm(`グループ "${groupId}" から脱退しますか？`)) {
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
            return '🏠 個人用';
        }
        return `👥 ${groupId}`;
    };

    const getGroupDescription = (groupId) => {
        if (groupId.startsWith('personal_')) {
            return 'あなた専用のプライベートな連絡先';
        }
        return 'チームで共有する連絡先';
    };

    return (
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        アクティブなグループ
                    </label>
                    <select
                        value={currentGroupId || ''}
                        onChange={(e) => onGroupChange(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    >
                        {memberGroups.map(groupId => (
                            <option key={groupId} value={groupId}>
                                {getGroupDisplayName(groupId)}
                            </option>
                        ))}
                    </select>
                    {currentGroupId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getGroupDescription(currentGroupId)}
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowJoinForm(!showJoinForm)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm"
                    >
                        グループ参加
                    </button>
                    
                    {currentGroupId && !currentGroupId.startsWith('personal_') && (
                        <button
                            onClick={() => handleLeaveGroup(currentGroupId)}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm"
                        >
                            脱退
                        </button>
                    )}
                </div>
            </div>

            {showJoinForm && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <form onSubmit={handleJoinGroup} className="flex gap-2">
                        <input
                            type="text"
                            value={newGroupId}
                            onChange={(e) => setNewGroupId(e.target.value)}
                            placeholder="グループIDを入力..."
                            className="flex-grow p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !newGroupId.trim()}
                            className="bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out"
                        >
                            {isLoading ? '参加中...' : '参加'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowJoinForm(false)}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out"
                        >
                            キャンセル
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        グループIDは他のメンバーから教えてもらってください。
                    </p>
                </div>
            )}

            {memberGroups.length > 1 && (
                <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        所属グループ: {memberGroups.length}個
                    </p>
                </div>
            )}
        </div>
    );
} 