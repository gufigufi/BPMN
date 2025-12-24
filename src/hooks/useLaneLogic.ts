import { useEffect } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';

export function useLaneLogic(modeler: BpmnModeler | null) {
    useEffect(() => {
        if (!modeler) return;
        // Auto-update logic removed by user request to fix drag-and-drop issues. 
        // Logic moved to manual "Approve" button.
    }, [modeler]);
}
