import React, { useState } from 'react';

export function WorkspaceSettings({ 
    currentGroupId, 
    workspaceSettings, 
    isWorkspaceAdmin, 
    updateWorkspaceSettings,
    isSettingsLoading 
}) {
    const [showSettings, setShowSettings] = useState(false);
    const [description, setDescription] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // 個人ワークスペースの場合は表示しない
    if (!currentGroupId || currentGroupId.startsWith('personal_')) {
        return null;
    }

    // 設定を開く時に現在の値を読み込み
    const handleOpenSettings = () => {
        if (workspaceSettings) {
            setDescription(workspaceSettings.description || '');
        } else {
            setDescription('');
        }
        setShowSettings(true);
    };

    const handleSaveSettings = async () => {
        setIsUpdating(true);
        try {
            const settings = {
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
            {workspaceSettings && workspaceSettings.description && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
                                <span className="mr-2">📝</span>
                                {workspaceSettings.description}
                            </p>
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
                                        value={workspaceSettings?.displayName || currentGroupId}
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
                                        rows="4"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ワークスペースの用途や目的を説明してください
                                    </p>
                                </div>

                                {/* 招待コード情報 */}
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-200 flex items-start">
                                        <span className="mr-2 mt-0.5">🔗</span>
                                        <span>
                                            <strong>招待システム:</strong> このワークスペースは招待コードで保護されています。
                                            新しいメンバーを招待するには、「招待コード生成」ボタンから6桁のコードを作成してください。
                                        </span>
                                    </p>
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
                                    disabled={isUpdating}
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