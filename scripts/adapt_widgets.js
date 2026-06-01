const fs = require('fs');
const path = require('path');

const widgetsDir = path.join(__dirname, '../frontend/public/widgets');
const files = fs.readdirSync(widgetsDir);

const lightModeCSS = `
        /* Automatic Light Mode styling */
        .light-mode {
            --obsidian-base: #f8fafc;
            --obsidian-surface: #ffffff;
            --text-primary: #020617;
            --text-main: #020617;
            --text-dim: #64748b;
            --text-secondary: #334155;
            --text-muted: #64748b;
            --border-subtle: rgba(139, 92, 246, 0.15);
            --surface-shine: rgba(0, 0, 0, 0.02);
            --grid-line: rgba(139, 92, 246, 0.08);
            --glow-accent: rgba(139, 92, 246, 0.05);
            --phosphor-green: #059669;
            --phosphor-red: #dc2626;
            --phosphor-glow-green: rgba(5, 150, 105, 0.1);
            --phosphor-glow-red: rgba(220, 38, 38, 0.1);
            --gloss-purple: #7c3aed;
        }
        .light-mode body {
            color: var(--text-primary) !important;
        }
        .light-mode .obsidian-display,
        .light-mode .creatix-card,
        .light-mode .card,
        .light-mode .widget-container,
        .light-mode .display-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .light-mode svg text {
            fill: var(--text-dim) !important;
        }
        .light-mode .timeframe {
            color: var(--text-muted) !important;
        }
        .light-mode .label {
            color: var(--gloss-purple) !important;
        }
        .light-mode .stat-value.purple {
            color: var(--gloss-purple) !important;
        }
`;

files.forEach(file => {
    if (!file.endsWith('.html')) return;
    const filePath = path.join(widgetsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Map text colors
    content = content.replace(/color:\s*#ffffff;/g, 'color: var(--text-primary, #ffffff);');
    content = content.replace(/color:\s*#fff;/g, 'color: var(--text-primary, #ffffff);');
    content = content.replace(/color:\s*var\(--text-main\);/g, 'color: var(--text-primary, var(--text-main));');
    
    // Make backgrounds and borders transparent
    content = content.replace(/background:\s*linear-gradient\([^)]+\);/g, 'background: transparent !important;');
    content = content.replace(/background-color:\s*var\(--obsidian-base\);/g, 'background-color: transparent !important;');
    content = content.replace(/background-color:\s*#0d0d0f;/g, 'background-color: transparent !important;');
    content = content.replace(/border:\s*1px\s*solid\s*[^;]+;/g, 'border: none !important;');
    content = content.replace(/box-shadow:\s*[^;]+;/g, 'box-shadow: none !important;');

    // Insert Light Mode CSS
    if (!content.includes('Automatic Light Mode styling')) {
        const styleTag = '</style>';
        const index = content.indexOf(styleTag);
        if (index !== -1) {
            content = content.slice(0, index) + lightModeCSS + content.slice(index);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});

console.log('Successfully completed widget adaptation script execution!');
