import React, { useRef, useState } from 'react';
import { PlusIcon, DownloadIcon, UploadIcon } from './icons';

// テンプレートダウンロード確認モーダル
function TemplateDownloadModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600 dark:text-emerald-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
                        CSVテンプレートをダウンロード
                    </h3>
                </div>
                
                <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300">
                        CSVインポート用のテンプレートファイルをダウンロードしますか？
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        テンプレートには必要な項目のヘッダーが含まれています。
                    </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    >
                        ダウンロード
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SearchAndFilter({ 
    searchTerm, 
    setSearchTerm, 
    selectedGroup, 
    setSelectedGroup, 
    uniqueGroups, 
    onAddClick,
    onExportFile,
    onImportFile,
    isExporting = false,
    isImporting = false
}) {
    const fileInputRef = useRef(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const handleImportClick = () => {
        if (onImportFile && !isImporting) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onImportFile) {
            onImportFile(file);
            // ファイル選択をリセット
            e.target.value = '';
        }
    };

    const handleTemplateDownloadClick = () => {
        setShowTemplateModal(true);
    };

    const handleTemplateDownloadConfirm = async () => {
        try {
            // 動的インポートでCSVユーティリティを読み込み
            const { downloadCSVTemplate } = await import('../utils/csvUtils');
            await downloadCSVTemplate();
            setShowTemplateModal(false);
        } catch (error) {
            console.error('Template download error:', error);
            setShowTemplateModal(false);
        }
    };

    return (
        <>
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    {/* 検索とフィルター */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-grow w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="名前で検索..."
                            className="flex-grow p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all w-full sm:w-auto min-w-[180px]"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">すべてのグループ</option>
                            {uniqueGroups.filter(g => g !== "").map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* アクションボタンエリア */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* 連絡先追加ボタン */}
                        <button
                            onClick={onAddClick}
                            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                        >
                            <PlusIcon /> <span className="ml-2">連絡先を追加</span>
                        </button>
                        
                        {/* CSV操作ボタングループ */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* ファイルインポート＆テンプレート */}
                            {onImportFile && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleImportClick}
                                        disabled={isImporting}
                                        className={`${
                                            isImporting 
                                                ? 'bg-emerald-400 cursor-not-allowed' 
                                                : 'bg-emerald-500 hover:bg-emerald-600'
                                        } text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center flex-1`}
                                        title="ファイルをインポート"
                                    >
                                        {isImporting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span className="ml-2 hidden sm:inline">処理中...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UploadIcon />
                                                <span className="ml-2">インポート</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    <button
                                        onClick={handleTemplateDownloadClick}
                                        className="bg-emerald-400 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                                        title="CSVテンプレートをダウンロード"
                                    >
                                        <span className="mr-2 text-sm">テンプレート</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            
                            {/* ファイルエクスポート */}
                            {onExportFile && (
                                <button
                                    onClick={onExportFile}
                                    disabled={isExporting}
                                    className={`${
                                        isExporting 
                                            ? 'bg-purple-400 cursor-not-allowed' 
                                            : 'bg-purple-500 hover:bg-purple-600'
                                    } text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center`}
                                    title="ファイルをエクスポート"
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span className="ml-2 hidden sm:inline">処理中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <DownloadIcon />
                                            <span className="ml-2">エクスポート</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* 隠しファイル入力 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {/* テンプレートダウンロード確認モーダル */}
            <TemplateDownloadModal 
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                onConfirm={handleTemplateDownloadConfirm}
            />
        </>
    );
} 