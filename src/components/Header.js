import React, { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Header({ user, userId, userProfile, theme, setTheme, onSignOut, updateProfile }) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // 表示名を取得
    const getDisplayName = () => {
        if (userProfile?.displayName) {
            return userProfile.displayName;
        }
        if (user?.displayName) {
            return user.displayName;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return 'ユーザー';
    };

    // 編集開始
    const startEditing = () => {
        setEditingName(getDisplayName());
        setIsEditingName(true);
    };

    // 編集キャンセル
    const cancelEditing = () => {
        setIsEditingName(false);
        setEditingName('');
    };

    // 表示名保存
    const saveDisplayName = async () => {
        if (!editingName.trim() || !updateProfile) return;

        setIsUpdating(true);
        try {
            await updateProfile({ displayName: editingName.trim() });
            setIsEditingName(false);
            setEditingName('');
        } catch (error) {
            console.error('Error updating display name:', error);
            alert('表示名の更新に失敗しました。');
        } finally {
            setIsUpdating(false);
        }
    };

    // Enterキーで保存
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            saveDisplayName();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    return (
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-sky-600 dark:text-sky-400">顧客名簿</h1>
                {userId && (
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 space-y-1">
                        {user?.email ? (
                            <div className="flex items-center justify-center sm:justify-start">
                                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded mr-2">
                                    🔒 プライベート
                                </span>
                                <div className="flex items-center">
                                    <span className="mr-2">ログイン中:</span>
                                    {isEditingName ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                placeholder="表示名を入力"
                                                disabled={isUpdating}
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveDisplayName}
                                                disabled={isUpdating || !editingName.trim()}
                                                className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                                                title="保存"
                                            >
                                                {isUpdating ? '⏳' : '✅'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                disabled={isUpdating}
                                                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                                                title="キャンセル"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {getDisplayName()}
                                            </span>
                                            {updateProfile && (
                                                <button
                                                    onClick={startEditing}
                                                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="表示名を編集"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : user?.isAnonymous || userProfile?.isLocalProfile ? (
                            <div className="flex items-center justify-center sm:justify-start">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mr-2">
                                    🎭 ゲストモード
                                </span>
                                <div className="flex items-center">
                                    {isEditingName ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                placeholder="表示名を入力"
                                                disabled={isUpdating}
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveDisplayName}
                                                disabled={isUpdating || !editingName.trim()}
                                                className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                                                title="保存"
                                            >
                                                {isUpdating ? '⏳' : '✅'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                disabled={isUpdating}
                                                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                                                title="キャンセル"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {getDisplayName()}
                                            </span>
                                            {updateProfile && (
                                                <button
                                                    onClick={startEditing}
                                                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="表示名を編集"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center sm:justify-start">
                                <span className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1 rounded mr-2">
                                    🔒 個人用
                                </span>
                                <div className="flex items-center">
                                    {isEditingName ? (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                className="px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                placeholder="表示名を入力"
                                                disabled={isUpdating}
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveDisplayName}
                                                disabled={isUpdating || !editingName.trim()}
                                                className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                                                title="保存"
                                            >
                                                {isUpdating ? '⏳' : '✅'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                disabled={isUpdating}
                                                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                                                title="キャンセル"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {getDisplayName()}
                                            </span>
                                            {updateProfile && (
                                                <button
                                                    onClick={startEditing}
                                                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="表示名を編集"
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-slate-500">
                            {user?.isAnonymous || userProfile?.isLocalProfile 
                                ? 'データはこのブラウザにのみ保存されます' 
                                : 'あなたのデータは他のユーザーには表示されません'
                            }
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
                {userId && (
                    <button
                        onClick={onSignOut}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-150 ease-in-out text-sm"
                    >
                        ログアウト
                    </button>
                )}
            </div>
        </header>
    );
} 