import BpmnModeler from 'bpmn-js/lib/Modeler';

export function exportToNotionCSV(modeler: BpmnModeler) {
    const elementRegistry = modeler.get('elementRegistry');

    // Get Process Name
    // @ts-ignore
    const participant = elementRegistry.filter((e: any) => e.type === 'bpmn:Participant')[0];
    const processName = participant ? participant.businessObject.name : 'BPMN Process';
    const safeProcessName = processName.replace(/[^a-z0-9а-яіїєґ ]/gi, '_');

    // @ts-ignore
    const elements = elementRegistry.filter((e: any) =>
        e.type.includes('Task') || e.type.includes('Event')
    );

    // CSV Headers
    // Notion auto-detects headers. 'Name' acts as the Title property.
    const headers = ['Name', 'Department', 'Status', 'Assignee', 'Priority', 'Due Date', 'Content'];
    const rows = [headers.join(',')];

    elements.forEach((e: any) => {
        const bo = e.businessObject;

        const inputData = bo.get('custom:inputData') || '';
        const outputData = bo.get('custom:outputData') || '';
        const description = (bo.documentation && bo.documentation[0] ? bo.documentation[0].text : '');

        // Construct Body Content with Visual Separation (Pseudo-formatting for Plain Text)
        const contentLines = [];
        if (description) contentLines.push(`=== ОПИС ПРОЦЕСУ ===\n${description}`);
        if (inputData) contentLines.push(`=== ВХІДНІ ДАНІ ===\n${inputData}`);
        if (outputData) contentLines.push(`=== ВИХІДНІ ДАНІ ===\n${outputData}`);

        const bodyContent = contentLines.join('\n\n');

        const rowData = [
            bo.name || 'Untitled Task',
            bo.dept_id || bo.get('custom:dept_id') || 'General',
            bo.get('custom:notionStatus') || 'Not Started',
            bo.get('custom:notionAssignee') || '',
            bo.get('custom:notionPriority') || 'Medium',
            bo.get('custom:notionDueDate') || '',
            bodyContent
        ];

        // Escape CSV values
        const csvRow = rowData.map(val => {
            const stringVal = String(val || '');
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });

        rows.push(csvRow.join(','));
    });

    return { csv: rows.join('\n'), filename: `${safeProcessName}.csv` };
}

export function downloadCSV(data: string, filename: string) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadJson(data: any, filename: string) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
