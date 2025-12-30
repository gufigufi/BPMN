import { useState, useEffect, useMemo, useRef } from 'react';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { Settings, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, GripVertical } from 'lucide-react';
import type { StatusOption } from '../hooks/useCustomStatuses';
import { TAILWIND_COLORS } from '../hooks/useCustomStatuses';

interface DataTableProps {
    modeler: BpmnModeler | null;
    statuses?: StatusOption[];
}

interface TaskRow {
    id: string;
    name: string;
    dept_id: string;
    status: string;
    assignee: string;
    dueDate: string;
    description: string;
    inputData: string;
    outputData: string;
    priority: string;
}

interface ColumnConfig {
    id: keyof TaskRow;
    label: string;
    visible: boolean;
    width: number;
}

export function DataTable({ modeler, statuses = [] }: DataTableProps) {
    const [rows, setRows] = useState<TaskRow[]>([]);
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        const saved = localStorage.getItem('bpmnTableColumns');
        if (saved) return JSON.parse(saved);

        return [
            { id: 'id', label: 'ID', visible: false, width: 80 },
            { id: 'name', label: 'Назва', visible: true, width: 250 },
            { id: 'dept_id', label: 'Відділ', visible: true, width: 150 },
            { id: 'status', label: 'Статус', visible: true, width: 140 },
            { id: 'dueDate', label: 'Дата', visible: true, width: 130 },
            { id: 'assignee', label: 'Виконавець', visible: true, width: 160 },
            { id: 'priority', label: 'Пріоритет', visible: true, width: 120 },
            { id: 'description', label: 'Опис', visible: true, width: 300 },
            { id: 'inputData', label: 'Вхідні дані', visible: true, width: 200 },
            { id: 'outputData', label: 'Вихідні дані', visible: true, width: 200 },
        ];
    });

    useEffect(() => {
        localStorage.setItem('bpmnTableColumns', JSON.stringify(columns));
    }, [columns]);

    const [sortConfig, setSortConfig] = useState<{ key: keyof TaskRow; direction: 'asc' | 'desc' } | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showSettings, setShowSettings] = useState(false);

    const [activeStatusPopover, setActiveStatusPopover] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // --- Column Resize Logic ---
    const [resizing, setResizing] = useState<{ idx: number; startX: number; startWidth: number } | null>(null);

    const onResizeStart = (e: React.MouseEvent, idx: number) => {
        e.preventDefault();
        setResizing({
            idx,
            startX: e.pageX,
            startWidth: columns[idx].width
        });
    };

    useEffect(() => {
        if (!resizing) return;

        const onMouseMove = (e: MouseEvent) => {
            const diff = e.pageX - resizing.startX;
            const newWidth = Math.max(50, resizing.startWidth + diff);
            setColumns(prev => prev.map((col, i) => i === resizing.idx ? { ...col, width: newWidth } : col));
        };

        const onMouseUp = () => {
            setResizing(null);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [resizing]);

    // --- Column DnD Reorder Logic ---
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;
        setDragOverIdx(idx);
    };

    const handleDrop = (idx: number) => {
        if (draggedIdx === null || draggedIdx === idx) {
            setDraggedIdx(null);
            setDragOverIdx(null);
            return;
        }

        const newCols = [...columns];
        const item = newCols.splice(draggedIdx, 1)[0];
        newCols.splice(idx, 0, item);

        setColumns(newCols);
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    // ----------------------------

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setActiveStatusPopover(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!modeler) return;
        const fetchTasks = () => {
            const elementRegistry = modeler.get('elementRegistry');
            // @ts-ignore
            const elements = elementRegistry.filter((e: any) =>
                e.type.includes('Task') || e.type.includes('Event')
            );
            const newRows = elements.map((e: any) => {
                const bo = e.businessObject;
                return {
                    id: e.id,
                    name: bo.name || '',
                    dept_id: bo.dept_id || bo.get('custom:dept_id') || '',
                    status: bo.get('custom:notionStatus') || '',
                    assignee: bo.get('custom:notionAssignee') || '',
                    dueDate: bo.get('custom:notionDueDate') || '',
                    priority: bo.get('custom:notionPriority') || '',
                    description: (bo.documentation && bo.documentation[0] ? bo.documentation[0].text : ''),
                    inputData: bo.get('custom:inputData') || '',
                    outputData: bo.get('custom:outputData') || '',
                };
            });
            setRows(newRows);
        };

        fetchTasks();

        const eventBus = modeler.get('eventBus') as any;
        const handleEvent = () => fetchTasks();
        eventBus.on('element.changed', handleEvent);
        eventBus.on('shape.added', handleEvent);
        eventBus.on('shape.removed', handleEvent);

        return () => {
            eventBus.off('element.changed', handleEvent);
            eventBus.off('shape.added', handleEvent);
            eventBus.off('shape.removed', handleEvent);
        };
    }, [modeler]);

    const handleUpdate = (id: string, field: string, value: string) => {
        if (!modeler) return;
        const elementRegistry = modeler.get('elementRegistry') as any;
        const element = elementRegistry.get(id);
        if (element) updateElement(element, field, value);
    };

    const updateElement = (element: any, field: string, value: string) => {
        if (!modeler) return;
        const modeling = modeler.get('modeling') as any;

        if (field === 'name') {
            modeling.updateLabel(element, value);
        } else if (field === 'description') {
            const bpmnFactory = modeler.get('bpmnFactory') as any;
            const newDoc = bpmnFactory.create('bpmn:Documentation', { text: value });
            modeling.updateProperties(element, { documentation: [newDoc] });
        } else if (field === 'inputData') {
            modeling.updateProperties(element, { 'custom:inputData': value });
        } else if (field === 'outputData') {
            modeling.updateProperties(element, { 'custom:outputData': value });
        } else {
            modeling.updateProperties(element, { [field]: value });
        }
    };

    const processedRows = useMemo(() => {
        let data = [...rows];
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                const lowerFilter = filters[key].toLowerCase();
                data = data.filter(row => String(row[key as keyof TaskRow] || '').toLowerCase().includes(lowerFilter));
            }
        });
        if (sortConfig) {
            data.sort((a, b) => {
                const aVal = String(a[sortConfig.key] || '').toLowerCase();
                const bVal = String(b[sortConfig.key] || '').toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                return sortConfig.direction === 'asc' ? 1 : -1;
            });
        }
        return data;
    }, [rows, filters, sortConfig]);

    const handleSort = (key: keyof TaskRow) => {
        setSortConfig(current => (current?.key === key && current.direction === 'desc') ? null : { key, direction: current?.key === key ? 'desc' : 'asc' });
    };

    const handleRowClick = (id: string) => {
        if (!modeler) return;
        const selection = modeler.get('selection') as any;
        const canvas = modeler.get('canvas') as any;
        const elementRegistry = modeler.get('elementRegistry') as any;

        const element = elementRegistry.get(id);
        if (element) {
            selection.select(element);
            canvas.scrollToElement(element, { center: true });
        }
    };

    const toggleColumn = (id: keyof TaskRow) => {
        setColumns(cols => cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    const renderCell = (row: TaskRow, colId: keyof TaskRow) => {
        let baseInputClass = "bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500 w-full text-sm text-gray-200 rounded px-2 py-1.5 transition-all outline-none shadow-sm h-full truncate";

        if (colId === 'inputData') baseInputClass += " border-l-4 border-l-green-500";
        if (colId === 'outputData') baseInputClass += " border-l-4 border-l-red-500";

        if (colId === 'id') return <span className="text-xs text-gray-500">{row.id}</span>;

        if (colId === 'status') {
            const currentStatus = statuses.find(s => s.label === row.status);
            const colorObj = currentStatus ? TAILWIND_COLORS.find(c => c.value === currentStatus.color) : null;
            const isSelected = activeStatusPopover === row.id;

            return (
                <div className="relative h-full flex items-center" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setActiveStatusPopover(isSelected ? null : row.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all hover:brightness-95 active:scale-95 whitespace-nowrap ${colorObj ? colorObj.class : 'bg-gray-700 text-gray-400'}`}
                    >
                        {row.status || 'Вибрати...'}
                        <ChevronDown size={12} className={`opacity-50 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                    </button>

                    {isSelected && (
                        <div ref={popoverRef} className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-2 z-[60] animate-in fade-in slide-in-from-top-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Змінити статус</div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => { handleUpdate(row.id, 'custom:notionStatus', ''); setActiveStatusPopover(null); }}
                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-700 rounded-lg text-gray-400 mb-1"
                                >
                                    Очистити
                                </button>
                                {statuses.map(s => {
                                    const sColor = TAILWIND_COLORS.find(c => c.value === s.color);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => { handleUpdate(row.id, 'custom:notionStatus', s.label); setActiveStatusPopover(null); }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-700 rounded-lg transition-colors group"
                                        >
                                            <span className={`w-2 h-2 rounded-full ${sColor?.dot}`} />
                                            <span className={`px-2 py-0.5 rounded-full ${sColor?.class} group-hover:brightness-95`}>
                                                {s.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (colId === 'priority') {
            return (
                <select
                    className={baseInputClass}
                    value={row.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdate(row.id, 'custom:notionPriority', e.target.value)}
                >
                    <option value="">Medium</option>
                    <option value="High">🔥 High</option>
                    <option value="Medium">⚡ Medium</option>
                    <option value="Low">💧 Low</option>
                </select>
            );
        }

        let updateField = '';
        if (colId === 'name') updateField = 'name';
        if (colId === 'dept_id') updateField = 'custom:dept_id';
        if (colId === 'assignee') updateField = 'custom:notionAssignee';
        if (colId === 'dueDate') updateField = 'custom:notionDueDate';
        if (colId === 'description') updateField = 'description';
        if (colId === 'inputData') updateField = 'inputData';
        if (colId === 'outputData') updateField = 'outputData';

        if (colId === 'dueDate') return <input type="date" className={baseInputClass} value={row.dueDate} onClick={(e) => e.stopPropagation()} onChange={(e) => handleUpdate(row.id, updateField, e.target.value)} />;

        if (['description', 'inputData', 'outputData'].includes(colId)) {
            return (
                <textarea
                    className={`${baseInputClass} resize-none overflow-hidden h-9 focus:h-24 transition-all absolute top-0 left-0 w-full z-10 py-1.5 min-h-[36px] leading-relaxed`}
                    value={String(row[colId] || '')}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdate(row.id, updateField, e.target.value)}
                    style={{ position: 'relative' }}
                    rows={1}
                />
            );
        }

        return <input className={baseInputClass} value={String(row[colId] || '')} onClick={(e) => e.stopPropagation()} onChange={(e) => handleUpdate(row.id, updateField, e.target.value)} />;
    };

    return (
        <div className="flex-1 bg-gray-800 border-t border-gray-700 flex flex-col relative z-20 transition-colors">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md relative z-50">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-tight">Реєстр завдань</h3>
                    <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full font-bold">{processedRows.length} пунктів</span>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 rounded-lg hover:bg-gray-700 text-gray-300 flex items-center gap-2 text-xs font-medium transition-colors ${showSettings ? 'bg-gray-700 ring-2 ring-blue-500/20' : ''}`}
                    >
                        <Settings size={14} /> Налаштування полів
                    </button>

                    {showSettings && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 shadow-2xl border border-gray-700 rounded-xl p-3 z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                            <h4 className="text-[10px] font-black mb-3 text-gray-400 uppercase tracking-widest flex justify-between">
                                Порядок полів (Drag & Drop)
                                <button onClick={() => setShowSettings(false)} className="hover:text-red-500"><Settings size={10} /></button>
                            </h4>
                            <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto custom-scrollbar">
                                {columns.map((col, idx) => (
                                    <div
                                        key={col.id}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={() => handleDrop(idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-default ${dragOverIdx === idx ? 'bg-blue-900/20 border-t-2 border-blue-500' : 'hover:bg-gray-700/50'} ${draggedIdx === idx ? 'opacity-40' : ''}`}
                                    >
                                        <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors">
                                            <GripVertical size={16} />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className={`text-xs font-medium ${col.visible ? 'text-gray-200' : 'text-gray-500'}`}>{col.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={col.visible}
                                                onChange={() => toggleColumn(col.id)}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar scroll-smooth">
                <table className="min-w-full divide-y divide-gray-800 table-fixed">
                    <thead className="bg-gray-700 sticky top-0 z-40 shadow-sm transition-colors">
                        <tr>
                            {columns.filter(c => c.visible).map((col) => {
                                const originalIdx = columns.findIndex(c => c.id === col.id);
                                return (
                                    <th
                                        key={col.id}
                                        style={{ width: col.width }}
                                        className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider relative group select-none border-b border-gray-800"
                                    >
                                        <div className="flex items-center gap-2 cursor-pointer group-hover:text-gray-300 transition-colors" onClick={() => handleSort(col.id)}>
                                            <span className="truncate">{col.label}</span>
                                            {sortConfig?.key === col.id ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-500 shrink-0" /> : <ArrowDown size={12} className="text-blue-500 shrink-0" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            {col.id === 'status' && (
                                                <select
                                                    className="w-full text-[10px] px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                                    value={filters[col.id] || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                                >
                                                    <option value="">Всі статуси</option>
                                                    {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                                                </select>
                                            )}
                                            {col.id === 'priority' && (
                                                <select
                                                    className="w-full text-[10px] px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                                    value={filters[col.id] || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                                >
                                                    <option value="">Всі пріоритети</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            )}
                                            {col.id === 'dept_id' && (
                                                <select
                                                    className="w-full text-[10px] px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                                    value={filters[col.id] || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                                >
                                                    <option value="">Всі відділи</option>
                                                    {Array.from(new Set(rows.map(r => r.dept_id).filter(Boolean))).sort().map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            )}
                                            {!['status', 'priority', 'dept_id', 'dueDate'].includes(col.id) && (
                                                <input
                                                    type="text"
                                                    placeholder={`...`}
                                                    className="w-full text-[10px] px-2 py-1 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    value={filters[col.id] || ''}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, [col.id]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                        <div
                                            onMouseDown={(e) => onResizeStart(e, originalIdx)}
                                            className="absolute right-0 top-2 bottom-2 w-1.5 cursor-col-resize hover:bg-blue-500/50 bg-gray-600/30 rounded-full transition-all z-50 group-hover:bg-gray-500"
                                            title="Потягніть, щоб змінити ширину"
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800 transition-colors">
                        {processedRows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => handleRowClick(row.id)}
                                className={`group hover:bg-blue-900/10 transition-all cursor-pointer active:bg-blue-900/20 ${activeStatusPopover === row.id ? 'z-50 relative' : ''}`}
                            >
                                {columns.filter(c => c.visible).map(col => (
                                    <td
                                        key={col.id}
                                        style={{ width: col.width }}
                                        className="px-5 py-2 whitespace-nowrap text-sm text-gray-300 border-r border-gray-800/50 last:border-r-0 relative overflow-visible"
                                    >
                                        {renderCell(row, col.id)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {resizing && <div className="fixed inset-0 z-[1000] cursor-col-resize select-none" />}
        </div>
    );
}
