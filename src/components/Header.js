import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Header({ userId, theme, setTheme }) {
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
                        ) : (
                            `ユーザーID: ${userId}`
                        )}
                    </p>
                )}
            </div>
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </header>
    );
} 