import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from './icons';

export function ThemeSwitcher({ theme, setTheme }) {
    const themes = [
        { name: 'light', icon: <SunIcon />, label: 'ライト' },
        { name: 'dark', icon: <MoonIcon />, label: 'ダーク' },
        { name: 'system', icon: <ComputerDesktopIcon />, label: 'システム' },
    ];

    const handleClick = (themeName) => {
        if (themeName !== theme) {
            setTheme(themeName);
        }
    };

    return (
        <div className="flex items-center space-x-1 bg-gray-200 dark:bg-slate-700 p-1 rounded-lg">
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => handleClick(t.name)}
                    className={`p-2 rounded-md transition-colors ${
                        theme === t.name
                            ? 'bg-white dark:bg-slate-500 text-sky-600 dark:text-sky-400 shadow'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                    }`}
                    title={`${t.label}モード`}
                    aria-pressed={theme === t.name}
                    type="button"
                >
                    {t.icon}
                    <span className="sr-only">{t.label}モード</span>
                </button>
            ))}
        </div>
    );
} 