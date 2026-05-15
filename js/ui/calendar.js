/* js/ui/calendar.js - Financial Calendar Rendering */

let _currentCalendarDate = new Date();

window.renderCalendar = function() {
    const grid = document.getElementById("calendar-days-grid");
    const header = document.getElementById("calendar-month-year");
    if (!grid || !header) return;

    const year = _currentCalendarDate.getFullYear();
    const month = _currentCalendarDate.getMonth();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    header.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    grid.innerHTML = "";
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayEl.classList.add("today");
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayTrans = (typeof _allTransactions !== 'undefined') ? _allTransactions.filter(t => t.data === dateStr) : [];
        const hasEntrada = dayTrans.some(t => t.tipo === "entrada");
        const hasSaida = dayTrans.some(t => t.tipo === "saida");
        dayEl.innerHTML = `<span class="day-number">${d}</span><div class="day-indicators">${hasEntrada ? '<span class="indicator entrada"></span>' : ""}${hasSaida ? '<span class="indicator saida"></span>' : ""}</div>`;
        grid.appendChild(dayEl);
    }
};
