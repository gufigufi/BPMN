import { useEffect, useState } from 'react';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
import type { StatusOption } from '../hooks/useCustomStatuses';

interface PropertiesPanelProps {
    modeler: BpmnModeler | null;
    statuses?: StatusOption[];
}

export function PropertiesPanel({ modeler, statuses = [] }: PropertiesPanelProps) {
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        documentation: '',
        inputData: '',
        outputData: '',
        notionStatus: '',
        notionAssignee: '',
        notionPriority: '',
        notionDueDate: '',
        gatewayCondition: '', // For Gateways
        dept_id: '' // Read-only mostly, but display it
    });

    useEffect(() => {
        if (!modeler) return;

        const eventBus = modeler.get('eventBus') as any;

        const onSelectionChanged = (e: any) => {
            const { newSelection } = e;
            if (newSelection.length === 1) {
                const element = newSelection[0];
                const bo = element.businessObject;

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
                    dept_id: bo.dept_id || bo.get('custom:dept_id') || ''
                });
            } else {
                setSelectedElement(null);
            }
        };

        const onElementChanged = (e: any) => {
            if (!selectedElement) return;
            if (e.element.id === selectedElement.id) {
                const bo = e.element.businessObject;
                setFormData(prev => ({
                    ...prev,
                    dept_id: bo.dept_id || bo.get('custom:dept_id') || prev.dept_id
                }));
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

        // Special handling for standard vs custom properties
        if (field === 'name') {
            modeling.updateProperties(selectedElement, {
                name: value
            });
        } else if (field === 'documentation') {
            // Documentation is a complex object in BPMN
            modeling.updateProperties(selectedElement, {
                documentation: value ? [{ text: value }] : undefined
            });
        } else {
            // Custom attributes
            const updateData: any = {};
            updateData[`custom:${field}`] = value;
            modeling.updateProperties(selectedElement, updateData);
        }
    };

    if (!selectedElement) {
        return (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shadow-xl z-10 transition-transform duration-300 transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200">Властивості</h2>
                </div>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 mt-10">
                    <p>Виберіть елемент на схемі, щоб редагувати його властивості.</p>
                </div>
            </div>
        );
    }

    const isGateway = selectedElement.type.includes('Gateway');

    return (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full shadow-xl z-10 transition-transform duration-300 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 truncate" title={selectedElement.id}>
                    {selectedElement.type.split(':')[1]}
                </h2>
                <input
                    className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 text-right"
                    value={formData.dept_id}
                    onChange={(e) => handleChange('dept_id', e.target.value)}
                    placeholder="Відділ..."
                />
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Назва</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Введіть назву етапу"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Опис</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm h-24 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={formData.documentation}
                        onChange={(e) => handleChange('documentation', e.target.value)}
                        placeholder="Детальний опис завдання..."
                    />
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Дані</h3>

                {/* Input/Output */}
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Вхідні дані (Input)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 border-l-4 border-l-green-500 dark:border-l-green-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={formData.inputData}
                            onChange={(e) => handleChange('inputData', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Вихідні дані (Output)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 border-l-4 border-l-red-500 dark:border-l-red-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={formData.outputData}
                            onChange={(e) => handleChange('outputData', e.target.value)}
                        />
                    </div>
                </div>

                {!isGateway && (
                    <>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notion Інтеграція</h3>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionStatus}
                                onChange={(e) => handleChange('notionStatus', e.target.value)}
                            >
                                <option value="">Не вибрано</option>
                                {statuses.map(s => (
                                    <option key={s.id} value={s.label}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата виконання</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionDueDate}
                                onChange={(e) => handleChange('notionDueDate', e.target.value)}
                            />
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Виконавець</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionAssignee}
                                onChange={(e) => handleChange('notionAssignee', e.target.value)}
                                placeholder="Ім'я виконавця"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пріоритет</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.notionPriority}
                                onChange={(e) => handleChange('notionPriority', e.target.value)}
                            >
                                <option value="">Не вибрано</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </>
                )}

                {isGateway && (
                    <>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Логіка</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Умова переходу</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.gatewayCondition}
                                onChange={(e) => handleChange('gatewayCondition', e.target.value)}
                                placeholder="Наприклад: Бюджет > 1000"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
