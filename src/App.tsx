import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Download, Upload, FilePlus, Save, Maximize, Table, Tags, Sidebar as SidebarIcon, LayoutPanelTop, EyeOff } from 'lucide-react';
import { Canvas, initialXml } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DataTable } from './components/DataTable';
import { StatusManager } from './components/StatusManager';
import { useCustomStatuses } from './hooks/useCustomStatuses';
// @ts-ignore
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { exportToNotionCSV, downloadCSV } from './utils/exportUtils';
import { autoAssignDepartments } from './utils/departmentLogic';

function App() {
  const [_modeler, setModeler] = useState<BpmnModeler | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout States
  const [isTableFull, setIsTableFull] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [tableHeight, setTableHeight] = useState(300); // Default height in px
  const [isResizing, setIsResizing] = useState(false);

  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const { statuses, addStatus, updateStatus, deleteStatus } = useCustomStatuses();

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

  // Resizing Logic
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      // Min 100px, max 80% screen
      setTableHeight(Math.max(100, Math.min(newHeight, window.innerHeight * 0.8)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleModelerInit = (modeler: BpmnModeler) => {
    setModeler(modeler);
  };

  const handleNew = async () => {
    if (!_modeler) return;
    try {
      await _modeler.importXML(initialXml);
      localStorage.removeItem('bpmnDiagram');
      // @ts-ignore
      _modeler.get('canvas').zoom('fit-viewport');
    } catch (err) {
      console.error('Error resetting diagram', err);
    }
  };

  const handleSaveBpmn = async () => {
    if (!_modeler) return;
    try {
      const { xml } = await _modeler.saveXML({ format: true });
      if (!xml) return;
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.bpmn';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error saving BPMN', err);
    }
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !_modeler) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        await _modeler.importXML(content);
        // @ts-ignore
        _modeler.get('canvas').zoom('fit-viewport');
      } catch (err) {
        console.error('Error loading BPMN', err);
        alert('Помилка при відкритті файлу.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = () => {
    if (!_modeler) return;
    const { csv, filename } = exportToNotionCSV(_modeler);
    downloadCSV(csv, filename);
  };

  const handleApprove = () => {
    if (!_modeler) return;
    autoAssignDepartments(_modeler);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".bpmn,.xml"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-lg hidden sm:block">BPMN Editor</h1>
        </div>

        {/* Toolbar */}
        <div className="flex gap-2 items-center">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-4 gap-1">
            <button onClick={handleNew} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all" title="Нова діаграма">
              <FilePlus size={18} />
            </button>
            <button onClick={handleLoadClick} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all" title="Відкрити">
              <Upload size={18} />
            </button>
            <button onClick={handleSaveBpmn} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all" title="Зберегти">
              <Save size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            <button
              onClick={() => setIsStatusManagerOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
              title="Статуси"
            >
              <Tags size={18} />
            </button>

            {/* Layout Toggles */}
            <button
              onClick={() => { setIsTableVisible(!isTableVisible); if (!isTableVisible) setIsTableFull(false); }}
              className={`p-2 rounded-md transition-all ${isTableVisible ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400'}`}
              title={isTableVisible ? "Сховати таблицю" : "Показати таблицю"}
            >
              {isTableVisible ? <Table size={18} /> : <EyeOff size={18} />}
            </button>

            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className={`p-2 rounded-md transition-all ${isSidebarVisible ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-400'}`}
              title={isSidebarVisible ? "Сховати бокову панель" : "Показати бокову панель"}
            >
              <SidebarIcon size={18} />
            </button>

            <button
              onClick={() => { setIsTableFull(!isTableFull); if (!isTableFull) setIsTableVisible(true); }}
              className={`p-2 rounded-md transition-all ${isTableFull ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              title={isTableFull ? "Згорнути таблицю" : "Таблиця на весь екран"}
            >
              <LayoutPanelTop size={18} />
            </button>

            <button onClick={handleFullScreen} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all" title="Повний екран">
              <Maximize size={18} />
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors ${theme === 'light' ? 'text-yellow-500' : 'text-blue-400'}`}
          >
            {theme === 'light' ? <Sun size={20} className="fill-current" /> : <Moon size={20} className="fill-current" />}
          </button>

          <button onClick={handleApprove} className="hidden sm:block px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">Затвердити</button>
          <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download size={16} /> <span className="hidden md:inline">Експорт</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Canvas Area */}
          <div className={`flex-1 relative ${isTableFull ? 'hidden' : 'block'}`}>
            <Canvas onModelerInit={handleModelerInit} modelerInstance={_modeler} />
          </div>

          {/* Table Area with Resizer */}
          {isTableVisible && (
            <div
              style={{ height: isTableFull ? '100%' : `${tableHeight}px` }}
              className="flex flex-col relative shrink-0 transition-[height] duration-0"
            >
              {!isTableFull && (
                <div
                  onMouseDown={() => setIsResizing(true)}
                  className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors z-30"
                />
              )}
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
                <DataTable modeler={_modeler} statuses={statuses} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {isSidebarVisible && !isTableFull && (
          <div className="w-80 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300">
            <PropertiesPanel modeler={_modeler} statuses={statuses} />
          </div>
        )}
      </div>

      <StatusManager
        isOpen={isStatusManagerOpen}
        onClose={() => setIsStatusManagerOpen(false)}
        statuses={statuses}
        onAdd={addStatus}
        onUpdate={updateStatus}
        onDelete={deleteStatus}
      />
    </div>
  );
}

export default App;
