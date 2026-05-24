const fs = require('fs');

let content = fs.readFileSync('js/account-reset.js', 'utf16le');
if (!content.includes('initResetUI')) {
    content = fs.readFileSync('js/account-reset.js', 'utf8');
    if (content.includes('\ufffd')) {
        content = fs.readFileSync('js/account-reset.js', 'latin1');
    }
}

content = content.replace(/modal\.style\.display\s*=\s*'flex';/g, "if (typeof window.openModal === 'function') { window.openModal('modal-factory-reset'); } else { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('active'), 10); }");

fs.writeFileSync('js/account-reset.js', content, 'utf8');
console.log('Fixed js/account-reset.js modal open logic');
