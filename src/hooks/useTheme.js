import { useState, useEffect } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system';
    });

    // テーマを適用する関数
    const applyTheme = (currentTheme) => {
        if (typeof window === 'undefined') return;
        
        const root = document.documentElement;
        const isDark = currentTheme === 'dark' || 
            (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        localStorage.setItem('theme', currentTheme);
    };

    // テーマが変更された時に適用
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // システムテーマの変更を監視（systemモードの場合のみ）
    useEffect(() => {
        if (typeof window === 'undefined' || theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, [theme]);

    return [theme, setTheme];
} 