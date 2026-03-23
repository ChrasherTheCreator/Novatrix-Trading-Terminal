/* ============================================================
   APP.JS – Main Application Controller
   Initializes all modules, wires up event listeners
   ============================================================ */

(function () {
    'use strict';

    let gridEngine, editMode;
    const gridContainer = document.getElementById('gridContainer');
    const ghostEl = document.getElementById('gridGhost');

    /* --- Toast Notifications --- */
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✓', error: '✗', info: 'ℹ' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toast-out 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /* --- Create Widget DOM Element --- */
    function createWidgetElement(widgetId, instanceId) {
        const def = getWidgetDef(widgetId);
        if (!def) return null;

        const card = document.createElement('div');
        card.className = 'widget-card';
        card.dataset.widgetId = widgetId;

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'widget-drag-handle';
        dragHandle.innerHTML = `<div class="drag-dots"><span></span><span></span><span></span><span></span><span></span><span></span></div>`;
        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const instId = card.dataset.instanceId;
            if (instId) editMode.startDrag(instId, e.clientX, e.clientY);
        });
        card.appendChild(dragHandle);

        // Widget actions (settings + delete)
        const actions = document.createElement('div');
        actions.className = 'widget-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'widget-action-btn delete';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Remove widget';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const instId = card.dataset.instanceId;
            if (instId) {
                gridEngine.removeWidget(instId);
                showToast(`${def.name} removed`, 'info');
            }
        });
        actions.appendChild(deleteBtn);
        card.appendChild(actions);

        // Iframe content
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'widget-content';
        const iframe = document.createElement('iframe');
        iframe.src = def.src;
        iframe.title = def.name;
        iframe.loading = 'lazy';
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

        // Style the iframe body when loaded
        iframe.addEventListener('load', () => {
            try {
                const doc = iframe.contentDocument;
                if (doc) {
                    // BEFORE injecting overrides, measure the widget's native size from the script!
                    let nativeWidth = 0;
                    let nativeHeight = 0;
                    const innerCard = doc.body.children[0] || doc.body;
                    if (innerCard !== doc.body) {
                        const rect = innerCard.getBoundingClientRect();
                        nativeWidth = Math.ceil(rect.width);
                        nativeHeight = Math.ceil(rect.height);
                        
                        card.dataset.fixedSize = 'true';
                        card.dataset.nativeWidth = nativeWidth;
                        card.dataset.nativeHeight = nativeHeight;
                        
                        // Apply exact native dimensions to the wrapping container
                        card.style.width = nativeWidth + 'px';
                        card.style.height = nativeHeight + 'px';
                    }

                    const style = doc.createElement('style');
                    style.textContent = `
                        html, body {
                            background: transparent !important;
                            min-height: 0 !important;
                            overflow: hidden !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        /* We entirely remove the scaling CSS so Widgets render at their EXACT pre-defined native pixels */
                        .widget-orb { display: none !important; }
                        body::before, body::after { display: none !important; }
                    `;
                    doc.head.appendChild(style);
                    
                    if (nativeWidth > 0 && gridEngine) {
                        const instId = card.dataset.instanceId;
                        if (instId) gridEngine._positionElement(instId);
                    }
                }
            } catch (e) {
                // Cross-origin or security error - silently ignore
            }
        });

        contentWrapper.appendChild(iframe);
        card.appendChild(contentWrapper);

        // Resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'widget-resize-handle';
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const instId = card.dataset.instanceId;
            if (instId) editMode.startResize(instId, e.clientX, e.clientY);
        });
        card.appendChild(resizeHandle);

        return card;
    }

    /* --- Load Layout into Grid --- */
    function loadLayout(layout) {
        // Clear existing
        gridEngine.getAllWidgets().forEach((w, id) => gridEngine.removeWidget(id));

        for (const item of layout) {
            const el = createWidgetElement(item.widgetId);
            if (!el) continue;
            
            // Defend against outdated local layouts that violate new minimum widths
            let w = item.w;
            let h = item.h;
            const def = getWidgetDef(item.widgetId);
            if (def) {
                w = Math.max(def.minW || 1, Math.min(w, def.maxW || 12));
                h = Math.max(def.minH || 1, Math.min(h, def.maxH || 12));
            }
            
            gridContainer.appendChild(el);
            gridEngine.addWidget(item.widgetId, item.col, item.row, w, h, el);
        }
    }

    /* --- Undo/Redo Handlers --- */
    function handleUndo() {
        const layout = editMode.undo();
        if (layout) {
            loadLayout(layout);
            showToast('Undo', 'info');
        }
    }

    function handleRedo() {
        const layout = editMode.redo();
        if (layout) {
            loadLayout(layout);
            showToast('Redo', 'info');
        }
    }

    /* --- Widget Library Drawer --- */
    function openLibrary() {
        document.getElementById('libraryOverlay').classList.add('open');
        document.getElementById('libraryDrawer').classList.add('open');
    }

    function closeLibrary() {
        document.getElementById('libraryOverlay').classList.remove('open');
        document.getElementById('libraryDrawer').classList.remove('open');
    }

    function populateLibrary() {
        const list = document.getElementById('libraryList');
        list.innerHTML = '';

        WIDGET_REGISTRY.forEach(def => {
            const item = document.createElement('div');
            item.className = 'library-item';
            item.innerHTML = `
                <div class="library-item-preview">
                    <iframe src="${def.src}" loading="lazy" scrolling="no" sandbox="allow-scripts allow-same-origin" tabindex="-1"></iframe>
                </div>
                <div class="library-item-info">
                    <div class="library-item-name">${def.name}</div>
                    <div class="library-item-meta">${def.category} · ${def.defaultW}×${def.defaultH}</div>
                </div>
                <button class="library-item-add" title="Add to dashboard">+</button>
            `;

            item.querySelector('.library-item-add').addEventListener('click', (e) => {
                e.stopPropagation();
                addWidgetFromLibrary(def.id);
            });

            list.appendChild(item);
        });
    }

    function addWidgetFromLibrary(widgetId) {
        const def = getWidgetDef(widgetId);
        if (!def) return;

        const el = createWidgetElement(widgetId);
        if (!el) return;

        gridContainer.appendChild(el);
        const pos = gridEngine.findNextAvailablePosition(def.defaultW, def.defaultH);
        gridEngine.addWidget(widgetId, pos.col, pos.row, def.defaultW, def.defaultH, el);

        showToast(`${def.name} added`, 'success');
        closeLibrary();

        // Ensure edit mode is on
        if (!editMode.isActive()) {
            editMode.toggle();
            updateEditButton();
        }

        // Scroll to the new widget
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* Library search filter */
    function setupLibrarySearch() {
        const input = document.getElementById('librarySearchInput');
        input.addEventListener('input', () => {
            const q = input.value.toLowerCase();
            const items = document.querySelectorAll('.library-item');
            items.forEach(item => {
                const name = item.querySelector('.library-item-name').textContent.toLowerCase();
                const meta = item.querySelector('.library-item-meta').textContent.toLowerCase();
                item.style.display = (name.includes(q) || meta.includes(q)) ? '' : 'none';
            });
        });
    }

    /* --- Button Handlers --- */
    function updateEditButton() {
        const btn = document.getElementById('btnCustomize');
        const label = btn.querySelector('.btn-label');
        if (editMode.isActive()) {
            label.textContent = 'Done Editing';
            btn.classList.add('btn-primary');
        } else {
            label.textContent = 'Customize';
            btn.classList.remove('btn-primary');
        }
    }

    /* --- Initialize --- */
    function init() {
        gridEngine = new GridEngine(gridContainer);
        editMode = new EditMode(gridEngine, gridContainer, ghostEl);

        editMode.setUndoHandler(handleUndo);
        editMode.setRedoHandler(handleRedo);

        // Load saved layout or default
        const savedLayout = Persistence.load();
        const layout = savedLayout || DEFAULT_LAYOUT;
        loadLayout(layout);

        // Populate library
        populateLibrary();
        setupLibrarySearch();

        // --- Wire up buttons ---
        document.getElementById('btnCustomize').addEventListener('click', () => {
            editMode.toggle();
            updateEditButton();
        });

        document.getElementById('btnSave').addEventListener('click', () => {
            const layout = gridEngine.getLayoutSnapshot();
            if (Persistence.save(layout)) {
                showToast('Layout saved successfully', 'success');
            } else {
                showToast('Failed to save layout', 'error');
            }
        });

        document.getElementById('btnAddWidget').addEventListener('click', openLibrary);

        document.getElementById('btnUndo').addEventListener('click', handleUndo);
        document.getElementById('btnRedo').addEventListener('click', handleRedo);

        document.getElementById('btnExport').addEventListener('click', () => {
            const layout = gridEngine.getLayoutSnapshot();
            Persistence.exportJSON(layout);
            showToast('Layout exported as JSON', 'success');
        });

        document.getElementById('btnImport').addEventListener('click', async () => {
            try {
                const layout = await Persistence.importJSON();
                loadLayout(layout);
                showToast('Layout imported successfully', 'success');
            } catch (err) {
                showToast('Import failed: ' + err, 'error');
            }
        });

        document.getElementById('btnResetLayout').addEventListener('click', () => {
            if (confirm('Reset to default layout? This will discard all changes.')) {
                Persistence.clear();
                loadLayout(DEFAULT_LAYOUT);
                showToast('Layout reset to default', 'info');
            }
        });

        // Library drawer
        document.getElementById('libraryClose').addEventListener('click', closeLibrary);
        document.getElementById('libraryOverlay').addEventListener('click', closeLibrary);

        // Recalculate grid on window resize
        window.addEventListener('resize', () => {
            gridEngine._updateMetrics();
        });

        console.log('Novatrix Dashboard initialized with', layout.length, 'widgets');
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
