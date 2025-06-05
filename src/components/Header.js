import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Header({ user, userId, theme, setTheme, onSignOut }) {
    return (
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-sky-600 dark:text-sky-400">顧客名簿</h1>
                {userId && (
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 space-y-1">
                        {user?.email ? (
                            <div>
                                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded mr-2">
                                    🔒 プライベート
                                </span>
                                <span>ログイン中: {user.email}</span>
                            </div>
                        ) : user?.isAnonymous ? (
                            <div>
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mr-2">
                                    🔒 ゲスト専用
                                </span>
                                <span>ゲストユーザー</span>
                            </div>
                        ) : (
                            <div>
                                <span className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-2 py-1 rounded mr-2">
                                    🔒 個人用
                                </span>
                                <span>ユーザーID: {userId.substring(0, 8)}...</span>
                            </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-slate-500">
                            あなたのデータは他のユーザーには表示されません
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