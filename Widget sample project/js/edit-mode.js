/* ============================================================
   EDIT MODE – Drag, Resize, Undo/Redo, Widget Settings
   ============================================================ */

class EditMode {
    constructor(gridEngine, gridContainer, ghostEl) {
        this.engine = gridEngine;
        this.container = gridContainer;
        this.ghost = ghostEl;
        this.active = false;

        // Drag state
        this._dragging = false;
        this._dragInstanceId = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._dragStartCol = 0;
        this._dragStartRow = 0;

        // Resize state
        this._resizing = false;
        this._resizeInstanceId = null;
        this._resizeStartX = 0;
        this._resizeStartY = 0;
        this._resizeStartW = 0;
        this._resizeStartH = 0;

        // Undo/Redo
        this._undoStack = [];
        this._redoStack = [];
        this._maxHistory = 50;

        // Bind handlers
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);

        document.addEventListener('keydown', this._onKeyDown);
    }

    /* --- Toggle Edit Mode --- */
    toggle() {
        this.active = !this.active;
        document.body.classList.toggle('edit-mode', this.active);
        if (this.active) {
            this._pushUndo();
        }
        return this.active;
    }

    isActive() { return this.active; }

    enable() {
        if (!this.active) this.toggle();
    }

    disable() {
        if (this.active) this.toggle();
        this._hideGhost();
    }

    /* --- Drag Start (called from widget header mousedown) --- */
    startDrag(instanceId, mouseX, mouseY) {
        if (!this.active) return;

        const widget = this.engine.getWidget(instanceId);
        if (!widget) return;

        this._pushUndo();

        this._dragging = true;
        this._dragInstanceId = instanceId;
        this._dragStartCol = widget.col;
        this._dragStartRow = widget.row;

        const rect = widget.el.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        this._dragOffsetX = mouseX - rect.left;
        this._dragOffsetY = mouseY - rect.top;

        widget.el.classList.add('dragging');
        widget.el.classList.add('no-transition');

        // Show ghost at current position
        this._showGhost(widget.col, widget.row, widget.w, widget.h, instanceId);

        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        document.body.classList.add('no-select');
    }

    /* --- Resize Start (called from resize handle mousedown) --- */
    startResize(instanceId, mouseX, mouseY) {
        if (!this.active) return;

        const widget = this.engine.getWidget(instanceId);
        if (!widget) return;

        this._pushUndo();

        this._resizing = true;
        this._resizeInstanceId = instanceId;
        this._resizeStartX = mouseX;
        this._resizeStartY = mouseY;
        this._resizeStartW = widget.w;
        this._resizeStartH = widget.h;

        widget.el.classList.add('resizing');

        // Show ghost at current size
        this._showGhost(widget.col, widget.row, widget.w, widget.h, instanceId);

        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        document.body.classList.add('no-select');
    }

    /* --- Mouse Move Handler --- */
    _onMouseMove(e) {
        if (this._dragging) {
            this._handleDragMove(e);
        } else if (this._resizing) {
            this._handleResizeMove(e);
        }
    }

    _handleDragMove(e) {
        const widget = this.engine.getWidget(this._dragInstanceId);
        if (!widget) return;

        const containerRect = this.container.getBoundingClientRect();
        const x = e.clientX - containerRect.left - this._dragOffsetX;
        const y = e.clientY - containerRect.top - this._dragOffsetY + this.container.scrollTop;

        // Move the actual element freely (not snapped)
        widget.el.style.left = (e.clientX - containerRect.left - this._dragOffsetX) + 'px';
        widget.el.style.top = (e.clientY - containerRect.top - this._dragOffsetY + window.scrollY - containerRect.top - window.scrollY + containerRect.top) + 'px';

        // Calculate scroll-adjusted position
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const absY = e.clientY + scrollY - containerRect.top - scrollY + containerRect.top;
        const relY = e.clientY - containerRect.top + (this.container.parentElement ? window.scrollY : 0);

        widget.el.style.left = (e.clientX - containerRect.left - this._dragOffsetX) + 'px';
        widget.el.style.top = (e.clientY + window.scrollY - containerRect.top - window.scrollY - this._dragOffsetY + window.scrollY) + 'px';

        // Simplified: get position relative to container for both the element AND the snap
        const posX = e.clientX - containerRect.left - this._dragOffsetX;
        const posY = e.clientY - containerRect.top + window.scrollY - this._dragOffsetY;

        widget.el.style.left = posX + 'px';
        widget.el.style.top = posY + 'px';

        // Snap ghost
        const snap = this.engine.snapToGrid(posX, posY, widget.w, widget.h);
        this._showGhost(snap.col, snap.row, widget.w, widget.h, this._dragInstanceId);
    }

    _handleResizeMove(e) {
        const widget = this.engine.getWidget(this._resizeInstanceId);
        if (!widget) return;

        const colW = this.engine.getColWidth();
        const rowH = this.engine.getRowHeight();
        const gap = this.engine.getGap();

        const deltaX = e.clientX - this._resizeStartX;
        const deltaY = e.clientY - this._resizeStartY;

        // Calculate new size in grid units
        const cellW = colW + gap;
        const cellH = rowH + gap;
        let newW = this._resizeStartW + Math.round(deltaX / cellW);
        let newH = this._resizeStartH + Math.round(deltaY / cellH);

        // Clamp to min/max
        const def = getWidgetDef(widget.widgetId);
        if (def) {
            newW = Math.max(def.minW, Math.min(newW, def.maxW, this.engine.getColumns() - widget.col));
            newH = Math.max(def.minH, Math.min(newH, def.maxH));
        } else {
            newW = Math.max(1, Math.min(newW, this.engine.getColumns() - widget.col));
            newH = Math.max(1, newH);
        }

        // Update ghost
        this._showGhost(widget.col, widget.row, newW, newH, this._resizeInstanceId);

        // Live preview: resize the element
        const size = this.engine.sizeToPixel(newW, newH);
        widget.el.style.width = size.width + 'px';
        widget.el.style.height = size.height + 'px';
    }

    /* --- Mouse Up Handler --- */
    _onMouseUp(e) {
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.body.classList.remove('no-select');

        if (this._dragging) {
            this._finishDrag(e);
        } else if (this._resizing) {
            this._finishResize(e);
        }
    }

    _finishDrag(e) {
        const widget = this.engine.getWidget(this._dragInstanceId);
        if (!widget) return;

        widget.el.classList.remove('dragging');
        widget.el.classList.remove('no-transition');

        const containerRect = this.container.getBoundingClientRect();
        const posX = e.clientX - containerRect.left - this._dragOffsetX;
        const posY = e.clientY - containerRect.top + window.scrollY - this._dragOffsetY;

        const snap = this.engine.snapToGrid(posX, posY, widget.w, widget.h);
        this.engine.moveWidget(this._dragInstanceId, snap.col, snap.row);

        this._hideGhost();
        this._dragging = false;
        this._dragInstanceId = null;
    }

    _finishResize(e) {
        const widget = this.engine.getWidget(this._resizeInstanceId);
        if (!widget) return;

        widget.el.classList.remove('resizing');

        const colW = this.engine.getColWidth();
        const rowH = this.engine.getRowHeight();
        const gap = this.engine.getGap();

        const deltaX = e.clientX - this._resizeStartX;
        const deltaY = e.clientY - this._resizeStartY;

        let newW = this._resizeStartW + Math.round(deltaX / (colW + gap));
        let newH = this._resizeStartH + Math.round(deltaY / (rowH + gap));

        this.engine.resizeWidget(this._resizeInstanceId, newW, newH);

        this._hideGhost();
        this._resizing = false;
        this._resizeInstanceId = null;
    }

    /* --- Ghost Element --- */
    _showGhost(col, row, w, h, instanceId) {
        const pos = this.engine.colRowToPixel(col, row);
        let size = this.engine.sizeToPixel(w, h);

        if (instanceId) {
            const widget = this.engine.getWidget(instanceId);
            if (widget && widget.el && widget.el.dataset.fixedSize === 'true') {
                if (this._dragging) {
                    size.width = parseFloat(widget.el.dataset.nativeWidth) || size.width;
                    size.height = parseFloat(widget.el.dataset.nativeHeight) || size.height;
                }
            }
        }

        this.ghost.style.left = pos.x + 'px';
        this.ghost.style.top = pos.y + 'px';
        this.ghost.style.width = size.width + 'px';
        this.ghost.style.height = size.height + 'px';
        this.ghost.classList.add('visible');
    }

    _hideGhost() {
        this.ghost.classList.remove('visible');
    }

    /* --- Undo / Redo --- */
    _pushUndo() {
        const snapshot = this.engine.getLayoutSnapshot();
        this._undoStack.push(snapshot);
        if (this._undoStack.length > this._maxHistory) {
            this._undoStack.shift();
        }
        this._redoStack = [];
    }

    undo() {
        if (this._undoStack.length <= 1) return null;
        const current = this.engine.getLayoutSnapshot();
        this._redoStack.push(current);
        this._undoStack.pop(); // Remove current state
        const previous = this._undoStack[this._undoStack.length - 1];
        return previous;
    }

    redo() {
        if (this._redoStack.length === 0) return null;
        const next = this._redoStack.pop();
        this._undoStack.push(next);
        return next;
    }

    /* --- Keyboard Shortcuts --- */
    _onKeyDown(e) {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            if (this.active && typeof this._onUndo === 'function') {
                this._onUndo();
            }
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            if (this.active && typeof this._onRedo === 'function') {
                this._onRedo();
            }
        }
        if (e.key === 'Escape' && this.active) {
            if (this._dragging || this._resizing) {
                // Cancel current operation
                document.removeEventListener('mousemove', this._onMouseMove);
                document.removeEventListener('mouseup', this._onMouseUp);
                this._hideGhost();
                if (this._dragging) {
                    const w = this.engine.getWidget(this._dragInstanceId);
                    if (w) {
                        w.el.classList.remove('dragging', 'no-transition');
                        this.engine.moveWidget(this._dragInstanceId, this._dragStartCol, this._dragStartRow);
                    }
                    this._dragging = false;
                }
                if (this._resizing) {
                    const w = this.engine.getWidget(this._resizeInstanceId);
                    if (w) w.el.classList.remove('resizing');
                    this.engine.resizeWidget(this._resizeInstanceId, this._resizeStartW, this._resizeStartH);
                    this._resizing = false;
                }
                document.body.classList.remove('no-select');
            }
        }
    }

    setUndoHandler(fn) { this._onUndo = fn; }
    setRedoHandler(fn) { this._onRedo = fn; }
}
