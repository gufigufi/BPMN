import { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { useLaneLogic } from '../hooks/useLaneLogic';
import { customTranslate } from '../utils/customTranslate';

// Helper to define local translate module
const customTranslateModule = {
  translate: ['value', customTranslate]
};

// Initial BPMN XML with Pool and Lanes (Marketing & Sales)
export const initialXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Процес: Лід в CRM" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Marketing" name="Маркетинг">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Sales" name="Продажі" />
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Лід отримано">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Marketing_di" bpmnElement="Lane_Marketing" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="570" height="125" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Sales_di" bpmnElement="Lane_Sales" isHorizontal="true">
        <dc:Bounds x="190" y="205" width="570" height="125" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="252" y="122" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="236" y="165" width="69" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface CanvasProps {
  onModelerInit: (modeler: BpmnModeler) => void;
  modelerInstance: BpmnModeler | null;
}

export function Canvas({ onModelerInit, modelerInstance }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLaneLogic(modelerInstance);

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [
        customTranslateModule
      ],
      keyboard: {
        bindTo: document
      }
    });

    const savedXml = localStorage.getItem('bpmnDiagram');
    const xmlToImport = savedXml || initialXml;

    modeler.importXML(xmlToImport).then(() => {
      const canvas = modeler.get('canvas');
      // @ts-ignore
      canvas.zoom('fit-viewport');
    }).catch(console.error);

    onModelerInit(modeler);

    // Autosave on changes
    modeler.on('commandStack.changed', async () => {
      try {
        const { xml } = await modeler.saveXML({ format: true });
        if (xml) {
          localStorage.setItem('bpmnDiagram', xml);
        }
      } catch (err) {
        console.error('Failed to save BPMN', err);
      }
    });

    return () => {
      modeler.destroy();
    }
  }, []);

  return (
    <div className="flex-1 h-full relative" ref={containerRef}></div>
  );
}
