import { useEffect, useState } from 'react';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { Star, Plus, Trash2, Type } from 'lucide-react';
import type { StatusOption } from '../hooks/useCustomStatuses';

interface PropertiesPanelProps {
    modeler: BpmnModeler | null;
    statuses?: StatusOption[];
}

const PRESET_COLORS = [
    { name: 'White', fill: '#ffffff', stroke: '#111827' },
    { name: 'Blue', fill: '#3b82f6', stroke: '#1d4ed8' },
    { name: 'Pink', fill: '#ec4899', stroke: '#be185d' },
    { name: 'Green', fill: '#22c55e', stroke: '#15803d' },
    { name: 'Yellow', fill: '#eab308', stroke: '#a16207' },
    { name: 'Purple', fill: '#a855f7', stroke: '#7e22ce' },
    { name: 'Orange', fill: '#f97316', stroke: '#c2410c' },
    { name: 'Red', fill: '#ef4444', stroke: '#b91c1c' },
    { name: 'Teal', fill: '#14b8a6', stroke: '#0f766e' },
    { name: 'Indigo', fill: '#6366f1', stroke: '#4338ca' },
];

export function PropertiesPanel({ modeler, statuses = [] }: PropertiesPanelProps) {
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [favorites, setFavorites] = useState<{ fill: string, stroke: string }[]>(() => {
        const saved = localStorage.getItem('bpmnColorFavorites');
        return saved ? JSON.parse(saved) : [];
    });

    const [customColor, setCustomColor] = useState('#3b82f6');

    const [formData, setFormData] = useState({
        name: '',
        documentation: '',
        inputData: '',
        outputData: '',
        notionStatus: '',
        notionAssignee: '',
        notionPriority: '',
        notionDueDate: '',
        gatewayCondition: '',
        dept_id: '',
        fill: '',
        stroke: '',
        labelColor: '' // 'white' or 'dark'
    });

    useEffect(() => {
        localStorage.setItem('bpmnColorFavorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        if (!modeler) return;

        const eventBus = modeler.get('eventBus') as any;

        const onSelectionChanged = (e: any) => {
            const { newSelection } = e;
            if (newSelection.length === 1) {
                const element = newSelection[0];
                const bo = element.businessObject;
                const canvas = modeler.get('canvas') as any;

                const labelColor = bo.get('custom:labelColor') || (document.documentElement.classList.contains('dark') ? 'white' : 'dark');

                setSelectedElement(element);
                setFormData({
                    name: bo.name || '',
                    documentation: bo.documentation && bo.documentation[0] ? bo.documentation[0].text : '',
                    inputData: bo.get('custom:inputData') || '',
                    outputData: bo.get('custom:outputData') || '',
                    notionStatus: bo.get('custom:notionStatus') || '',
                    notionAssignee: bo.get('custom:notionAssignee') || '',
                    notionPriority: bo.get('custom:notionPriority') || '',
                    notionDueDate: bo.get('custom:notionDueDate') || '',
                    gatewayCondition: bo.get('custom:gatewayCondition') || '',
                    dept_id: bo.dept_id || bo.get('custom:dept_id') || '',
                    fill: element.di?.fill || '',
                    stroke: element.di?.stroke || '',
                    labelColor
                });

                // Apply marker on selection
                canvas.removeMarker(element, 'label-light');
                canvas.removeMarker(element, 'label-dark');
                canvas.addMarker(element, labelColor === 'white' ? 'label-light' : 'label-dark');
            } else {
                setSelectedElement(null);
            }
        };

        const onElementChanged = (e: any) => {
            if (!selectedElement) return;
            if (e.element.id === selectedElement.id) {
                const bo = e.element.businessObject;
                const canvas = modeler.get('canvas') as any;
                const labelColor = bo.get('custom:labelColor') || formData.labelColor;

                setFormData(prev => ({
                    ...prev,
                    dept_id: bo.dept_id || bo.get('custom:dept_id') || prev.dept_id,
                    fill: e.element.di?.fill || prev.fill,
                    stroke: e.element.di?.stroke || prev.stroke,
                    labelColor
                }));

                // Re-apply marker if changed externally
                canvas.removeMarker(e.element, 'label-light');
                canvas.removeMarker(e.element, 'label-dark');
                canvas.addMarker(e.element, labelColor === 'white' ? 'label-light' : 'label-dark');
            }
        }

        eventBus.on('selection.changed', onSelectionChanged);
        eventBus.on('element.changed', onElementChanged);

        return () => {
            eventBus.off('selection.changed', onSelectionChanged);
            eventBus.off('element.changed', onElementChanged);
        };
    }, [modeler, selectedElement]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (!modeler || !selectedElement) return;

        const modeling = modeler.get('modeling') as any;
        const canvas = modeler.get('canvas') as any;

        if (field === 'name') {
            modeling.updateProperties(selectedElement, { name: value });
        } else if (field === 'documentation') {
            modeling.updateProperties(selectedElement, { documentation: value ? [{ text: value }] : undefined });
        } else if (field === 'color') {
            const colorObj = JSON.parse(value);
            modeling.setColor(selectedElement, colorObj);
        } else if (field === 'labelColor') {
            modeling.updateProperties(selectedElement, { 'custom:labelColor': value });
            // Apply marker for CSS targeting
            canvas.removeMarker(selectedElement, 'label-light');
            canvas.removeMarker(selectedElement, 'label-dark');
            canvas.addMarker(selectedElement, value === 'white' ? 'label-light' : 'label-dark');
        } else {
            const updateData: any = {};
            updateData[`custom:${field}`] = value;
            modeling.updateProperties(selectedElement, updateData);
        }
    };

    const addToFavorites = () => {
        // Simple stroke logic: slightly darker than fill
        const fill = customColor;
        const stroke = favorites.length % 2 === 0 ? '#111827' : '#1d4ed8'; // Placeholder logic
        if (!favorites.find(f => f.fill === fill)) {
            setFavorites([...favorites, { fill, stroke }]);
        }
    };

    const removeFavorite = (fill: string) => {
        setFavorites(favorites.filter(f => f.fill !== fill));
    };

    if (!selectedElement) {
        return (
            <div className="w-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shadow-xl z-10 transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-widest">Властивості</h2>
                </div>
                <div className="p-8 text-center text-gray-400 dark:text-gray-500 mt-10 text-sm">
                    <p>Виберіть елемент на схемі, щоб редагувати його властивості.</p>
                </div>
            </div>
        );
    }

    const isGateway = selectedElement.type.includes('Gateway');

    return (
        <div className="w-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shadow-xl z-10 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{selectedElement.id}</span>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate w-24">
                        {selectedElement.type.split(':')[1]}
                    </h2>
                </div>
                <input
                    className="text-[11px] font-bold px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-24 text-center"
                    value={formData.dept_id}
                    onChange={(e) => handleChange('dept_id', e.target.value)}
                    placeholder="Відділ"
                />
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
                {/* Advanced Coloring Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Дизайн блоку</label>
                        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <button
                                onClick={() => handleChange('labelColor', 'white')}
                                className={`p-1 rounded ${formData.labelColor === 'white' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500' : 'text-gray-400'}`}
                                title="Світлий текст"
                            >
                                <Type size={14} />
                            </button>
                            <button
                                onClick={() => handleChange('labelColor', 'dark')}
                                className={`p-1 rounded ${formData.labelColor === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500' : 'text-gray-400'}`}
                                title="Темний текст"
                            >
                                <Type size={14} className="fill-current" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => handleChange('color', JSON.stringify({ fill: c.fill, stroke: c.stroke }))}
                                className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-105 ${formData.fill === c.fill ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-100 dark:border-gray-700'}`}
                                style={{ backgroundColor: c.fill }}
                                title={c.name}
                            />
                        ))}
                    </div>

                    {/* Favorites */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                <Star size={10} className="fill-yellow-400 text-yellow-400" /> Улюблені
                            </label>
                            {favorites.length > 0 && (
                                <button onClick={() => setFavorites([])} className="text-[8px] text-gray-400 hover:text-red-500 font-bold uppercase transition-colors">Очистити</button>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {favorites.map((f, idx) => (
                                <div key={idx} className="relative group">
                                    <button
                                        onClick={() => handleChange('color', JSON.stringify(f))}
                                        className={`w-9 h-9 rounded-xl border-2 transition-all ${formData.fill === f.fill ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-gray-100 dark:border-gray-700'}`}
                                        style={{ backgroundColor: f.fill }}
                                    />
                                    <button
                                        onClick={() => removeFavorite(f.fill)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={8} />
                                    </button>
                                </div>
                            ))}
                            {favorites.length === 0 && (
                                <div className="col-span-5 border-2 border-dashed border-gray-100 dark:border-gray-700 py-4 rounded-xl text-center">
                                    <p className="text-[10px] text-gray-400 italic">Тут будуть ваші кольори</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Picker */}
                    <div className="flex items-center gap-3 pt-2">
                        <input
                            type="color"
                            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                        />
                        <button
                            onClick={addToFavorites}
                            className="flex-1 py-2 px-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Зберегти колір
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                {/* Standard Inputs */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Назва</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Назва..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Опис</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm h-24 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        value={formData.documentation}
                        onChange={(e) => handleChange('documentation', e.target.value)}
                        placeholder="Опис завдання..."
                    />
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notion Інтеграція</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Статус</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionStatus}
                                onChange={(e) => handleChange('notionStatus', e.target.value)}
                            >
                                <option value="">Вибрати статус</option>
                                {statuses.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Пріоритет</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={formData.notionPriority}
                                    onChange={(e) => handleChange('notionPriority', e.target.value)}
                                >
                                    <option value="">Default</option>
                                    <option value="High">🔥 High</option>
                                    <option value="Medium">⚡ Medium</option>
                                    <option value="Low">💧 Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Дата</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={formData.notionDueDate}
                                    onChange={(e) => handleChange('notionDueDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Виконавець</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionAssignee}
                                onChange={(e) => handleChange('notionAssignee', e.target.value)}
                                placeholder="Ім'я..."
                            />
                        </div>
                    </div>
                </div>

                {isGateway && (
                    <div className="pt-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Логіка переходу</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                            value={formData.gatewayCondition}
                            onChange={(e) => handleChange('gatewayCondition', e.target.value)}
                            placeholder="Наприклад: yes/no"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
