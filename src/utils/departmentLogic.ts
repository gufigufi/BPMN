import BpmnModeler from 'bpmn-js/lib/Modeler';

// Map of modern colors for departments
export const DEPT_COLORS: Record<string, { fill: string; stroke: string }> = {
    'IT': { fill: '#dbeafe', stroke: '#1d4ed8' },
    'PR': { fill: '#fce7f3', stroke: '#be185d' },
    'HR': { fill: '#dcfce7', stroke: '#15803d' },
    'Sales': { fill: '#ffedd5', stroke: '#c2410c' },
    'Finance': { fill: '#f3e8ff', stroke: '#6d28d9' },
    'Legal': { fill: '#fee2e2', stroke: '#b91c1c' },
    'Marketing': { fill: '#f5f5f4', stroke: '#44403c' },
    'Default': { fill: '#f8fafc', stroke: '#475569' }
};

export function autoAssignDepartments(modeler: BpmnModeler) {
    const elementRegistry = modeler.get('elementRegistry') as any;
    const modeling = modeler.get('modeling') as any;

    const elements = elementRegistry.getAll();
    const lanes = elementRegistry.filter((e: any) => e.type === 'bpmn:Lane');

    let count = 0;

    // First, color the lanes themselves based on their names
    lanes.forEach((lane: any) => {
        const name = lane.businessObject.name || '';
        const color = DEPT_COLORS[name] || DEPT_COLORS['Default'];
        modeling.setColor(lane, {
            fill: color.fill,
            stroke: color.stroke
        });
    });

    elements.forEach((shape: any) => {
        // Skip non-flow nodes
        if (shape.type === 'bpmn:Lane' || shape.type === 'bpmn:Participant' || shape.type === 'bpmn:Process' || shape.type === 'bpmn:Label' || shape.type === 'bpmn:SequenceFlow') {
            return;
        }

        // Geometry Check
        const shapeCenter = {
            x: shape.x + shape.width / 2,
            y: shape.y + shape.height / 2
        };

        let foundLane = null;

        for (const lane of lanes) {
            const x = lane.x;
            const y = lane.y;
            const w = lane.width;
            const h = lane.height;

            if (shapeCenter.x >= x && shapeCenter.x <= x + w &&
                shapeCenter.y >= y && shapeCenter.y <= y + h) {
                foundLane = lane;
                break;
            }
        }

        if (foundLane) {
            const deptId = foundLane.businessObject.name || foundLane.id;
            const currentDeptId = shape.businessObject.dept_id || shape.businessObject.get('custom:dept_id');

            if (currentDeptId !== deptId) {
                modeling.updateProperties(shape, {
                    'custom:dept_id': deptId
                });
                shape.businessObject.dept_id = deptId;

                // Also color the element based on the department
                const color = DEPT_COLORS[deptId] || DEPT_COLORS['Default'];
                modeling.setColor(shape, {
                    fill: color.fill,
                    stroke: color.stroke
                });

                count++;
            }
        } else {
            // If not in any lane, clear it
            if (shape.businessObject.dept_id || shape.businessObject.get('custom:dept_id')) {
                modeling.updateProperties(shape, {
                    'custom:dept_id': null
                });
                shape.businessObject.dept_id = null;
                count++;
            }
        }
    });

    return count;
}
