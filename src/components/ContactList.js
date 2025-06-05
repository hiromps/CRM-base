import React from 'react';
import { ContactCard } from './ContactCard';

export function ContactList({ contacts, isLoading, onEdit, onDelete, onAddClick, isLocalMode }) {
    if (isLoading && !contacts.length) {
        return (
            <div className="text-center text-gray-500 dark:text-slate-400 py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto mb-4"></div>
                データを読み込み中...
            </div>
        );
    }

    if (contacts.length === 0 && !isLoading) {
        return (
            <div className="text-center text-gray-500 dark:text-slate-400 py-16 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
                <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        連絡先がありません
                    </h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">
                        {isLocalMode 
                            ? 'まだ連絡先が登録されていません。最初の連絡先を追加してみましょう！'
                            : 'このワークスペースには連絡先がありません。新しい連絡先を追加して始めましょう！'
                        }
                    </p>
                    <button
                        onClick={onAddClick}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center mx-auto"
                    >
                        <span className="mr-2">➕</span>
                        最初の連絡先を追加
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map(contact => (
                <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                />
            ))}
        </div>
    );
} 