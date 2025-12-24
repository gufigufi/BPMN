import BpmnModeler from 'bpmn-js/lib/Modeler';

export function exportToClickUpJson(modeler: BpmnModeler) {
    const elementRegistry = modeler.get('elementRegistry');

    // 1. Find the Process Name (Folder) -> usually the Participant Name or Process Name
    // We'll try to find a Participant first
    // @ts-ignore
    const participant = elementRegistry.filter((e: any) => e.type === 'bpmn:Participant')[0];
    const processName = participant ? participant.businessObject.name : 'Business Process';

    // 2. Find Lanes (Lists)
    // @ts-ignore
    const lanes = elementRegistry.filter((e: any) => e.type === 'bpmn:Lane');

    const folder = {
        name: processName,
        lists: [] as any[]
    };

    if (lanes.length > 0) {
        lanes.forEach((lane: any) => {
            const listName = lane.businessObject.name || lane.id;
            const listContent = {
                name: listName,
                tasks: [] as any[]
            };

            // Find tasks in this Lane
            // We can use our dept_id logic or the flowNodeRef
            // Using flowNodeRef is safer for what is currently in the lane according to BPMN
            const refs = lane.businessObject.flowNodeRef || [];

            refs.forEach((nodeBo: any) => {
                // We need to look up the shape to get custom properties easily if they are not fully on BO (they are on BO usually)
                // But custom properties are on BO.

                // Filter for Tasks only
                if (!nodeBo.$type.includes('Task') && !nodeBo.$type.includes('Event')) return;

                const task = {
                    name: nodeBo.name || 'Untitled Task',
                    description: (nodeBo.documentation && nodeBo.documentation[0] ? nodeBo.documentation[0].text : ''),
                    status: nodeBo.get('custom:clickupStatus') || 'open',
                    assignee: nodeBo.get('custom:clickupAssignee') || null,
                    priority: nodeBo.get('custom:clickupPriority') || null,
                    custom_fields: {
                        input: nodeBo.get('custom:inputData'),
                        output: nodeBo.get('custom:outputData'),
                        dept_id: nodeBo.get('custom:dept_id') || lane.businessObject.name
                    }
                };
                listContent.tasks.push(task);
            });

            folder.lists.push(listContent);
        });
    } else {
        // No lanes? Put everything in one list "General"
        // @ts-ignore
        const tasks = elementRegistry.filter((e: any) => e.type.includes('Task'));
        const listContent = {
            name: "General",
            tasks: tasks.map((e: any) => {
                const bo = e.businessObject;
                return {
                    name: bo.name || 'Untitled Task',
                    description: (bo.documentation && bo.documentation[0] ? bo.documentation[0].text : ''),
                    status: bo.get('custom:clickupStatus') || 'open',
                    // ...
                };
            })
        };
        folder.lists.push(listContent);
    }

    return folder;
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
