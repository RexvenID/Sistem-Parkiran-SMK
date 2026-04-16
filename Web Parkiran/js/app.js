function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(dateString) {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function getToday() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getWeekRange() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { start: startOfWeek.toISOString().split('T')[0], end: endOfWeek.toISOString().split('T')[0] };
}

function calculateDuration(entryTime, exitTime) {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit - entry;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    return Math.max(1, hours);
}

function getDurationText(entryTime, exitTime) {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit - entry;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
}

function loadDashboardStats() {
    const config = storage.getConfig();
    const transactions = storage.getTransactions();
    
    const activeTransactions = transactions.filter(t => t.status === 'active');
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    
    const totalCapacity = config.capacity.motor + config.capacity.mobil + config.capacity.truk;
    const totalOccupied = activeTransactions.length;
    const totalAvailable = totalCapacity - totalOccupied;
    
    const today = getToday();
    const todayTransactions = completedTransactions.filter(t => 
        t.created_at.startsWith(today)
    );
    const todayIncome = todayTransactions.reduce((sum, t) => sum + t.fee, 0);
    
    const weekRange = getWeekRange();
    const weekTransactions = completedTransactions.filter(t => {
        const date = t.created_at.split('T')[0];
        return date >= weekRange.start && date <= weekRange.end;
    });
    const weekIncome = weekTransactions.reduce((sum, t) => sum + t.fee, 0);
    
    const motorOccupied = activeTransactions.filter(t => t.vehicle_type === 'motor').length;
    const mobilOccupied = activeTransactions.filter(t => t.vehicle_type === 'mobil').length;
    const trukOccupied = activeTransactions.filter(t => t.vehicle_type === 'truk').length;
    
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    
    document.getElementById('stat-total-parked').textContent = totalOccupied;
    document.getElementById('stat-available').textContent = totalAvailable;
    document.getElementById('stat-today-income').textContent = formatCurrency(todayIncome);
    document.getElementById('stat-today-transactions').textContent = todayTransactions.length;
    document.getElementById('motor-status').textContent = `${motorOccupied}/${config.capacity.motor}`;
    document.getElementById('mobil-status').textContent = `${mobilOccupied}/${config.capacity.mobil}`;
    document.getElementById('truk-status').textContent = `${trukOccupied}/${config.capacity.truk}`;
    document.getElementById('stat-total-transactions').textContent = transactions.length;
    document.getElementById('stat-week-income').textContent = formatCurrency(weekIncome);
    document.getElementById('stat-occupancy-rate').textContent = occupancyRate + '%';
    document.getElementById('stat-total-visitors').textContent = completedTransactions.length;
    
    loadRecentTransactions();
}

function loadRecentTransactions() {
    const transactions = storage.getTransactions();
    const activeTransactions = transactions
        .filter(t => t.status === 'active')
        .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
        .slice(0, 5);
    
    const tbody = document.getElementById('recent-transactions');
    if (!tbody) return;
    
    if (activeTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--gray-500);">Tidak ada kendaraan di dalam</td></tr>';
        return;
    }
    
    tbody.innerHTML = activeTransactions.map(t => `
        <tr>
            <td><strong>${t.vehicle_plate}</strong></td>
            <td><span class="badge badge-primary">${t.vehicle_type}</span></td>
            <td>${formatTime(t.entry_time)}</td>
            <td><span class="badge badge-warning">Aktif</span></td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.requireAuth()) return;
    initAuth();
    
    if (document.getElementById('dashboard-page') || document.querySelector('.stat-card')) {
        updateTime();
        setInterval(updateTime, 60000);
        loadDashboardStats();
        setInterval(loadDashboardStats, 5000);
    }
});
