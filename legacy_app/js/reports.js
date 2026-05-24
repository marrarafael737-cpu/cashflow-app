/* js/reports.js - Export & Reporting Logic */

function exportToPDF() {
    try {
        // 1. Verificação robusta da biblioteca
        const jspdfLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        
        if (!jspdfLib) {
            showToast('Erro: Biblioteca PDF não encontrada. Recarregue a página.', 'error');
            return;
        }

        const doc = new jspdfLib();
        
        // Verificar se o plugin autoTable está disponível
        if (typeof doc.autoTable !== 'function') {
            showToast('Erro: Extensão de tabelas não carregada.', 'error');
            return;
        }

        const now = new Date();
        const monthYear = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        // Cabeçalho Premium
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("C.A.S.H. Unit", 20, 25);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Gestão Financeira Inteligente", 20, 32);
        doc.text(`Relatório Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 20, 39);
        
        // Dados das Transações
        if (!_allTransactions || _allTransactions.length === 0) {
            showToast('Não há transações para exportar.', 'alert');
            return;
        }

        // Resumo
        const totalEntradas = _allTransactions
            .filter(t => t.tipo === 'entrada')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            
        const totalSaidas = _allTransactions
            .filter(t => t.tipo === 'saida')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            
        const saldo = totalEntradas - totalSaidas;

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Balanço do Período", 20, 60);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Receitas: R$ ${totalEntradas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 20, 68);
        doc.text(`Despesas: R$ ${totalSaidas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 20, 74);
        doc.text(`Resultado: R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 20, 80);

        // Tabela
        const tableData = _allTransactions.map(t => {
            let dataFormatada = 'N/A';
            if (t.data) {
                const [ano, mes, dia] = t.data.split('-');
                dataFormatada = `${dia}/${mes}/${ano}`;
            }
            
            return [
                t.descricao || 'Sem descrição',
                t.categoria_nome || 'Geral',
                dataFormatada,
                t.tipo === 'entrada' ? `+ R$ ${parseFloat(t.valor).toFixed(2)}` : `- R$ ${parseFloat(t.valor).toFixed(2)}`
            ];
        });

        doc.autoTable({
            startY: 90,
            head: [['Descrição', 'Categoria', 'Data', 'Valor']],
            body: tableData,
            headStyles: { fillColor: [255, 122, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 8 },
            columnStyles: { 3: { halign: 'right' } }
        });

        doc.save(`Relatorio_CashFlow_${now.getTime()}.pdf`);
        showToast('PDF exportado!', 'success');
        if (typeof addXP === 'function') addXP(50);

    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        showToast('Erro ao gerar PDF. Verifique o console.', 'error');
    }
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Biblioteca Excel ainda carregando...', 'alert');
        return;
    }

    if (!_allTransactions || _allTransactions.length === 0) {
        showToast('Nenhum dado para exportar.', 'alert');
        return;
    }

    const sanitizeExcel = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/^([=\+\-@])/, "'$1");
    };

    const data = _allTransactions.map(t => ({
        Descrição: sanitizeExcel(t.descricao),
        Categoria: sanitizeExcel(t.categoria_nome || 'Geral'),
        Data: t.data,
        Tipo: t.tipo === 'entrada' ? 'Receita' : 'Despesa',
        Valor: parseFloat(t.valor),
        Conta: sanitizeExcel(_contas.find(c => c.id === t.conta_id)?.nome || 'N/A')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");

    // Ajustar largura das colunas
    const wscols = [
        {wch: 30}, // Descrição
        {wch: 15}, // Categoria
        {wch: 12}, // Data
        {wch: 10}, // Tipo
        {wch: 12}, // Valor
        {wch: 15}  // Conta
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `Export_CashFlow_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Arquivo Excel pronto para baixar!', 'success');
}

// Tornar global
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;

/**
 * RELATÓRIO MENSAL PREMIUM ("Instagramável" / Profissional)
 * Focado em visual de alto impacto e métricas chave.
 */
async function generatePremiumMonthlyReport() {
    try {
        const jspdfLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jspdfLib) {
            showToast('Erro: Biblioteca PDF não encontrada.', 'error');
            return;
        }

        const doc = new jspdfLib();
        const now = new Date();
        const monthYear = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
        
        // --- DESIGN SYSTEM DO RELATÓRIO ---
        const colors = {
            primary: [255, 122, 0], // Laranja CashFlow
            dark: [24, 24, 27],     // Background
            white: [255, 255, 255],
            gray: [161, 161, 170]
        };

        // Background Principal (Efeito Dark Mode)
        doc.setFillColor(...colors.dark);
        doc.rect(0, 0, 210, 297, 'F');

        // Header com Gradiente Simulado
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, 210, 60, 'F');

        // Logo e Título
        doc.setTextColor(...colors.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("FECHAMENTO", 20, 35);
        doc.setFontSize(18);
        doc.text(monthYear, 20, 48);

        // Marca d'água / App Name no canto
        doc.setFontSize(10);
        doc.text("C.A.S.H. Unit | Dashboard Premium", 140, 20);

        // --- MÉTRICAS DE IMPACTO (CARDS) ---
        const totalEntradas = _allTransactions
            .filter(t => t.tipo === 'entrada')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            
        const totalSaidas = _allTransactions
            .filter(t => t.tipo === 'saida')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);
            
        const saldo = totalEntradas - totalSaidas;
        const savingsRate = totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas * 100).toFixed(1) : 0;

        // Desenhar Cards de Resumo
        const drawCard = (x, y, w, h, title, value, color) => {
            doc.setFillColor(39, 39, 42); // Surface
            doc.roundedRect(x, y, w, h, 3, 3, 'F');
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(0.5);
            doc.line(x, y + h - 1, x + w, y + h - 1); // Bottom accent line

            doc.setTextColor(...colors.gray);
            doc.setFontSize(8);
            doc.text(title.toUpperCase(), x + 5, y + 8);
            
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(value, x + 5, y + 20);
        };

        drawCard(20, 75, 55, 30, "Receitas", `+ R$ ${totalEntradas.toLocaleString('pt-BR')}`, [0, 209, 255]);
        drawCard(80, 75, 55, 30, "Despesas", `- R$ ${totalSaidas.toLocaleString('pt-BR')}`, [239, 68, 68]);
        drawCard(140, 75, 50, 30, "Poupado", `${savingsRate}%`, [16, 185, 129]);

        // --- TOP CATEGORIAS (GRÁFICO TEXTUAL) ---
        doc.setTextColor(...colors.white);
        doc.setFontSize(14);
        doc.text("Top Gastos por Categoria", 20, 125);

        const categoryTotals = {};
        _allTransactions.filter(t => t.tipo === 'saida').forEach(t => {
            categoryTotals[t.categoria_nome] = (categoryTotals[t.categoria_nome] || 0) + parseFloat(t.valor);
        });

        const sortedCats = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        let yPos = 140;
        sortedCats.forEach(([name, val], index) => {
            const barWidth = (val / sortedCats[0][1]) * 100;
            
            doc.setTextColor(...colors.gray);
            doc.setFontSize(9);
            doc.text(`${name}`, 20, yPos);
            doc.text(`R$ ${val.toLocaleString('pt-BR')}`, 170, yPos, { align: 'right' });

            doc.setFillColor(63, 63, 70); // Track
            doc.rect(20, yPos + 3, 150, 2, 'F');
            doc.setFillColor(...colors.primary); // Bar
            doc.rect(20, yPos + 3, barWidth * 1.5, 2, 'F');

            yPos += 15;
        });

        // --- INSIGHTS DA "IA" & ORÁCULO (Cashy) ---
        doc.setFillColor(39, 39, 42);
        doc.roundedRect(20, 215, 170, 50, 5, 5, 'F');
        
        // Canto do Oráculo
        const projected = window._projectedBalance || 0;
        doc.setTextColor(...colors.primary);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("VEREDITO DO ORÁCULO", 30, 225);
        
        doc.setTextColor(...colors.white);
        doc.setFontSize(12);
        doc.text(`Projeção Final: R$ ${projected.toLocaleString('pt-BR')}`, 30, 235);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const healthScore = typeof calculateFinancialHealthScore === 'function' ? calculateFinancialHealthScore(_allTransactions).score : 75;
        const msg = projected >= 0 
            ? `Parabéns, humano! Meu motor preditivo indica que você fechará o mês com saldo POSITIVO. Seu Score de Saúde está em ${healthScore}/100. Mantenha o ritmo para acelerar suas metas!`
            : `ALERTA CRÍTICO! O Oráculo detectou um risco de saldo NEGATIVO no final do mês. Seu Score de Saúde caiu para ${healthScore}/100. Recomendo cortar gastos variáveis imediatamente!`;
        
        const splitMsg = doc.splitTextToSize(msg, 150);
        doc.text(splitMsg, 30, 245);

        // Footer
        doc.setTextColor(...colors.gray);
        doc.setFontSize(8);
        doc.text("Este é um documento gerado automaticamente por CashFlow - Tecnologia a serviço do seu patrimônio.", 105, 285, { align: 'center' });

        doc.save(`Fechamento_Premium_${now.getMonth()+1}_${now.getFullYear()}.pdf`);
        showToast('Relatório Premium gerado com sucesso!', 'success');
        if (typeof addXP === 'function') addXP(100);

    } catch (err) {
        console.error('Erro no relatório premium:', err);
        showToast('Falha ao gerar relatório premium.', 'error');
    }
}

// Exportar funções para o escopo global
window.generatePremiumMonthlyReport = generatePremiumMonthlyReport;
