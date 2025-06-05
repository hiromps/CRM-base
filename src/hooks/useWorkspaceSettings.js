import { useState, useEffect } from 'react';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    Timestamp 
} from 'firebase/firestore';

export function useWorkspaceSettings({ db, userId, currentGroupId, user }) {
    const [workspaceSettings, setWorkspaceSettings] = useState(null);
    const [isSettingsLoading, setIsSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState(null);

    // ワークスペース設定の読み込み
    const loadWorkspaceSettings = async (workspaceId) => {
        if (!db || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            setWorkspaceSettings(null);
            return;
        }

        setIsSettingsLoading(true);
        setSettingsError(null);

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            if (workspaceDoc.exists()) {
                setWorkspaceSettings(workspaceDoc.data());
            } else {
                setWorkspaceSettings(null);
            }
        } catch (error) {
            console.error('Error loading workspace settings:', error);
            setSettingsError(`ワークスペース設定の読み込みに失敗しました: ${error.message}`);
            setWorkspaceSettings(null);
        } finally {
            setIsSettingsLoading(false);
        }
    };

    // ワークスペース設定の作成・更新
    const updateWorkspaceSettings = async (workspaceId, settings) => {
        if (!db || !userId || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            return false;
        }

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            const settingsData = {
                ...settings,
                updatedAt: Timestamp.now(),
                updatedBy: userId
            };

            if (!workspaceDoc.exists()) {
                // 新規作成
                await setDoc(workspaceDocRef, {
                    ...settingsData,
                    workspaceId,
                    createdBy: userId,
                    createdAt: Timestamp.now()
                });
            } else {
                // 更新（作成者のみ可能）
                const existingData = workspaceDoc.data();
                if (existingData.createdBy !== userId) {
                    throw new Error('このワークスペースの設定を変更する権限がありません。');
                }
                await updateDoc(workspaceDocRef, settingsData);
            }

            // 設定を再読み込み
            await loadWorkspaceSettings(workspaceId);
            return true;
        } catch (error) {
            console.error('Error updating workspace settings:', error);
            setSettingsError(`ワークスペース設定の更新に失敗しました: ${error.message}`);
            return false;
        }
    };

    // パスワード確認
    const verifyWorkspacePassword = async (workspaceId, password) => {
        if (!db || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            return true; // 個人ワークスペースやゲストは常に許可
        }

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            if (!workspaceDoc.exists()) {
                return true; // 設定がない場合は許可
            }

            const settings = workspaceDoc.data();
            if (!settings.hasPassword) {
                return true; // パスワードが設定されていない場合は許可
            }

            return settings.password === password;
        } catch (error) {
            console.error('Error verifying workspace password:', error);
            return false;
        }
    };

    // 現在のワークスペースが変更された時に設定を読み込み
    useEffect(() => {
        if (currentGroupId) {
            loadWorkspaceSettings(currentGroupId);
        } else {
            setWorkspaceSettings(null);
        }
    }, [currentGroupId, db, userId]);

    // ワークスペースの管理者かどうかを判定
    const isWorkspaceAdmin = workspaceSettings?.createdBy === userId;

    return {
        workspaceSettings,
        isSettingsLoading,
        settingsError,
        isWorkspaceAdmin,
        updateWorkspaceSettings,
        verifyWorkspacePassword,
        setSettingsError
    };
} 