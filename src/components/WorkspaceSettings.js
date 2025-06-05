import React, { useState } from 'react';

export function WorkspaceSettings({ 
    currentGroupId, 
    workspaceSettings, 
    isWorkspaceAdmin, 
    updateWorkspaceSettings,
    isSettingsLoading 
}) {
    const [showSettings, setShowSettings] = useState(false);
    const [password, setPassword] = useState('');
    const [hasPassword, setHasPassword] = useState(false);
    const [description, setDescription] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // 個人ワークスペースの場合は表示しない
    if (!currentGroupId || currentGroupId.startsWith('personal_')) {
        return null;
    }

    // 設定を開く時に現在の値を読み込み
    const handleOpenSettings = () => {
        if (workspaceSettings) {
            setPassword(workspaceSettings.password || '');
            setHasPassword(workspaceSettings.hasPassword || false);
            setDescription(workspaceSettings.description || '');
        } else {
            setPassword('');
            setHasPassword(false);
            setDescription('');
        }
        setShowSettings(true);
    };

    const handleSaveSettings = async () => {
        setIsUpdating(true);
        try {
            const settings = {
                hasPassword,
                password: hasPassword ? password : '',
                description: description.trim()
            };

            const success = await updateWorkspaceSettings(currentGroupId, settings);
            if (success) {
                setShowSettings(false);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="mb-4">
            {/* 設定ボタン */}
            {isWorkspaceAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleOpenSettings}
                        className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-all duration-150 ease-in-out flex items-center"
                        disabled={isSettingsLoading}
                    >
                        <span className="mr-2">⚙️</span>
                        ワークスペース設定
                    </button>
                </div>
            )}

            {/* ワークスペース情報表示 */}
            {workspaceSettings && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
                                <span className="mr-2">🔒</span>
                                {workspaceSettings.hasPassword ? 'パスワード保護されています' : 'オープンワークスペース'}
                            </p>
                            {workspaceSettings.description && (
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    {workspaceSettings.description}
                                </p>
                            )}
                        </div>
                        {isWorkspaceAdmin && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                管理者
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* 設定モーダル */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                    <span className="mr-2">⚙️</span>
                                    ワークスペース設定
                                </h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* ワークスペース名 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ワークスペース名
                                    </label>
                                    <input
                                        type="text"
                                        value={currentGroupId}
                                        disabled
                                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ワークスペース名は変更できません
                                    </p>
                                </div>

                                {/* 説明 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        説明（任意）
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="このワークスペースの用途や説明を入力..."
                                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all resize-none"
                                        rows="3"
                                    />
                                </div>

                                {/* パスワード設定 */}
                                <div>
                                    <div className="flex items-center mb-3">
                                        <input
                                            type="checkbox"
                                            id="hasPassword"
                                            checked={hasPassword}
                                            onChange={(e) => setHasPassword(e.target.checked)}
                                            className="mr-3 h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="hasPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            あいことば（パスワード）で保護する
                                        </label>
                                    </div>

                                    {hasPassword && (
                                        <div>
                                            <input
                                                type="text"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="あいことばを入力..."
                                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            />
                                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start">
                                                    <span className="mr-2 mt-0.5">⚠️</span>
                                                    <span>
                                                        <strong>重要:</strong> あいことばを設定すると、新しいメンバーが参加する際にこのあいことばの入力が必要になります。
                                                        あいことばは忘れないよう注意してください。
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ボタン */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out"
                                    disabled={isUpdating}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isUpdating || (hasPassword && !password.trim())}
                                    className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                                >
                                    {isUpdating ? (
                                        <>
                                            <span className="mr-2">⏳</span>
                                            保存中...
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">💾</span>
                                            保存
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 