import { useState, useEffect, useRef } from 'react';

export function useTheme() {
    // 初期テーマの取得
    const getInitialTheme = () => {
        if (typeof window === 'undefined') return 'system';
        try {
            return localStorage.getItem('theme') || 'system';
        } catch {
            return 'system';
        }
    };

    const [theme, setThemeState] = useState(getInitialTheme);
    const isUpdatingRef = useRef(false);

    // テーマを実際に適用する関数
    const applyTheme = (currentTheme) => {
        if (typeof window === 'undefined' || isUpdatingRef.current) return;
        
        isUpdatingRef.current = true;
        
        try {
            const root = document.documentElement;
            const isDark = currentTheme === 'dark' || 
                (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            // DOMを直接更新
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            
            // localStorageに保存
            localStorage.setItem('theme', currentTheme);
        } catch (error) {
            console.error('Theme update error:', error);
        } finally {
            isUpdatingRef.current = false;
        }
    };

    // テーマ変更時の処理
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // システムテーマ変更の監視
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let mediaQuery;
        let timeoutId;

        try {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemChange = () => {
                if (theme === 'system' && !isUpdatingRef.current) {
                    // デバウンス処理
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        applyTheme('system');
                    }, 100);
                }
            };

            // イベントリスナーを追加
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleSystemChange);
            } else {
                mediaQuery.addListener(handleSystemChange);
            }

            return () => {
                clearTimeout(timeoutId);
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', handleSystemChange);
                } else {
                    mediaQuery.removeListener(handleSystemChange);
                }
            };
        } catch (error) {
            console.error('Media query error:', error);
        }
    }, [theme]);

    // テーマ設定関数
    const setTheme = (newTheme) => {
        if (newTheme === theme || isUpdatingRef.current) return;
        setThemeState(newTheme);
    };

    return [theme, setTheme];
} 