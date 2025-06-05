import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

export function ContactModal({ contact, onClose, onSave, uniqueGroups }) {
    const [name, setName] = useState(contact ? contact.name : '');
    const [memo, setMemo] = useState(contact ? contact.memo : '');
    const [group, setGroup] = useState(contact ? contact.group : '');
    const [newGroup, setNewGroup] = useState('');
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setFormError('名前は必須です。');
            return;
        }
        const finalGroup = isCreatingNewGroup ? newGroup.trim() : group;
        if (isCreatingNewGroup && !finalGroup) {
            setFormError('新しいグループ名を入力してください。');
            return;
        }

        onSave({ name: name.trim(), memo: memo.trim(), group: finalGroup });
        setFormError('');
    };
    
    useEffect(() => {
        if (contact && contact.group && !uniqueGroups.includes(contact.group) && contact.group !== "") {
            setIsCreatingNewGroup(true);
            setNewGroup(contact.group);
            setGroup("__NEW_GROUP__");
        } else if (contact && contact.group) {
            setGroup(contact.group);
        } else {
            setGroup('');
        }
    }, [contact, uniqueGroups]);

    const inputBaseClass = "w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors";
    const inputLightClass = "border-gray-300 bg-white text-gray-900 placeholder-gray-400";
    const inputDarkClass = "dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-slate-400";

    return (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-appear">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full">
                    <CloseIcon />
                </button>
                <h2 className="text-xl font-semibold mb-6 text-sky-600 dark:text-sky-400">{contact ? '連絡先を編集' : '新しい連絡先'}</h2>
                {formError && <p className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded-md text-sm mb-4 border border-red-300 dark:border-red-700">{formError}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">お名前 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`${inputBaseClass} ${inputLightClass} ${inputDarkClass}`}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="memo" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">メモ</label>
                        <textarea
                            id="memo"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            rows="3"
                            className={`${inputBaseClass} ${inputLightClass} ${inputDarkClass}`}
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="group" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">グループ</label>
                        {!isCreatingNewGroup ? (
                            <div className="flex items-center gap-2">
                                <select
                                    id="group"
                                    value={group}
                                    onChange={(e) => {
                                        if (e.target.value === "__NEW_GROUP__") {
                                            setIsCreatingNewGroup(true);
                                            setGroup("__NEW_GROUP__"); 
                                        } else {
                                            setGroup(e.target.value);
                                        }
                                    }}
                                    className={`${inputBaseClass} ${inputLightClass} ${inputDarkClass} flex-grow`}
                                >
                                    <option value="">グループなし</option>
                                    {uniqueGroups.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                    <option value="__NEW_GROUP__">新しいグループを作成...</option>
                                </select>
                            </div>
                        ) : (
                             <div className="space-y-2">
                                <input
                                    type="text"
                                    id="newGroup"
                                    placeholder="新しいグループ名を入力"
                                    value={newGroup}
                                    onChange={(e) => setNewGroup(e.target.value)}
                                    className={`${inputBaseClass} ${inputLightClass} ${inputDarkClass}`}
                                    autoFocus
                                />
                                <button 
                                    type="button" 
                                    onClick={() => { setIsCreatingNewGroup(false); setNewGroup(''); setGroup(uniqueGroups[1] || '');}} // Select "no group" or first available
                                    className="w-full text-sm py-2 px-3 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-slate-200 rounded-lg transition-colors"
                                >
                                    既存のグループを選択 / キャンセル
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-6 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            {contact ? '更新する' : '保存する'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Global styles for modal animation, can be moved to a global CSS if preferred */}
            <style jsx global>{`
                @keyframes modal-appear-animation {
                    0% { transform: scale(0.95) translateY(10px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                .animate-modal-appear {
                    animation: modal-appear-animation 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
} 