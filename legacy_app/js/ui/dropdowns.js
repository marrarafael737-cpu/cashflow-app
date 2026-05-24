/* js/ui/dropdowns.js - Dropdown & Select Management */

window.setupDynamicDropdowns = function() {
    const catSelect = document.getElementById('categoria');
    const subSelect = document.getElementById('subcategoria');
    const typeSelect = document.getElementById('tipo');

    if (catSelect && subSelect) {
        catSelect.addEventListener('change', () => {
            const catId = catSelect.value;
            const subs = (typeof _subcategories !== 'undefined') ? _subcategories.filter(s => s.categoria_id === catId) : [];
            
            subSelect.innerHTML = '<option value="">Opcional...</option>' + 
                subs.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => window.updateCategoryDropdown(typeSelect.value));
    }

    const dashTypeSelect = document.getElementById('dash-tipo');
    if (dashTypeSelect) {
        dashTypeSelect.addEventListener('change', () => window.updateCategoryDropdown(dashTypeSelect.value));
    }
};

window.updateCategoryDropdown = function(type = 'saida') {
    const catSelects = [
        document.getElementById('categoria'),
        document.getElementById('dash-categoria'),
        document.getElementById('budget-category')
    ];
    
    if (typeof _categories === 'undefined' || !_categories) return;
    
    const filtered = _categories.filter(c => c.tipo === type);
    const optionsHtml = '<option value="">Selecione...</option>' + 
        filtered.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    catSelects.forEach(sel => { if (sel) sel.innerHTML = optionsHtml; });
};

window.updateAccountDropdown = function() {
    const accountSelects = [
        document.getElementById('conta'),
        document.getElementById('dash-conta')
    ];
    
    if (typeof _contas === 'undefined' || !_contas) return;

    const optionsHtml = '<option value="">Selecione...</option>' + 
        _contas.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    accountSelects.forEach(sel => { if (sel) sel.innerHTML = optionsHtml; });
};
