import { useEffect, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';

interface DataTableProps {
    modeler: BpmnModeler | null;
}

interface TaskRow {
    id: string;
    name: string;
    dept_id: string;
    status: string;
    assignee: string;
}

export function DataTable({ modeler }: DataTableProps) {
    const [rows, setRows] = useState<TaskRow[]>([]);

    const fetchTasks = () => {
        if (!modeler) return;
        const elementRegistry = modeler.get('elementRegistry');
        // @ts-ignore
        const elements = elementRegistry.filter((e: any) =>
            e.type === 'bpmn:Task' || e.type === 'bpmn:UserTask' || e.type === 'bpmn:ServiceTask' || e.type === 'bpmn:SendTask' || e.type === 'bpmn:ReceiveTask' || e.type === 'bpmn:StartEvent'
        );

        const taskRows = elements.map((e: any) => {
            const bo = e.businessObject;
            return {
                id: e.id,
                name: bo.name || '',
                dept_id: bo.dept_id || bo.get('custom:dept_id') || '',
                status: bo.get('custom:clickupStatus') || '',
                assignee: bo.get('custom:clickupAssignee') || ''
            };
        });

        setRows(taskRows);
    };

    useEffect(() => {
        if (!modeler) return;

        const eventBus = modeler.get('eventBus') as any;

        const handleChange = () => {
            // Debounce could be good, but for now direct call
            fetchTasks();
        };

        eventBus.on('import.done', handleChange);
        eventBus.on('commandStack.changed', handleChange);
        eventBus.on('element.changed', handleChange);

        return () => {
            eventBus.off('import.done', handleChange);
            eventBus.off('commandStack.changed', handleChange);
            eventBus.off('element.changed', handleChange);
        };
    }, [modeler]);

    const handleRowClick = (id: string) => {
        if (!modeler) return;
        const elementRegistry = modeler.get('elementRegistry') as any;
        const element = elementRegistry.get(id);
        const selection = modeler.get('selection') as any;
        if (element) {
            selection.select(element);
            // Scroll to view if needed? Modeler handles selection highlight.
        }
    };

    const handleUpdate = (id: string, field: string, value: string) => {
        if (!modeler) return;
        const elementRegistry = modeler.get('elementRegistry') as any;
        const modeling = modeler.get('modeling') as any;
        const element = elementRegistry.get(id);

        if (!element) return;

        if (field === 'name') {
            modeling.updateProperties(element, { name: value });
        } else {
            const update: any = {};
            update[`custom:${field}`] = value;
            modeling.updateProperties(element, update);
        }
        // fetchTasks will be triggered by commandStack.changed
    };

    return (
        <div className="h-64 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 transition-colors">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm px-2">Список завдань</h3>
            </div>
            <div className="overflow-auto flex-1 p-0">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Назва</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Відділ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Виконавець</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center" colSpan={5}>
                                    Елементів ще немає. Перетягніть завдання на канвас.
                                </td>
                            </tr>
                        ) : rows.map((row) => (
                            <tr key={row.id} onClick={() => handleRowClick(row.id)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500 font-mono">
                                    {row.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 w-full placeholder-gray-400"
                                        value={row.name}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdate(row.id, 'name', e.target.value)}
                                        placeholder="(Без назви)"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 w-full text-blue-600 dark:text-blue-400 font-medium"
                                        value={row.dept_id}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdate(row.id, 'dept_id', e.target.value)}
                                        placeholder="-"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <select
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 w-full text-xs dark:bg-gray-800"
                                        value={row.status}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdate(row.id, 'clickupStatus', e.target.value)}
                                    >
                                        <option value="">Status...</option>
                                        <option value="to_do">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="complete">Complete</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <input
                                        className="bg-transparent border-none focus:ring-1 focus:ring-blue-500 w-full"
                                        value={row.assignee}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdate(row.id, 'clickupAssignee', e.target.value)}
                                        placeholder="Assignee..."
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
