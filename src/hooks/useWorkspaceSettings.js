import { useState, useEffect } from 'react';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    Timestamp,
    collection,
    addDoc
} from 'firebase/firestore';

// 6桁のランダムな数字を生成
function generateInviteCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useWorkspaceSettings({ db, userId, currentGroupId, user }) {
    const [workspaceSettings, setWorkspaceSettings] = useState(null);
    const [workspaceInfo, setWorkspaceInfo] = useState(null);
    const [workspacesInfo, setWorkspacesInfo] = useState({}); // 複数のワークスペース情報
    const [isSettingsLoading, setIsSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState(null);

    // 複数のワークスペース情報を読み込み
    const loadWorkspacesInfo = async (workspaceIds) => {
        if (!db || !workspaceIds || workspaceIds.length === 0 || user?.isAnonymous) {
            return;
        }

        try {
            const workspacesData = {};
            
            // 各ワークスペースの情報を並行して取得
            const promises = workspaceIds
                .filter(id => !id.startsWith('personal_')) // 個人ワークスペースは除外
                .map(async (workspaceId) => {
                    try {
                        const workspaceDocRef = doc(db, 'workspaces', workspaceId);
                        const workspaceDoc = await getDoc(workspaceDocRef);
                        
                        if (workspaceDoc.exists()) {
                            const data = workspaceDoc.data();
                            // 公開情報のみを設定
                            workspacesData[workspaceId] = {
                                id: data.id,
                                displayName: data.displayName,
                                description: data.description,
                                createdBy: data.createdBy,
                                createdAt: data.createdAt,
                                memberCount: data.memberCount,
                                isPrivate: data.isPrivate
                            };
                        }
                    } catch (error) {
                        console.error(`Error loading workspace ${workspaceId}:`, error);
                    }
                });

            await Promise.all(promises);
            setWorkspacesInfo(workspacesData);
        } catch (error) {
            console.error('Error loading workspaces info:', error);
        }
    };

    // ワークスペース情報の読み込み（公開情報のみ）
    const loadWorkspaceInfo = async (workspaceId) => {
        if (!db || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            setWorkspaceInfo(null);
            return;
        }

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            if (workspaceDoc.exists()) {
                const data = workspaceDoc.data();
                // 公開情報のみを設定
                const publicInfo = {
                    id: data.id,
                    displayName: data.displayName,
                    description: data.description,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt,
                    memberCount: data.memberCount,
                    isPrivate: data.isPrivate
                };
                setWorkspaceInfo(publicInfo);
            } else {
                setWorkspaceInfo(null);
            }
        } catch (error) {
            console.error('Error loading workspace info:', error);
            setWorkspaceInfo(null);
        }
    };

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
                const data = workspaceDoc.data();
                setWorkspaceSettings(data);
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
                    id: workspaceId,
                    createdBy: userId,
                    createdAt: Timestamp.now(),
                    memberCount: 1,
                    isPrivate: true
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
            await loadWorkspaceInfo(workspaceId);
            return true;
        } catch (error) {
            console.error('Error updating workspace settings:', error);
            setSettingsError(`ワークスペース設定の更新に失敗しました: ${error.message}`);
            return false;
        }
    };

    // 招待コードを生成
    const generateInviteCodeForWorkspace = async (workspaceId) => {
        if (!db || !userId || user?.isAnonymous) {
            throw new Error('招待コードの生成にはログインが必要です');
        }

        try {
            const inviteCode = generateInviteCode();
            
            // invite_codes コレクションに保存
            const inviteCodeData = {
                code: inviteCode,
                workspaceId: workspaceId,
                createdBy: userId,
                createdAt: Timestamp.now(),
                usedCount: 0
            };

            await addDoc(collection(db, 'invite_codes'), inviteCodeData);
            
            return inviteCode;
        } catch (error) {
            console.error('Error generating invite code:', error);
            throw new Error(`招待コードの生成に失敗しました: ${error.message}`);
        }
    };

    // 特定のワークスペース情報を取得
    const getWorkspaceDisplayName = (workspaceId) => {
        if (workspaceId.startsWith('personal_')) {
            return '個人ワークスペース';
        }
        return workspacesInfo[workspaceId]?.displayName || workspaceId;
    };

    // 現在のワークスペースが変更された時に設定を読み込み
    useEffect(() => {
        if (currentGroupId) {
            loadWorkspaceSettings(currentGroupId);
            loadWorkspaceInfo(currentGroupId);
        } else {
            setWorkspaceSettings(null);
            setWorkspaceInfo(null);
        }
    }, [currentGroupId, db, userId]);

    // ワークスペースの管理者かどうかを判定
    const isWorkspaceAdmin = workspaceSettings?.createdBy === userId;

    return {
        workspaceSettings,
        workspaceInfo,
        workspacesInfo,
        isSettingsLoading,
        settingsError,
        isWorkspaceAdmin,
        updateWorkspaceSettings,
        generateInviteCode: generateInviteCodeForWorkspace,
        setSettingsError,
        loadWorkspacesInfo,
        getWorkspaceDisplayName
    };
} 