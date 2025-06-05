import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Header({ user, userId, theme, setTheme, onSignOut }) {
    return (
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-3xl md:text-4xl font-bold text-sky-600 dark:text-sky-400">顧客名簿</h1>
                {userId && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {userId === 'demo-user' ? (
                            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                デモモード（ローカルストレージ使用）
                            </span>
                        ) : user?.email ? (
                            `ログイン中: ${user.email}`
                        ) : user?.isAnonymous ? (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                ゲストユーザー
                            </span>
                        ) : (
                            `ユーザーID: ${userId}`
                        )}
                    </p>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
                {userId && userId !== 'demo-user' && (
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