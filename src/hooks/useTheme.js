import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system'; // Default for SSR or non-browser environments
    });

    const applyTheme = useCallback((newTheme) => {
        const root = window.document.documentElement;
        const isDark =
            newTheme === 'dark' ||
            (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
        }
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    useEffect(() => {
        if (typeof window === 'undefined') return; // Guard for non-browser environments

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    return [theme, setThemeState];
} 