const fs = require('fs');

let content = fs.readFileSync('dashboard.html', 'utf16le');
if (!content.includes('btn-open-factory-reset')) {
    content = fs.readFileSync('dashboard.html', 'utf8');
    if (content.includes('\ufffd')) {
        content = fs.readFileSync('dashboard.html', 'latin1');
    }
}

// Add onclick fallback
content = content.replace(/<button id="btn-open-factory-reset" class="btn-danger"/g, `<button id="btn-open-factory-reset" class="btn-danger" onclick="if(window.openModal) window.openModal('modal-factory-reset'); else document.getElementById('modal-factory-reset').style.display='flex'; goToResetStep(1);"`);

fs.writeFileSync('dashboard.html', content, 'utf8');
console.log('Added onclick fallback to dashboard.html');
