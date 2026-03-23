/* ============================================================
   useGridEngine – React Hook for Grid Positioning & Collision
   Ported from Widget sample project/js/grid-engine.js
   ============================================================ */

import { useCallback, useRef, useState } from 'react';
import { getWidgetDef, type LayoutItem } from './widgetRegistry';

export interface WidgetInstance {
  widgetId: string;
  col: number;
  row: number;
  w: number;
  h: number;
}

interface GridMetrics {
  columns: number;
  colWidth: number;
  rowHeight: number;
  gap: number;
  padding: number;
}

export function useGridEngine(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [widgets, setWidgets] = useState<Map<string, WidgetInstance>>(new Map());
  const nextIdRef = useRef(1);

  const getMetrics = useCallback((): GridMetrics => {
    const columns = 12;
    const colWidth = 117;
    const rowHeight = 72;
    const gap = 16;
    const containerW = containerRef.current?.clientWidth || 1400;
    const totalGridWidth = (columns * colWidth) + ((columns - 1) * gap);
    const padding = Math.max(24, Math.floor((containerW - totalGridWidth) / 2));
    return { columns, colWidth, rowHeight, gap, padding };
  }, [containerRef]);

  const colRowToPixel = useCallback((col: number, row: number) => {
    const m = getMetrics();
    return {
      x: m.padding + col * (m.colWidth + m.gap),
      y: row * (m.rowHeight + m.gap)
    };
  }, [getMetrics]);

  const sizeToPixel = useCallback((w: number, h: number) => {
    const m = getMetrics();
    return {
      width: w * m.colWidth + (w - 1) * m.gap,
      height: h * m.rowHeight + (h - 1) * m.gap
    };
  }, [getMetrics]);

  const snapToGrid = useCallback((x: number, y: number, w: number, h: number) => {
    const m = getMetrics();
    let col = Math.round((x - m.padding) / (m.colWidth + m.gap));
    let row = Math.round(y / (m.rowHeight + m.gap));
    col = Math.max(0, Math.min(col, m.columns - w));
    row = Math.max(0, row);
    return { col, row };
  }, [getMetrics]);

  const collides = useCallback((a: { col: number; row: number; w: number; h: number }, b: { col: number; row: number; w: number; h: number }) => {
    return !(
      a.col + a.w <= b.col ||
      b.col + b.w <= a.col ||
      a.row + a.h <= b.row ||
      b.row + b.h <= a.row
    );
  }, []);

  const resolveCollisions = useCallback((allWidgets: Map<string, WidgetInstance>, movedId: string): Map<string, WidgetInstance> => {
    const result = new Map(allWidgets);
    const moved = result.get(movedId);
    if (!moved) return result;

    const others: Array<{ id: string } & WidgetInstance> = [];
    result.forEach((w, id) => {
      if (id !== movedId) others.push({ id, ...w });
    });
    others.sort((a, b) => a.row - b.row || a.col - b.col);

    for (const other of others) {
      const otherWidget = result.get(other.id);
      if (otherWidget && collides(moved, otherWidget)) {
        const updated = { ...otherWidget, row: moved.row + moved.h };
        result.set(other.id, updated);
        // Recursive resolve
        const subResult = resolveCollisions(result, other.id);
        subResult.forEach((v, k) => result.set(k, v));
      }
    }
    return result;
  }, [collides]);

  const compact = useCallback((allWidgets: Map<string, WidgetInstance>): Map<string, WidgetInstance> => {
    const result = new Map(allWidgets);
    const sorted: Array<{ id: string } & WidgetInstance> = [];
    result.forEach((w, id) => sorted.push({ id, ...w }));
    sorted.sort((a, b) => a.row - b.row || a.col - b.col);

    for (const item of sorted) {
      const widget = { ...result.get(item.id)! };
      while (widget.row > 0) {
        widget.row--;
        let collision = false;
        result.forEach((other, otherId) => {
          if (otherId !== item.id && collides(widget, other)) {
            collision = true;
          }
        });
        if (collision) {
          widget.row++;
          break;
        }
      }
      result.set(item.id, widget);
    }
    return result;
  }, [collides]);

  const addWidget = useCallback((widgetId: string, col: number, row: number, w: number, h: number): string => {
    const instanceId = 'inst_' + (nextIdRef.current++);
    const m = getMetrics();
    col = Math.max(0, Math.min(col, m.columns - w));
    row = Math.max(0, row);

    setWidgets(prev => {
      const next = new Map(prev);
      next.set(instanceId, { widgetId, col, row, w, h });
      const resolved = resolveCollisions(next, instanceId);
      return compact(resolved);
    });
    return instanceId;
  }, [getMetrics, resolveCollisions, compact]);

  const removeWidget = useCallback((instanceId: string) => {
    setWidgets(prev => {
      const next = new Map(prev);
      next.delete(instanceId);
      return compact(next);
    });
  }, [compact]);

  const moveWidget = useCallback((instanceId: string, newCol: number, newRow: number) => {
    setWidgets(prev => {
      const next = new Map(prev);
      const widget = next.get(instanceId);
      if (!widget) return prev;

      const m = getMetrics();
      newCol = Math.max(0, Math.min(newCol, m.columns - widget.w));
      newRow = Math.max(0, newRow);

      next.set(instanceId, { ...widget, col: newCol, row: newRow });
      const resolved = resolveCollisions(next, instanceId);
      return compact(resolved);
    });
  }, [getMetrics, resolveCollisions, compact]);

  const resizeWidget = useCallback((instanceId: string, newW: number, newH: number) => {
    setWidgets(prev => {
      const next = new Map(prev);
      const widget = next.get(instanceId);
      if (!widget) return prev;

      const def = getWidgetDef(widget.widgetId);
      const m = getMetrics();
      if (def) {
        newW = Math.max(def.minW, Math.min(newW, def.maxW, m.columns - widget.col));
        newH = Math.max(def.minH, Math.min(newH, def.maxH));
      } else {
        newW = Math.max(1, Math.min(newW, m.columns - widget.col));
        newH = Math.max(1, newH);
      }

      next.set(instanceId, { ...widget, w: newW, h: newH });
      const resolved = resolveCollisions(next, instanceId);
      return compact(resolved);
    });
  }, [getMetrics, resolveCollisions, compact]);

  const getLayoutSnapshot = useCallback((): LayoutItem[] => {
    const layout: LayoutItem[] = [];
    widgets.forEach((w) => {
      layout.push({ widgetId: w.widgetId, col: w.col, row: w.row, w: w.w, h: w.h });
    });
    return layout;
  }, [widgets]);

  const loadLayout = useCallback((layout: LayoutItem[]) => {
    const next = new Map<string, WidgetInstance>();
    for (const item of layout) {
      const def = getWidgetDef(item.widgetId);
      let w = item.w;
      let h = item.h;
      if (def) {
        w = Math.max(def.minW || 1, Math.min(w, def.maxW || 12));
        h = Math.max(def.minH || 1, Math.min(h, def.maxH || 12));
      }
      const instanceId = 'inst_' + (nextIdRef.current++);
      next.set(instanceId, { widgetId: item.widgetId, col: item.col, row: item.row, w, h });
    }
    setWidgets(compact(next));
  }, [compact]);

  const findNextAvailablePosition = useCallback((w: number, h: number): { col: number; row: number } => {
    const m = getMetrics();
    for (let row = 0; row < 200; row++) {
      for (let col = 0; col <= m.columns - w; col++) {
        const testRect = { col, row, w, h };
        let valid = true;
        widgets.forEach((other) => {
          if (collides(testRect, other)) valid = false;
        });
        if (valid) return { col, row };
      }
    }
    return { col: 0, row: 0 };
  }, [getMetrics, widgets, collides]);

  const getContainerHeight = useCallback((): number => {
    const m = getMetrics();
    let maxBottom = 0;
    widgets.forEach(w => {
      const bottom = (w.row + w.h) * (m.rowHeight + m.gap);
      if (bottom > maxBottom) maxBottom = bottom;
    });
    return maxBottom + m.padding * 2;
  }, [getMetrics, widgets]);

  return {
    widgets,
    getMetrics,
    colRowToPixel,
    sizeToPixel,
    snapToGrid,
    addWidget,
    removeWidget,
    moveWidget,
    resizeWidget,
    getLayoutSnapshot,
    loadLayout,
    findNextAvailablePosition,
    getContainerHeight,
  };
}
