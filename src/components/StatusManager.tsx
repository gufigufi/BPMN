import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import type { StatusOption } from '../hooks/useCustomStatuses';
import { TAILWIND_COLORS } from '../hooks/useCustomStatuses';

interface StatusManagerProps {
    isOpen: boolean;
    onClose: () => void;
    statuses: StatusOption[];
    onAdd: (label: string, color: string) => void;
    onUpdate: (id: string, updates: Partial<StatusOption>) => void;
    onDelete: (id: string) => void;
}

export function StatusManager({ isOpen, onClose, statuses, onAdd, onUpdate, onDelete }: StatusManagerProps) {
    if (!isOpen) return null;

    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState('gray');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleAdd = () => {
        if (!newLabel.trim()) return;
        onAdd(newLabel.trim(), newColor);
        setNewLabel('');
        setNewColor('gray');
    };

    const startEdit = (status: StatusOption) => {
        setEditingId(status.id);
        setEditLabel(status.label);
        setEditColor(status.color);
    };

    const saveEdit = () => {
        if (!editingId || !editLabel.trim()) return;
        onUpdate(editingId, { label: editLabel, color: editColor });
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Керування статусами</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Налаштуйте власні статуси в стилі Notion</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New Section */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3 px-1">Додати новий</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Назва статусу (напр. Пріоритетно)"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all outline-none"
                            />
                            <div className="flex items-center justify-between gap-2 px-1">
                                <div className="flex gap-2">
                                    {TAILWIND_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            onClick={() => setNewColor(c.value)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${c.dot} ${newColor === c.value ? 'border-blue-500 scale-125 ring-2 ring-blue-200' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleAdd}
                                    disabled={!newLabel.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-sm"
                                >
                                    <Plus size={16} /> Додати
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 px-1">Активні статуси</label>
                        {statuses.map(status => {
                            const color = TAILWIND_COLORS.find(c => c.value === status.color) || TAILWIND_COLORS[0];
                            const isEditing = editingId === status.id;

                            return (
                                <div key={status.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${isEditing ? 'border-blue-300 ring-2 ring-blue-50/50 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                    {isEditing ? (
                                        <div className="flex flex-col flex-1 gap-2">
                                            <input
                                                value={editLabel}
                                                onChange={e => setEditLabel(e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 items-center">
                                                <div className="flex gap-1.5">
                                                    {TAILWIND_COLORS.map(c => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => setEditColor(c.value)}
                                                            className={`w-5 h-5 rounded-full border-2 transition-all ${c.dot} ${editColor === c.value ? 'border-blue-500 scale-125' : 'border-transparent opacity-60'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="ml-auto flex gap-1">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded">Скасувати</button>
                                                    <button onClick={saveEdit} className="px-3 py-1 text-xs bg-blue-600 text-white rounded flex items-center gap-1"><Check size={12} /> Зберегти</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color.class}`}>
                                                {status.label}
                                            </span>
                                            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(status)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 rounded-md" title="Редагувати">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => onDelete(status.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 rounded-md" title="Видалити">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
