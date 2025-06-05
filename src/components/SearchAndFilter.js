import React from 'react';
import { PlusIcon } from './icons';

export function SearchAndFilter({ 
    searchTerm, 
    setSearchTerm, 
    selectedGroup, 
    setSelectedGroup, 
    uniqueGroups, 
    onAddClick 
}) {
    return (
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="名前で検索..."
                    className="flex-grow p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all w-full sm:w-auto"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">すべてのグループ</option>
                    {uniqueGroups.filter(g => g !== "").map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
                <button
                    onClick={onAddClick}
                    className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                >
                    <PlusIcon /> <span className="ml-2">新規追加</span>
                </button>
            </div>
        </div>
    );
} 