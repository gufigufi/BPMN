import { useState, useEffect } from 'react';

export interface StatusOption {
    id: string;
    label: string;
    color: string;
}

const DEFAULT_STATUSES: StatusOption[] = [
    { id: '1', label: 'Потрібно зробити', color: 'gray' },
    { id: '2', label: 'У процесі', color: 'blue' },
    { id: '3', label: 'Готово', color: 'green' },
    { id: '4', label: 'На паузі', color: 'yellow' },
    { id: '5', label: 'Скасовано', color: 'red' },
];

export const TAILWIND_COLORS = [
    { name: 'Сірий', value: 'gray', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
    { name: 'Синій', value: 'blue', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', dot: 'bg-blue-500' },
    { name: 'Зелений', value: 'green', class: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', dot: 'bg-green-500' },
    { name: 'Жовтий', value: 'yellow', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200', dot: 'bg-yellow-500' },
    { name: 'Червоний', value: 'red', class: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', dot: 'bg-red-500' },
    { name: 'Фіолетовий', value: 'purple', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200', dot: 'bg-purple-500' },
    { name: 'Помаранчевий', value: 'orange', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', dot: 'bg-orange-500' },
];

export function useCustomStatuses() {
    const [statuses, setStatuses] = useState<StatusOption[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bpmnStatuses');
            if (saved) return JSON.parse(saved);
        }
        return DEFAULT_STATUSES;
    });

    useEffect(() => {
        localStorage.setItem('bpmnStatuses', JSON.stringify(statuses));
    }, [statuses]);

    const addStatus = (label: string, color: string) => {
        const newStatus = { id: crypto.randomUUID(), label, color };
        setStatuses(prev => [...prev, newStatus]);
    };

    const updateStatus = (id: string, updates: Partial<StatusOption>) => {
        setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStatus = (id: string) => {
        setStatuses(prev => prev.filter(s => s.id !== id));
    };

    return { statuses, addStatus, updateStatus, deleteStatus, setStatuses };
}
