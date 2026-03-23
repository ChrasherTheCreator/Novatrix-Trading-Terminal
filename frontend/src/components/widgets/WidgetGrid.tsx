/* ============================================================
   WidgetGrid – Main container component
   Integrates GridEngine + EditMode + WidgetCards + Library + Toolbar
   ============================================================ */

import { useRef, useEffect, useCallback, useState } from 'react';
import './widgetGrid.css';
import { useGridEngine } from './useGridEngine';
import { useEditMode } from './useEditMode';
import {
  getWidgetDef,
  DEFAULT_DASHBOARD_LAYOUT,
  DEFAULT_ANALYTICS_LAYOUT,
  type LayoutItem,
} from './widgetRegistry';
import WidgetCard from './WidgetCard';
import WidgetToolbar from './WidgetToolbar';
import WidgetLibrary from './WidgetLibrary';

const STORAGE_PREFIX = 'novatrix-widget-layout-';

interface WidgetGridProps {
  tabId: 'dashboard' | 'analytics';
}

export default function WidgetGrid({ tabId }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);
  const toastIdRef = useRef(0);

  const engine = useGridEngine(containerRef);

  const showToast = useCallback((message: string, type: string = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Edit mode
  const editMode = useEditMode({
    onMove: engine.moveWidget,
    onResize: engine.resizeWidget,
    getLayoutSnapshot: engine.getLayoutSnapshot,
    loadLayout: engine.loadLayout,
    snapToGrid: engine.snapToGrid,
    colRowToPixel: engine.colRowToPixel,
    sizeToPixel: engine.sizeToPixel,
    getMetrics: engine.getMetrics,
    getWidget: (instanceId: string) => {
      const w = engine.widgets.get(instanceId);
      return w || undefined;
    },
  });

  // Load layout on mount
  useEffect(() => {
    const storageKey = STORAGE_PREFIX + tabId;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const layout = JSON.parse(saved) as LayoutItem[];
        if (Array.isArray(layout) && layout.length > 0) {
          engine.loadLayout(layout);
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // Load default layout
    const defaultLayout = tabId === 'dashboard' ? DEFAULT_DASHBOARD_LAYOUT : DEFAULT_ANALYTICS_LAYOUT;
    engine.loadLayout(defaultLayout);
  }, [tabId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup edit mode on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('wg-edit-mode');
    };
  }, []);

  // Save
  const handleSave = useCallback(() => {
    const storageKey = STORAGE_PREFIX + tabId;
    const layout = engine.getLayoutSnapshot();
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (e) {
      showToast('Failed to save layout', 'error');
    }
  }, [tabId, engine, showToast]);

  // Export
  const handleExport = useCallback(() => {
    const layout = engine.getLayoutSnapshot();
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novatrix-${tabId}-layout-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tabId, engine]);

  // Import
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const layout = JSON.parse(ev.target?.result as string);
          if (Array.isArray(layout)) {
            engine.loadLayout(layout);
            showToast('Layout imported', 'success');
          } else {
            showToast('Invalid layout format', 'error');
          }
        } catch (err) {
          showToast('Failed to parse JSON', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [engine, showToast]);

  // Reset
  const handleReset = useCallback(() => {
    if (confirm('Reset to default layout? This will discard all changes.')) {
      const storageKey = STORAGE_PREFIX + tabId;
      localStorage.removeItem(storageKey);
      const defaultLayout = tabId === 'dashboard' ? DEFAULT_DASHBOARD_LAYOUT : DEFAULT_ANALYTICS_LAYOUT;
      engine.loadLayout(defaultLayout);
      showToast('Layout reset to default', 'info');
    }
  }, [tabId, engine, showToast]);

  // Add widget from library
  const handleAddWidget = useCallback((widgetId: string) => {
    const def = getWidgetDef(widgetId);
    if (!def) return;

    const pos = engine.findNextAvailablePosition(def.defaultW, def.defaultH);
    engine.addWidget(widgetId, pos.col, pos.row, def.defaultW, def.defaultH);

    showToast(`${def.name} added`, 'success');
    setLibraryOpen(false);

    // Ensure edit mode is on
    if (!editMode.editActive) {
      editMode.toggleEditMode();
    }
  }, [engine, editMode, showToast]);

  // Remove widget
  const handleRemove = useCallback((instanceId: string) => {
    const widget = engine.widgets.get(instanceId);
    const def = widget ? getWidgetDef(widget.widgetId) : null;
    engine.removeWidget(instanceId);
    showToast(`${def?.name || 'Widget'} removed`, 'info');
  }, [engine, showToast]);

  // Undo/Redo apply
  const handleApplyUndoRedo = useCallback((layout: LayoutItem[] | null) => {
    if (layout) engine.loadLayout(layout);
  }, [engine]);

  // Calculate container height
  const containerHeight = engine.getContainerHeight();

  return (
    <div className="fade-in">
      <WidgetToolbar
        editActive={editMode.editActive}
        onToggleEdit={editMode.toggleEditMode}
        onAddWidget={() => setLibraryOpen(true)}
        onUndo={editMode.undo}
        onRedo={editMode.redo}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onApplyUndoRedo={handleApplyUndoRedo}
        showToast={showToast}
      />

      <div
        ref={containerRef}
        className="wg-grid-container"
        style={{ minHeight: containerHeight }}
      >
        {/* Ghost Element */}
        <div className="wg-grid-ghost" style={editMode.ghostStyle} />

        {/* Widget Cards */}
        {Array.from(engine.widgets.entries()).map(([instanceId, widget]) => {
          const pos = engine.colRowToPixel(widget.col, widget.row);
          const size = engine.sizeToPixel(widget.w, widget.h);

          return (
            <WidgetCard
              key={instanceId}
              instanceId={instanceId}
              widgetId={widget.widgetId}
              style={{
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height,
              }}
              onStartDrag={editMode.startDrag}
              onStartResize={editMode.startResize}
              onRemove={handleRemove}
              containerRef={containerRef}
            />
          );
        })}
      </div>

      {/* Widget Library Drawer */}
      <WidgetLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={handleAddWidget}
      />

      {/* Toast Notifications */}
      <div className="wg-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`wg-toast wg-${t.type}`}>
            <span className="wg-toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
