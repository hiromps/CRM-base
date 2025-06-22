import React from 'react';
import { CloseIcon } from './icons';

export function CSVImportModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    importData, 
    validationResult 
}) {
    if (!isOpen) return null;

    const { errors, warnings, validContacts, totalCount, validCount } = validationResult || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* ヘッダー */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        CSVインポート確認
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* サマリー */}
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            インポート概要
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">総行数:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                                    {totalCount || 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">有効な行数:</span>
                                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                                    {validCount || 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">エラー:</span>
                                <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                                    {errors?.length || 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">警告:</span>
                                <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
                                    {warnings?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* エラー表示 */}
                    {errors?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                                エラー
                            </h3>
                            <div className="space-y-2">
                                {errors.map((error, index) => (
                                    <div key={index} className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-md">
                                        <span className="text-sm text-red-700 dark:text-red-300">
                                            行 {error.index}: {error.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 警告表示 */}
                    {warnings?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                                警告
                            </h3>
                            <div className="space-y-2">
                                {warnings.map((warning, index) => (
                                    <div key={index} className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 rounded-md">
                                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                                            行 {warning.index}: {warning.message}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* データプレビュー */}
                    {validContacts?.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                インポートされるデータ（最大20件表示）
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-slate-700">
                                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">名前</th>
                                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">グループ</th>
                                            <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">メモ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {validContacts.slice(0, 20).map((contact, index) => (
                                            <tr key={index} className="border-b border-gray-200 dark:border-slate-700">
                                                <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                                                    {contact.name}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                                    {contact.group || '-'}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                                    {contact.memo ? (
                                                        <span className="truncate block max-w-xs" title={contact.memo}>
                                                            {contact.memo}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {validContacts.length > 20 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        他 {validContacts.length - 20} 件...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={errors?.length > 0 || validCount === 0}
                        className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors ${
                            errors?.length > 0 || validCount === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                    >
                        {validCount > 0 ? `${validCount}件をインポート` : 'インポート'}
                    </button>
                </div>
            </div>
        </div>
    );
} 