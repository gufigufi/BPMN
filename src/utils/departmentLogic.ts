import BpmnModeler from 'bpmn-js/lib/Modeler';

export function autoAssignDepartments(modeler: BpmnModeler) {
    const elementRegistry = modeler.get('elementRegistry') as any;
    const modeling = modeler.get('modeling') as any;

    const elements = elementRegistry.getAll();
    const lanes = elementRegistry.filter((e: any) => e.type === 'bpmn:Lane');

    let count = 0;

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

    console.log(`[AutoAssign] Updated ${count} elements.`);
    return count;
}
