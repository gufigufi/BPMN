import BpmnModeler from 'bpmn-js/lib/Modeler';

// Map of colors for departments (vibrant for white canvas)
export const DEPT_COLORS: Record<string, { fill: string; stroke: string }> = {
    'IT': { fill: '#e0f2fe', stroke: '#0369a1' },        // Sky blue
    'PR': { fill: '#fae8ff', stroke: '#a21caf' },        // Fuchia
    'HR': { fill: '#dcfce7', stroke: '#15803d' },        // Green
    'Sales': { fill: '#ffedd5', stroke: '#c2410c' },     // Orange
    'Finance': { fill: '#fef9c3', stroke: '#a16207' },    // Yellow
    'Legal': { fill: '#fee2e2', stroke: '#b91c1c' },      // Red
    'Marketing': { fill: '#e0e7ff', stroke: '#4338ca' },  // Indigo
    'Default': { fill: '#f1f5f9', stroke: '#475569' }     // Slate
};

export function autoAssignDepartments(modeler: BpmnModeler) {
    const elementRegistry = modeler.get('elementRegistry') as any;
    const modeling = modeler.get('modeling') as any;

    const elements = elementRegistry.getAll();
    const lanes = elementRegistry.filter((e: any) => e.type === 'bpmn:Lane');

    let count = 0;

    // First, color the lanes themselves based on their names
    lanes.forEach((lane: any) => {
        // Only color the lane if it doesn't have a manual color yet
        const hasManualColor = lane.di && (lane.di.get('fill') || lane.di.get('stroke'));

        if (!hasManualColor) {
            const name = lane.businessObject.name || '';
            const color = DEPT_COLORS[name] || DEPT_COLORS['Default'];
            modeling.setColor(lane, {
                fill: color.fill,
                stroke: color.stroke
            });
        }
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

                // Only color the element if it doesn't have a manual color yet
                const hasManualColor = shape.di && (shape.di.get('fill') || shape.di.get('stroke'));

                if (!hasManualColor) {
                    const color = DEPT_COLORS[deptId] || DEPT_COLORS['Default'];
                    modeling.setColor(shape, {
                        fill: color.fill,
                        stroke: color.stroke
                    });
                }

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
