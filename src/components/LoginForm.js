import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInAnonymously
} from 'firebase/auth';
import { 
    doc, 
    setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export function LoginForm({ auth, onLoginSuccess, error, setError }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'userid'
    
    // メール認証用
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // ユーザーID認証用
    const [userId, setUserId] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);

    // メールアドレスでのログイン・新規登録
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('メールアドレスとパスワードを入力してください。');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
        } catch (error) {
            console.error('Email authentication error:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('このメールアドレスは登録されていません。');
                    break;
                case 'auth/wrong-password':
                    setError('パスワードが間違っています。');
                    break;
                case 'auth/email-already-in-use':
                    setError('このメールアドレスは既に使用されています。');
                    break;
                case 'auth/weak-password':
                    setError('パスワードは6文字以上で入力してください。');
                    break;
                case 'auth/invalid-email':
                    setError('有効なメールアドレスを入力してください。');
                    break;
                default:
                    setError(`認証エラー: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ユーザーIDでのログイン・新規登録
    const handleUserIdLogin = async (e) => {
        e.preventDefault();
        
        if (isLogin) {
            // ログイン
            if (!userId || !userPassword) {
                setError('ユーザーIDとパスワードを入力してください。');
                return;
            }
            await loginWithUserId();
        } else {
            // 新規登録
            if (!userId || !userPassword || !email || !displayName) {
                setError('すべての項目を入力してください。');
                return;
            }
            await registerWithUserId();
        }
    };

    // ユーザーIDでログイン
    const loginWithUserId = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // ユーザーIDを一時的なメールアドレス形式に変換
            // 例: user123 -> user123@userid.local
            const tempEmail = `${userId}@userid.local`;
            
            // Firebase認証を試行
            await signInWithEmailAndPassword(auth, tempEmail, userPassword);
            onLoginSuccess();
        } catch (error) {
            console.error('UserID authentication error:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('ユーザーIDが見つかりません。');
                    break;
                case 'auth/wrong-password':
                    setError('パスワードが間違っています。');
                    break;
                case 'auth/invalid-email':
                    setError('無効なユーザーIDです。');
                    break;
                default:
                    setError(`ログインエラー: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ユーザーIDで新規登録
    const registerWithUserId = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // ユーザーID形式チェック
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(userId)) {
                setError('ユーザーIDは3-20文字の英数字とアンダースコアのみ使用できます。');
                return;
            }

            // ユーザーIDを一時的なメールアドレス形式に変換
            const tempEmail = `${userId}@userid.local`;

            // Firebase認証でアカウント作成
            const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, userPassword);
            const user = userCredential.user;

            // Firestoreにユーザー認証情報を保存
            await setDoc(doc(db, 'user_credentials', user.uid), {
                userId: userId,
                email: email, // 実際のメールアドレス（復旧用）
                tempEmail: tempEmail, // 認証用の一時メールアドレス
                displayName: displayName,
                createdAt: new Date(),
                authMethod: 'userid'
            });

            onLoginSuccess();
        } catch (error) {
            console.error('UserID registration error:', error);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError('このユーザーIDは既に使用されています。');
                    break;
                case 'auth/weak-password':
                    setError('パスワードは6文字以上で入力してください。');
                    break;
                case 'auth/invalid-email':
                    setError('無効なユーザーIDです。');
                    break;
                default:
                    setError(`登録エラー: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            onLoginSuccess();
        } catch (error) {
            console.error('Google authentication error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                setError('ログインがキャンセルされました。');
            } else {
                setError(`Googleログインエラー: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await signInAnonymously(auth);
            onLoginSuccess();
        } catch (error) {
            console.error('Anonymous authentication error:', error);
            setError(`匿名ログインエラー: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-2">
                        顧客名簿
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isLogin ? 'ログイン' : '新規登録'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {/* ログイン方法選択 */}
                <div className="mb-6">
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setLoginMethod('email')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                loginMethod === 'email'
                                    ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-sky-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                            disabled={isLoading}
                        >
                            📧 メールアドレス
                        </button>
                        <button
                            onClick={() => setLoginMethod('userid')}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                loginMethod === 'userid'
                                    ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-sky-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                            disabled={isLoading}
                        >
                            👤 ユーザーID
                        </button>
                    </div>
                </div>

                {/* メールアドレス認証フォーム */}
                {loginMethod === 'email' && (
                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                メールアドレス
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="example@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                パスワード
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="パスワード"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-150 ease-in-out"
                        >
                            {isLoading ? '処理中...' : (isLogin ? 'ログイン' : '新規登録')}
                        </button>
                    </form>
                )}

                {/* ユーザーID認証フォーム */}
                {loginMethod === 'userid' && (
                    <form onSubmit={handleUserIdLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ユーザーID
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="user123"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                3-20文字の英数字とアンダースコア
                            </p>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        表示名
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        placeholder="田中太郎"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        メールアドレス
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        placeholder="example@email.com"
                                        disabled={isLoading}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        アカウント復旧用（必須）
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                パスワード
                            </label>
                            <input
                                type="password"
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="パスワード"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-150 ease-in-out"
                        >
                            {isLoading ? '処理中...' : (isLogin ? 'ログイン' : '新規登録')}
                        </button>
                    </form>
                )}

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">または</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Googleでログイン
                        </button>

                        <button
                            onClick={handleAnonymousLogin}
                            disabled={isLoading}
                            className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-150 ease-in-out"
                        >
                            ゲストとして利用
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
                        disabled={isLoading}
                    >
                        {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
                    </button>
                </div>
            </div>
        </div>
    );
} 