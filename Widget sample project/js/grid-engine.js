/* ============================================================
   GRID ENGINE – Core grid positioning, collision, & compaction
   ============================================================ */

class GridEngine {
    constructor(containerEl) {
        this.container = containerEl;
        this.columns = 12;
        this.rowHeight = 80;
        this.gap = 16;
        this.padding = 24;
        this.widgets = new Map(); // instanceId → {widgetId, col, row, w, h, el}
        this._nextId = 1;

        this._updateMetrics();
        window.addEventListener('resize', () => this._updateMetrics());
    }

    /* --- Metrics --- */
    _updateMetrics() {
        const style = getComputedStyle(document.documentElement);
        this.columns = parseInt(style.getPropertyValue('--grid-columns')) || 12;
        this.gap = parseInt(style.getPropertyValue('--grid-gap')) || 16;
        
        // Original Metrics (Phase 7 Baseline)
        this.colWidth = 117;
        this.rowHeight = 72;

        const containerW = this.container.clientWidth;
        const totalGridWidth = (this.columns * this.colWidth) + ((this.columns - 1) * this.gap);
        this.padding = Math.max(24, Math.floor((containerW - totalGridWidth) / 2));

        // Re-position all widgets
        this.widgets.forEach((w, id) => this._positionElement(id));
        this._updateContainerHeight();
    }

    getColWidth() { return this.colWidth; }
    getRowHeight() { return this.rowHeight; }
    getGap() { return this.gap; }
    getPadding() { return this.padding; }
    getColumns() { return this.columns; }

    /* --- Coordinate Translation --- */
    colRowToPixel(col, row) {
        return {
            x: this.padding + col * (this.colWidth + this.gap),
            y: row * (this.rowHeight + this.gap)
        };
    }

    sizeToPixel(w, h) {
        return {
            width: w * this.colWidth + (w - 1) * this.gap,
            height: h * this.rowHeight + (h - 1) * this.gap
        };
    }

    pixelToColRow(x, y) {
        const col = Math.round((x - this.padding) / (this.colWidth + this.gap));
        const row = Math.round(y / (this.rowHeight + this.gap));
        return {
            col: Math.max(0, Math.min(col, this.columns - 1)),
            row: Math.max(0, row)
        };
    }

    /* Snap arbitrary pixel position to nearest grid cell for a widget of size w×h */
    snapToGrid(x, y, w, h) {
        let col = Math.round((x - this.padding) / (this.colWidth + this.gap));
        let row = Math.round(y / (this.rowHeight + this.gap));
        col = Math.max(0, Math.min(col, this.columns - w));
        row = Math.max(0, row);
        return { col, row };
    }

    /* --- Widget Management --- */
    addWidget(widgetId, col, row, w, h, el) {
        const instanceId = 'inst_' + (this._nextId++);
        // Clamp to grid bounds
        col = Math.max(0, Math.min(col, this.columns - w));
        row = Math.max(0, row);

        this.widgets.set(instanceId, { widgetId, col, row, w, h, el });
        el.dataset.instanceId = instanceId;
        this._positionElement(instanceId);
        this._updateContainerHeight();
        return instanceId;
    }

    removeWidget(instanceId) {
        const w = this.widgets.get(instanceId);
        if (w) {
            if (w.el && w.el.parentNode) w.el.parentNode.removeChild(w.el);
            this.widgets.delete(instanceId);
            this.compact();
            this._updateContainerHeight();
        }
    }

    getWidget(instanceId) {
        return this.widgets.get(instanceId);
    }

    getAllWidgets() {
        return new Map(this.widgets);
    }

    /* --- Positioning --- */
    _positionElement(instanceId) {
        const w = this.widgets.get(instanceId);
        if (!w || !w.el) return;

        const cellWidth = this.colWidth;
        const cellHeight = this.rowHeight;

        // Ensure grid limits never squash native widget sizes measured accurately by the iframe parser
        const nativeW = parseFloat(w.el.dataset.nativeWidth) || 0;
        const nativeH = parseFloat(w.el.dataset.nativeHeight) || 0;

        let currentAllocatedW = w.w * cellWidth + (w.w - 1) * this.gap;
        let currentAllocatedH = w.h * cellHeight + (w.h - 1) * this.gap;

        let dimensionChanged = false;

        // Only allow native DOM dimensions to forcibly expand the logical Grid footprint if the widget is meant to be scale-responsive.
        // Fixed-size widgets (like 2x2 KPIs) must strictly obey their assigned logical slots to prevent invisible 1-pixel bleed collisions.
        if (w.el.dataset.fixedSize !== 'true') {
            // Use 2px tolerance to absorb browser subpixel rendering quirks
            if (nativeW > 0 && currentAllocatedW < nativeW - 2) {
                w.w = Math.ceil((nativeW + this.gap) / (cellWidth + this.gap));
                currentAllocatedW = w.w * cellWidth + (w.w - 1) * this.gap;
                dimensionChanged = true;
            }
            if (nativeH > 0 && currentAllocatedH < nativeH - 2) {
                w.h = Math.ceil((nativeH + this.gap) / (cellHeight + this.gap));
                currentAllocatedH = w.h * cellHeight + (w.h - 1) * this.gap;
                dimensionChanged = true;
            }
        }
        
        // If a widget auto-expanded, push downstream widgets out of the way
        if (dimensionChanged) {
            this._resolveCollisions(instanceId);
            this.compact();
            this._updateContainerHeight();
        }

        const pos = this.colRowToPixel(w.col, w.row);

        // Position exactly at grid coords, but do NOT artificially stretch fixed-size widgets
        w.el.style.left = pos.x + 'px';
        w.el.style.top = pos.y + 'px';
        if (w.el.dataset.fixedSize !== 'true') {
            w.el.style.width = currentAllocatedW + 'px';
            w.el.style.height = currentAllocatedH + 'px';
        }
    }

    _updateContainerHeight() {
        let maxBottom = 0;
        this.widgets.forEach(w => {
            const bottom = (w.row + w.h) * (this.rowHeight + this.gap);
            if (bottom > maxBottom) maxBottom = bottom;
        });
        this.container.style.minHeight = (maxBottom + this.padding * 2) + 'px';
    }

    /* --- Move Widget (with collision resolution) --- */
    moveWidget(instanceId, newCol, newRow) {
        const widget = this.widgets.get(instanceId);
        if (!widget) return;

        // Clamp
        newCol = Math.max(0, Math.min(newCol, this.columns - widget.w));
        newRow = Math.max(0, newRow);

        widget.col = newCol;
        widget.row = newRow;

        // Resolve collisions (push down)
        this._resolveCollisions(instanceId);
        this.compact();

        // Re-position all
        this.widgets.forEach((w, id) => this._positionElement(id));
        this._updateContainerHeight();
    }

    /* --- Resize Widget --- */
    resizeWidget(instanceId, newW, newH) {
        const widget = this.widgets.get(instanceId);
        if (!widget) return;

        const def = getWidgetDef(widget.widgetId);
        if (def) {
            newW = Math.max(def.minW, Math.min(newW, def.maxW, this.columns - widget.col));
            newH = Math.max(def.minH, Math.min(newH, def.maxH));
        } else {
            newW = Math.max(1, Math.min(newW, this.columns - widget.col));
            newH = Math.max(1, newH);
        }

        widget.w = newW;
        widget.h = newH;

        this._resolveCollisions(instanceId);
        this.compact();

        this.widgets.forEach((w, id) => this._positionElement(id));
        this._updateContainerHeight();
    }

    /* --- Collision Detection & Resolution --- */
    _collides(a, b) {
        return !(
            a.col + a.w <= b.col ||
            b.col + b.w <= a.col ||
            a.row + a.h <= b.row ||
            b.row + b.h <= a.row
        );
    }

    _resolveCollisions(movedId) {
        const moved = this.widgets.get(movedId);
        if (!moved) return;

        // Sort other widgets by row, then col
        const others = [];
        this.widgets.forEach((w, id) => {
            if (id !== movedId) others.push({ id, ...w });
        });
        others.sort((a, b) => a.row - b.row || a.col - b.col);

        for (const other of others) {
            const otherWidget = this.widgets.get(other.id);
            if (this._collides(moved, otherWidget)) {
                // Push down: place the colliding widget below the moved one
                otherWidget.row = moved.row + moved.h;
                // Recursively resolve for the pushed widget
                this._resolveCollisions(other.id);
            }
        }
    }

    /* --- Compaction: Remove vertical gaps --- */
    compact() {
        // Sort widgets by row, then col
        const sorted = [];
        this.widgets.forEach((w, id) => sorted.push({ id, ...w }));
        sorted.sort((a, b) => a.row - b.row || a.col - b.col);

        for (const item of sorted) {
            const widget = this.widgets.get(item.id);
            // Try to move up as far as possible
            while (widget.row > 0) {
                widget.row--;
                let collision = false;
                this.widgets.forEach((other, otherId) => {
                    if (otherId !== item.id && this._collides(widget, other)) {
                        collision = true;
                    }
                });
                if (collision) {
                    widget.row++;
                    break;
                }
            }
        }
    }

    /* --- Layout Snapshot (for undo/redo and persistence) --- */
    getLayoutSnapshot() {
        const layout = [];
        this.widgets.forEach((w, instanceId) => {
            layout.push({
                widgetId: w.widgetId,
                col: w.col,
                row: w.row,
                w: w.w,
                h: w.h
            });
        });
        return layout;
    }

    /* Check if a position is valid (within bounds, no overlaps) */
    canPlace(col, row, w, h, excludeId) {
        if (col < 0 || col + w > this.columns || row < 0) return false;
        let valid = true;
        this.widgets.forEach((other, id) => {
            if (id === excludeId) return;
            const testRect = { col, row, w, h };
            if (this._collides(testRect, other)) valid = false;
        });
        return valid;
    }

    /* Find next available row for a new widget */
    findNextAvailablePosition(w, h) {
        for (let row = 0; row < 200; row++) {
            for (let col = 0; col <= this.columns - w; col++) {
                if (this.canPlace(col, row, w, h, null)) {
                    return { col, row };
                }
            }
        }
        return { col: 0, row: 0 };
    }
}
