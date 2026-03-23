/* ============================================================
   PERSISTENCE – Save/Load/Export/Import Layouts
   ============================================================ */

const STORAGE_KEY = 'novatrix-dashboard-layout';

const Persistence = {
    save(layout) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
            return true;
        } catch (e) {
            console.error('Failed to save layout:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load layout:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    exportJSON(layout) {
        const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `novatrix-layout-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importJSON() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) { reject('No file selected'); return; }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const layout = JSON.parse(ev.target.result);
                        if (Array.isArray(layout)) {
                            resolve(layout);
                        } else {
                            reject('Invalid layout format');
                        }
                    } catch (err) {
                        reject('Failed to parse JSON: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }
};
