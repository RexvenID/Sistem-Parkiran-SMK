class POSManager {
    constructor() {
        this.storage = storage;
        this.settings = this.storage.getSettings();
        this.selectedTransaction = null;
        this.paymentMethod = 'cash';
    }

    init() {
        this.loadActiveVehicles();
    }

    getActiveVehicles() {
        const transactions = this.storage.getTransactions();
        return transactions.filter(t => t.status === 'active');
    }

    loadActiveVehicles() {
        const vehicles = this.getActiveVehicles();
        const tbody = document.getElementById('active-vehicles');
        const emptyState = document.getElementById('empty-active');
        
        if (!tbody) return;
        
        if (vehicles.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        tbody.innerHTML = vehicles.map(v => `
            <tr>
                <td><strong>${v.vehicle_plate}</strong></td>
                <td><span class="badge badge-primary">${v.vehicle_type}</span></td>
                <td><strong>${v.slot_number}</strong></td>
                <td>${formatTime(v.entry_time)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="selectVehicle('${v.id}')">
                        Pilih
                    </button>
                </td>
            </tr>
        `).join('');
    }

    searchVehicle(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }
        
        const vehicles = this.getActiveVehicles();
        const results = vehicles.filter(v => 
            v.vehicle_plate.toLowerCase().includes(query.toLowerCase())
        );
        
        const container = document.getElementById('search-results');
        
        if (results.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 20px;">Kendaraan tidak ditemukan</p>';
            return;
        }
        
        container.innerHTML = results.map(v => `
            <div class="slot-item ${v.vehicle_type}" style="margin-bottom: 8px; padding: 12px; cursor: pointer;" onclick="selectVehicle('${v.id}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${v.vehicle_plate}</strong>
                        <span class="badge badge-primary" style="margin-left: 8px;">${v.vehicle_type}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: var(--gray-500);">Slot ${v.slot_number}</div>
                        <div style="font-size: 12px; color: var(--gray-500);">${formatTime(v.entry_time)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectVehicle(transactionId) {
        const transactions = this.storage.getTransactions();
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            showToast('Transaksi tidak ditemukan', 'error');
            return;
        }
        
        this.selectedTransaction = transaction;
        this.showVehicleInfo(transaction);
        this.showPaymentSection(transaction);
        
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('search-plate').value = transaction.vehicle_plate;
    }

    showVehicleInfo(transaction) {
        const infoSection = document.getElementById('vehicle-info');
        const duration = getDurationText(transaction.entry_time, new Date().toISOString());
        const rate = this.settings.rates[transaction.vehicle_type] || 0;
        
        document.getElementById('info-plate').textContent = transaction.vehicle_plate;
        document.getElementById('info-type').textContent = transaction.vehicle_type.charAt(0).toUpperCase() + transaction.vehicle_type.slice(1);
        document.getElementById('info-slot').textContent = transaction.slot_number;
        document.getElementById('info-entry').textContent = formatDateTime(transaction.entry_time);
        document.getElementById('info-duration').textContent = duration;
        document.getElementById('info-rate').textContent = formatCurrency(rate);
        
        infoSection.style.display = 'block';
    }

    showPaymentSection(transaction) {
        const paymentSection = document.getElementById('payment-section');
        const duration = calculateDuration(transaction.entry_time, new Date().toISOString());
        const rate = this.settings.rates[transaction.vehicle_type] || 0;
        const fee = duration * rate;
        
        document.getElementById('total-fee').textContent = formatCurrency(fee);
        document.getElementById('fee-details').textContent = `${duration} jam x ${formatCurrency(rate)}`;
        
        paymentSection.style.display = 'block';
        this.resetPayment();
    }

    selectPaymentMethod(method) {
        this.paymentMethod = method;
        
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.payment-method[data-method="${method}"]`).classList.add('active');
        
        const cashSection = document.getElementById('cash-payment');
        const qrisSection = document.getElementById('qris-display');
        
        if (method === 'cash') {
            cashSection.style.display = 'block';
            qrisSection.style.display = 'none';
        } else {
            cashSection.style.display = 'none';
            qrisSection.style.display = 'block';
        }
    }

    calculateChange() {
        if (this.paymentMethod !== 'cash' || !this.selectedTransaction) return;
        
        const amountPaid = parseInt(document.getElementById('amount-paid').value) || 0;
        const duration = calculateDuration(this.selectedTransaction.entry_time, new Date().toISOString());
        const rate = this.settings.rates[this.selectedTransaction.vehicle_type] || 0;
        const fee = duration * rate;
        
        const change = amountPaid - fee;
        const changeDisplay = document.getElementById('change-display');
        const changeAmount = document.getElementById('change-amount');
        
        if (amountPaid >= fee) {
            changeDisplay.style.display = 'block';
            changeAmount.textContent = formatCurrency(change);
        } else {
            changeDisplay.style.display = 'none';
        }
    }

    processCheckout() {
        if (!this.selectedTransaction) {
            showToast('Pilih kendaraan terlebih dahulu', 'error');
            return;
        }
        
        const amountPaid = this.paymentMethod === 'cash' 
            ? parseInt(document.getElementById('amount-paid').value) || 0 
            : 0;
        
        const duration = calculateDuration(this.selectedTransaction.entry_time, new Date().toISOString());
        const rate = this.settings.rates[this.selectedTransaction.vehicle_type] || 0;
        const fee = duration * rate;
        
        if (this.paymentMethod === 'cash' && amountPaid < fee) {
            showToast('Jumlah pembayaran kurang dari tarif', 'error');
            return;
        }
        
        const result = parkingManager.checkOut(this.selectedTransaction.id, this.paymentMethod, amountPaid);
        
        if (result.success) {
            showToast('Pembayaran berhasil!', 'success');
            this.showReceipt(result.transaction);
            parkingManager.init();
            this.init();
            this.resetForm();
        } else {
            showToast(result.message, 'error');
        }
    }

    showReceipt(transaction) {
        document.getElementById('receipt-datetime').textContent = formatDateTime(transaction.exit_time);
        document.getElementById('receipt-plate').textContent = transaction.vehicle_plate;
        document.getElementById('receipt-type').textContent = transaction.vehicle_type.charAt(0).toUpperCase() + transaction.vehicle_type.slice(1);
        document.getElementById('receipt-slot').textContent = transaction.slot_number;
        document.getElementById('receipt-entry').textContent = formatTime(transaction.entry_time);
        document.getElementById('receipt-exit').textContent = formatTime(transaction.exit_time);
        document.getElementById('receipt-duration').textContent = `${transaction.duration_hours} jam`;
        document.getElementById('receipt-payment').textContent = transaction.payment_method === 'cash' ? 'Tunai' : 'QRIS';
        document.getElementById('receipt-rate').textContent = formatCurrency(this.settings.rates[transaction.vehicle_type]);
        document.getElementById('receipt-total').textContent = formatCurrency(transaction.fee);
        
        if (transaction.payment_method === 'cash') {
            document.getElementById('receipt-paid').textContent = formatCurrency(transaction.amount_paid);
            document.getElementById('receipt-change').textContent = formatCurrency(transaction.change);
            document.getElementById('receipt-paid-row').style.display = 'flex';
            document.getElementById('receipt-change-row').style.display = 'flex';
        } else {
            document.getElementById('receipt-paid-row').style.display = 'none';
            document.getElementById('receipt-change-row').style.display = 'none';
        }
        
        document.getElementById('receipt-modal').classList.add('active');
    }

    closeReceiptModal() {
        document.getElementById('receipt-modal').classList.remove('active');
    }

    printReceipt() {
        window.print();
    }

    resetForm() {
        this.selectedTransaction = null;
        document.getElementById('search-plate').value = '';
        document.getElementById('search-results').innerHTML = '';
        document.getElementById('vehicle-info').style.display = 'none';
        document.getElementById('payment-section').style.display = 'none';
        this.resetPayment();
    }

    resetPayment() {
        document.getElementById('amount-paid').value = '';
        document.getElementById('change-display').style.display = 'none';
        this.selectPaymentMethod('cash');
    }
}

const posManager = new POSManager();

function searchVehicle() {
    const query = document.getElementById('search-plate').value;
    posManager.searchVehicle(query);
}

function selectVehicle(id) {
    posManager.selectVehicle(id);
}

function selectPaymentMethod(method) {
    posManager.selectPaymentMethod(method);
}

function processCheckout() {
    posManager.processCheckout();
}

function closeReceiptModal() {
    posManager.closeReceiptModal();
}

function printReceipt() {
    posManager.printReceipt();
}

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.requireAuth()) return;
    initAuth();
    parkingManager.init();
    posManager.init();
    
    document.getElementById('receipt-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeReceiptModal();
    });
});
