import React from 'react';
import { ContactCard } from './ContactCard';

export function ContactList({ contacts, isLoading, onEdit, onDelete }) {
    if (isLoading && !contacts.length) {
        return (
            <div className="text-center text-gray-500 dark:text-slate-400 py-10">
                データを読み込み中...
            </div>
        );
    }

    if (contacts.length === 0 && !isLoading) {
        return (
            <div className="text-center text-gray-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                該当する連絡先はありません。
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