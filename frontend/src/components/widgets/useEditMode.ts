/* ============================================================
   useEditMode – React Hook for Drag, Resize, Undo/Redo
   Ported from Widget sample project/js/edit-mode.js
   ============================================================ */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { LayoutItem } from './widgetRegistry';

interface DragState {
  active: boolean;
  instanceId: string | null;
  offsetX: number;
  offsetY: number;
  startCol: number;
  startRow: number;
}

interface ResizeState {
  active: boolean;
  instanceId: string | null;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

interface UseEditModeOptions {
  onMove: (instanceId: string, col: number, row: number) => void;
  onResize: (instanceId: string, w: number, h: number) => void;
  getLayoutSnapshot: () => LayoutItem[];
  loadLayout: (layout: LayoutItem[]) => void;
  snapToGrid: (x: number, y: number, w: number, h: number) => { col: number; row: number };
  colRowToPixel: (col: number, row: number) => { x: number; y: number };
  sizeToPixel: (w: number, h: number) => { width: number; height: number };
  getMetrics: () => { colWidth: number; rowHeight: number; gap: number; columns: number; padding: number; scale?: number };
  getWidget: (instanceId: string) => { widgetId: string; col: number; row: number; w: number; h: number } | undefined;
}

export function useEditMode(opts: UseEditModeOptions) {
  const [editActive, setEditActive] = useState(false);
  const [ghostStyle, setGhostStyle] = useState<React.CSSProperties>({ display: 'none' });
  const undoStackRef = useRef<LayoutItem[][]>([]);
  const redoStackRef = useRef<LayoutItem[][]>([]);

  const dragRef = useRef<DragState>({ active: false, instanceId: null, offsetX: 0, offsetY: 0, startCol: 0, startRow: 0 });
  const resizeRef = useRef<ResizeState>({ active: false, instanceId: null, startX: 0, startY: 0, startW: 0, startH: 0 });

  // Ref to the dragged element for direct DOM manipulation during drag
  const dragElRef = useRef<HTMLElement | null>(null);
  const containerElRef = useRef<HTMLElement | null>(null);

  const toggleEditMode = useCallback(() => {
    setEditActive(prev => {
      const next = !prev;
      if (next) {
        undoStackRef.current.push(opts.getLayoutSnapshot());
      }
      document.body.classList.toggle('wg-edit-mode', next);
      return next;
    });
  }, [opts]);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push(opts.getLayoutSnapshot());
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, [opts]);

  const undo = useCallback((): LayoutItem[] | null => {
    if (undoStackRef.current.length <= 1) return null;
    const current = opts.getLayoutSnapshot();
    redoStackRef.current.push(current);
    undoStackRef.current.pop();
    return undoStackRef.current[undoStackRef.current.length - 1] || null;
  }, [opts]);

  const redo = useCallback((): LayoutItem[] | null => {
    if (redoStackRef.current.length === 0) return null;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(next);
    return next;
  }, []);

  const showGhost = useCallback((col: number, row: number, w: number, h: number) => {
    const pos = opts.colRowToPixel(col, row);
    const size = opts.sizeToPixel(w, h);
    setGhostStyle({
      display: 'block',
      left: pos.x,
      top: pos.y,
      width: size.width,
      height: size.height,
    });
  }, [opts]);

  const hideGhost = useCallback(() => {
    setGhostStyle({ display: 'none' });
  }, []);

  const startDrag = useCallback((instanceId: string, mouseX: number, mouseY: number, el: HTMLElement, container: HTMLElement) => {
    if (!editActive) return;
    const widget = opts.getWidget(instanceId);
    if (!widget) return;

    pushUndo();

    const rect = el.getBoundingClientRect();
    const scale = opts.getMetrics().scale || 1;
    dragRef.current = {
      active: true,
      instanceId,
      offsetX: (mouseX - rect.left) / scale,
      offsetY: (mouseY - rect.top) / scale,
      startCol: widget.col,
      startRow: widget.row,
    };
    dragElRef.current = el;
    containerElRef.current = container;

    el.classList.add('wg-dragging');
    el.style.transition = 'none';
    el.style.zIndex = '500';

    showGhost(widget.col, widget.row, widget.w, widget.h);
  }, [editActive, opts, pushUndo, showGhost]);

  const startResize = useCallback((instanceId: string, mouseX: number, mouseY: number, el: HTMLElement) => {
    if (!editActive) return;
    const widget = opts.getWidget(instanceId);
    if (!widget) return;

    pushUndo();

    const scale = opts.getMetrics().scale || 1;
    resizeRef.current = {
      active: true,
      instanceId,
      startX: mouseX / scale,
      startY: mouseY / scale,
      startW: widget.w,
      startH: widget.h,
    };
    dragElRef.current = el;

    el.classList.add('wg-resizing');
    showGhost(widget.col, widget.row, widget.w, widget.h);
  }, [editActive, opts, pushUndo, showGhost]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.active && dragElRef.current && containerElRef.current) {
        const scale = opts.getMetrics().scale || 1;
        const containerRect = containerElRef.current.getBoundingClientRect();
        const posX = (e.clientX - containerRect.left) / scale - dragRef.current.offsetX;
        const posY = (e.clientY - containerRect.top) / scale - dragRef.current.offsetY;

        dragElRef.current.style.left = posX + 'px';
        dragElRef.current.style.top = posY + 'px';

        const widget = opts.getWidget(dragRef.current.instanceId!);
        if (widget) {
          const snap = opts.snapToGrid(posX, posY, widget.w, widget.h);
          showGhost(snap.col, snap.row, widget.w, widget.h);
        }
      }

      if (resizeRef.current.active && dragElRef.current) {
        const m = opts.getMetrics();
        const scale = m.scale || 1;
        const deltaX = (e.clientX / scale) - resizeRef.current.startX;
        const deltaY = (e.clientY / scale) - resizeRef.current.startY;
        const cellW = m.colWidth + m.gap;
        const cellH = m.rowHeight + m.gap;
        const newW = resizeRef.current.startW + Math.round(deltaX / cellW);
        const newH = resizeRef.current.startH + Math.round(deltaY / cellH);

        const widget = opts.getWidget(resizeRef.current.instanceId!);
        if (widget) {
          const size = opts.sizeToPixel(
            Math.max(1, newW),
            Math.max(1, newH)
          );
          dragElRef.current.style.width = size.width + 'px';
          dragElRef.current.style.height = size.height + 'px';
          showGhost(widget.col, widget.row, Math.max(1, newW), Math.max(1, newH));
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current.active && containerElRef.current) {
        const el = dragElRef.current;
        if (el) {
          el.classList.remove('wg-dragging');
          el.style.transition = '';
          el.style.zIndex = '';
        }

        const scale = opts.getMetrics().scale || 1;
        const containerRect = containerElRef.current.getBoundingClientRect();
        const posX = (e.clientX - containerRect.left) / scale - dragRef.current.offsetX;
        const posY = (e.clientY - containerRect.top) / scale - dragRef.current.offsetY;

        const widget = opts.getWidget(dragRef.current.instanceId!);
        if (widget) {
          const snap = opts.snapToGrid(posX, posY, widget.w, widget.h);
          
          // Force apply snapped pixels immediately to DOM to avoid 'willkürlich' placement
          if (el) {
            const snappedPx = opts.colRowToPixel(snap.col, snap.row);
            el.style.left = snappedPx.x + 'px';
            el.style.top = snappedPx.y + 'px';
          }

          opts.onMove(dragRef.current.instanceId!, snap.col, snap.row);
        }

        hideGhost();
        dragRef.current = { active: false, instanceId: null, offsetX: 0, offsetY: 0, startCol: 0, startRow: 0 };
        dragElRef.current = null;
      }

      if (resizeRef.current.active) {
        const el = dragElRef.current;
        if (el) {
          el.classList.remove('wg-resizing');
        }

        const m = opts.getMetrics();
        const scale = m.scale || 1;
        const deltaX = (e.clientX / scale) - resizeRef.current.startX;
        const deltaY = (e.clientY / scale) - resizeRef.current.startY;
        const newW = resizeRef.current.startW + Math.round(deltaX / (m.colWidth + m.gap));
        const newH = resizeRef.current.startH + Math.round(deltaY / (m.rowHeight + m.gap));

        // Force apply snapped pixels immediately to DOM for resize too
        if (el) {
          const snappedSize = opts.sizeToPixel(Math.max(1, newW), Math.max(1, newH));
          el.style.width = snappedSize.width + 'px';
          el.style.height = snappedSize.height + 'px';
        }

        opts.onResize(resizeRef.current.instanceId!, newW, newH);

        hideGhost();
        resizeRef.current = { active: false, instanceId: null, startX: 0, startY: 0, startW: 0, startH: 0 };
        dragElRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [opts, showGhost, hideGhost]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey && e.key === 'z' && editActive) {
        e.preventDefault();
        const layout = undo();
        if (layout) opts.loadLayout(layout);
      }
      if (e.ctrlKey && e.key === 'y' && editActive) {
        e.preventDefault();
        const layout = redo();
        if (layout) opts.loadLayout(layout);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editActive, undo, redo, opts]);

  return {
    editActive,
    toggleEditMode,
    ghostStyle,
    startDrag,
    startResize,
    undo,
    redo,
    pushUndo,
  };
}
