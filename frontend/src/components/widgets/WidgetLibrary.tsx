/* ============================================================
   WidgetLibrary – Drawer showing all available widgets
   ============================================================ */

import { useState } from 'react';
import { WIDGET_REGISTRY } from './widgetRegistry';

interface WidgetLibraryProps {
  open: boolean;
  onClose: () => void;
  onAdd: (widgetId: string) => void;
}

export default function WidgetLibrary({ open, onClose, onAdd }: WidgetLibraryProps) {
  const [search, setSearch] = useState('');

  const filtered = WIDGET_REGISTRY.filter(def => {
    const q = search.toLowerCase();
    return def.name.toLowerCase().includes(q) || def.category.toLowerCase().includes(q);
  });

  return (
    <>
      <div
        className={`wg-library-overlay ${open ? 'wg-open' : ''}`}
        onClick={onClose}
      />
      <aside className={`wg-library-drawer ${open ? 'wg-open' : ''}`}>
        <div className="wg-library-header">
          <h2>Widget Library</h2>
          <button className="wg-library-close" onClick={onClose}>✕</button>
        </div>
        <div className="wg-library-search">
          <input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="wg-library-list">
          {filtered.map(def => (
            <div key={def.id} className="wg-library-item">
              <div className="wg-library-item-preview">
                <iframe
                  src={def.src}
                  loading="lazy"
                  scrolling="no"
                  sandbox="allow-scripts allow-same-origin"
                  tabIndex={-1}
                  title={`${def.name} preview`}
                />
              </div>
              <div className="wg-library-item-info">
                <div className="wg-library-item-name">{def.name}</div>
                <div className="wg-library-item-meta">{def.category} · {def.defaultW}×{def.defaultH}</div>
              </div>
              <button
                className="wg-library-item-add"
                title="Add to dashboard"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(def.id);
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
