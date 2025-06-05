import React from 'react';
import { EditIcon, DeleteIcon } from './icons';

export function ContactCard({ contact, onEdit, onDelete }) {
    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 hover:shadow-xl dark:hover:shadow-sky-700/30 transition-all duration-300 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-2">{contact.name}</h3>
                {contact.group && (
                    <span className="inline-block bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-medium mr-2 px-2.5 py-1 rounded-full mb-3">
                        {contact.group}
                    </span>
                )}
                <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 whitespace-pre-wrap break-words min-h-[40px]">{contact.memo || <span className="italic text-gray-400 dark:text-slate-500">メモはありません</span>}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-2">
                <button
                    onClick={() => onEdit(contact)}
                    className="p-2 text-gray-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="編集"
                >
                    <EditIcon />
                </button>
                <button
                    onClick={() => onDelete(contact.id)}
                    className="p-2 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="削除"
                >
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );
} 