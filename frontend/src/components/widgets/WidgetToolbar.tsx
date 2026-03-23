/* ============================================================
   WidgetToolbar – Edit mode controls above the grid
   ============================================================ */

import type { LayoutItem } from './widgetRegistry';

interface WidgetToolbarProps {
  editActive: boolean;
  onToggleEdit: () => void;
  onAddWidget: () => void;
  onUndo: () => LayoutItem[] | null;
  onRedo: () => LayoutItem[] | null;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onApplyUndoRedo: (layout: LayoutItem[] | null) => void;
  showToast: (message: string, type?: string) => void;
}

export default function WidgetToolbar({
  editActive, onToggleEdit, onAddWidget,
  onUndo, onRedo, onSave, onExport, onImport, onReset,
  onApplyUndoRedo, showToast
}: WidgetToolbarProps) {
  return (
    <div className="wg-toolbar">
      <div className="wg-toolbar-left">
        <div className="wg-edit-indicator">
          <span className="wg-edit-dot" />
          <span>EDIT MODE</span>
        </div>
      </div>

      <div className="wg-toolbar-right">
        {editActive && (
          <>
            <button className="wg-btn" title="Undo (Ctrl+Z)" onClick={() => {
              const layout = onUndo();
              onApplyUndoRedo(layout);
              if (layout) showToast('Undo', 'info');
            }}>
              <span className="material-symbols-outlined wg-btn-icon">undo</span>
            </button>
            <button className="wg-btn" title="Redo (Ctrl+Y)" onClick={() => {
              const layout = onRedo();
              onApplyUndoRedo(layout);
              if (layout) showToast('Redo', 'info');
            }}>
              <span className="material-symbols-outlined wg-btn-icon">redo</span>
            </button>

            <div className="wg-toolbar-divider" />

            <button className="wg-btn" title="Add Widget" onClick={onAddWidget}>
              <span className="material-symbols-outlined wg-btn-icon">add</span>
              <span className="wg-btn-label">Add Widget</span>
            </button>

            <div className="wg-toolbar-divider" />

            <button className="wg-btn" title="Export Layout" onClick={() => { onExport(); showToast('Layout exported', 'success'); }}>
              <span className="material-symbols-outlined wg-btn-icon">download</span>
            </button>
            <button className="wg-btn" title="Import Layout" onClick={onImport}>
              <span className="material-symbols-outlined wg-btn-icon">upload</span>
            </button>
            <button className="wg-btn wg-btn-danger" title="Reset Layout" onClick={onReset}>
              <span className="material-symbols-outlined wg-btn-icon">delete</span>
            </button>

            <div className="wg-toolbar-divider" />

            <button className="wg-btn wg-btn-save" title="Save Layout" onClick={() => { onSave(); showToast('Layout saved', 'success'); }}>
              <span className="material-symbols-outlined wg-btn-icon">save</span>
              <span className="wg-btn-label">Save</span>
            </button>
          </>
        )}

        <button
          className={`wg-btn ${editActive ? 'wg-btn-primary' : ''}`}
          title="Toggle Edit Mode"
          onClick={onToggleEdit}
        >
          <span className="material-symbols-outlined wg-btn-icon">dashboard_customize</span>
          <span className="wg-btn-label">{editActive ? 'Done Editing' : 'Customize'}</span>
        </button>
      </div>
    </div>
  );
}
