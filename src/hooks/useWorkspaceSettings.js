import { useState, useEffect, useCallback, useRef } from 'react';
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
    
    // 重複読み込みを防ぐためのref
    const loadingWorkspacesRef = useRef(new Set());
    const mountedRef = useRef(true);

    // コンポーネントのアンマウント時のクリーンアップ
    useEffect(() => {
        mountedRef.current = true;
        
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // 複数のワークスペース情報を読み込み
    const loadWorkspacesInfo = useCallback(async (workspaceIds) => {
        if (!db || !workspaceIds || workspaceIds.length === 0 || user?.isAnonymous) {
            return;
        }

        try {
            const workspacesData = {};
            
            // 既に読み込み中のワークスペースを除外
            const workspaceIdsToLoad = workspaceIds.filter(id => 
                !id.startsWith('personal_') && !loadingWorkspacesRef.current.has(id)
            );
            
            if (workspaceIdsToLoad.length === 0) return;
            
            // 読み込み中のワークスペースIDを記録
            workspaceIdsToLoad.forEach(id => loadingWorkspacesRef.current.add(id));
            
            // 各ワークスペースの情報を並行して取得（最大5件ずつ）
            const chunks = [];
            for (let i = 0; i < workspaceIdsToLoad.length; i += 5) {
                chunks.push(workspaceIdsToLoad.slice(i, i + 5));
            }
            
            for (const chunk of chunks) {
                if (!mountedRef.current) break;
                
                const promises = chunk.map(async (workspaceId) => {
                    try {
                        const workspaceDocRef = doc(db, 'workspaces', workspaceId);
                        const workspaceDoc = await getDoc(workspaceDocRef);
                        
                        if (workspaceDoc.exists() && mountedRef.current) {
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
                    } finally {
                        loadingWorkspacesRef.current.delete(workspaceId);
                    }
                });

                await Promise.all(promises);
            }
            
            if (mountedRef.current && Object.keys(workspacesData).length > 0) {
                setWorkspacesInfo(prev => ({ ...prev, ...workspacesData }));
            }
        } catch (error) {
            console.error('Error loading workspaces info:', error);
        }
    }, [db, user?.isAnonymous]);

    // ワークスペース情報の読み込み（公開情報のみ）
    const loadWorkspaceInfo = useCallback(async (workspaceId) => {
        if (!db || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            setWorkspaceInfo(null);
            return;
        }

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            if (!mountedRef.current) return;

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
            if (mountedRef.current) {
                setWorkspaceInfo(null);
            }
        }
    }, [db, user?.isAnonymous]);

    // ワークスペース設定の読み込み
    const loadWorkspaceSettings = useCallback(async (workspaceId) => {
        if (!db || !workspaceId || workspaceId.startsWith('personal_') || user?.isAnonymous) {
            setWorkspaceSettings(null);
            return;
        }

        setIsSettingsLoading(true);
        setSettingsError(null);

        try {
            const workspaceDocRef = doc(db, 'workspaces', workspaceId);
            const workspaceDoc = await getDoc(workspaceDocRef);

            if (!mountedRef.current) return;

            if (workspaceDoc.exists()) {
                const data = workspaceDoc.data();
                setWorkspaceSettings(data);
            } else {
                setWorkspaceSettings(null);
            }
        } catch (error) {
            console.error('Error loading workspace settings:', error);
            if (mountedRef.current) {
                setSettingsError(`ワークスペース設定の読み込みに失敗しました: ${error.message}`);
                setWorkspaceSettings(null);
            }
        } finally {
            if (mountedRef.current) {
                setIsSettingsLoading(false);
            }
        }
    }, [db, user?.isAnonymous]);

    // ワークスペース設定の作成・更新
    const updateWorkspaceSettings = useCallback(async (workspaceId, settings) => {
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
            if (mountedRef.current) {
                setSettingsError(`ワークスペース設定の更新に失敗しました: ${error.message}`);
            }
            return false;
        }
    }, [db, userId, user?.isAnonymous, loadWorkspaceSettings, loadWorkspaceInfo]);

    // 招待コードを生成
    const generateInviteCodeForWorkspace = useCallback(async (workspaceId) => {
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
    }, [db, userId, user?.isAnonymous]);

    // 特定のワークスペース情報を取得
    const getWorkspaceDisplayName = useCallback((workspaceId) => {
        if (workspaceId.startsWith('personal_')) {
            return '個人ワークスペース';
        }
        return workspacesInfo[workspaceId]?.displayName || workspaceId;
    }, [workspacesInfo]);

    // 現在のワークスペースが変更された時に設定を読み込み
    useEffect(() => {
        if (currentGroupId && db && userId) {
            loadWorkspaceSettings(currentGroupId);
            loadWorkspaceInfo(currentGroupId);
        } else {
            setWorkspaceSettings(null);
            setWorkspaceInfo(null);
        }
    }, [currentGroupId, db, userId]); // 関数を依存関係から除外してフリーズを防ぐ

    // ワークスペースの管理者かどうかを判定
    const isWorkspaceAdmin = workspaceSettings?.createdBy === userId;

    // エラーセッターをメモ化
    const memoizedSetSettingsError = useCallback((error) => {
        setSettingsError(error);
    }, []);

    return {
        workspaceSettings,
        workspaceInfo,
        workspacesInfo,
        isSettingsLoading,
        settingsError,
        isWorkspaceAdmin,
        updateWorkspaceSettings,
        generateInviteCode: generateInviteCodeForWorkspace,
        setSettingsError: memoizedSetSettingsError,
        loadWorkspacesInfo,
        getWorkspaceDisplayName
    };
} 