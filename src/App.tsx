import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DataTable } from './components/DataTable';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { exportToClickUpJson, downloadJson } from './utils/exportUtils';
import { autoAssignDepartments } from './utils/departmentLogic';

function App() {
  const [_modeler, setModeler] = useState<BpmnModeler | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleModelerInit = (modeler: BpmnModeler) => {
    setModeler(modeler);
  };

  const handleExport = () => {
    if (!_modeler) return;
    const data = exportToClickUpJson(_modeler);
    downloadJson(data, 'process_export.json');
  };

  const handleApprove = () => {
    if (!_modeler) return;
    const count = autoAssignDepartments(_modeler);
    if (count > 0) {
      console.log('Departments updated');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg">BPMN Editor</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors ${theme === 'light'
                ? 'text-yellow-500 hover:bg-yellow-50'
                : 'text-blue-400 hover:bg-blue-900/30'
              }`}
            title={theme === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
          >
            {theme === 'light' ? <Sun size={20} className="fill-current" /> : <Moon size={20} className="fill-current" />}
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            Затвердити
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Експорт ClickUp
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* BPMN Canvas Area */}
        <div className="flex-1 flex flex-col relative">
          <Canvas onModelerInit={handleModelerInit} modelerInstance={_modeler} />
          {/* Bottom Panel */}
          <DataTable modeler={_modeler} />
        </div>

        {/* Right Sidebar */}
        <PropertiesPanel modeler={_modeler} />
      </div>
    </div>
  );
}

export default App;
