class ParkingManager {
    constructor() {
        this.storage = storage;
        this.slots = this.storage.getSlots();
        this.transactions = this.storage.getTransactions();
        this.settings = this.storage.getSettings();
        this.currentTicket = null;
    }

    init() {
        this.loadAvailableSlots();
        this.loadActiveVehicles();
        this.renderSlotPreview();
        this.updateAvailableCounts();
    }

    getAvailableSlots(vehicleType = null) {
        return this.slots.filter(s => 
            s.status === 'available' && 
            (vehicleType === null || vehicleType === 'all' || s.vehicle_type === vehicleType)
        );
    }

    loadAvailableSlots() {
        const slots = this.getAvailableSlots();
        const select = document.getElementById('slot-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Pilih Slot Tersedia</option>';
        
        const groupedSlots = {
            motor: slots.filter(s => s.vehicle_type === 'motor'),
            mobil: slots.filter(s => s.vehicle_type === 'mobil'),
            truk: slots.filter(s => s.vehicle_type === 'truk')
        };
        
        if (groupedSlots.motor.length > 0) {
            select.innerHTML += '<optgroup label="Motor">';
            groupedSlots.motor.forEach(slot => {
                select.innerHTML += `<option value="${slot.id}">${slot.slot_number}</option>`;
            });
            select.innerHTML += '</optgroup>';
        }
        
        if (groupedSlots.mobil.length > 0) {
            select.innerHTML += '<optgroup label="Mobil">';
            groupedSlots.mobil.forEach(slot => {
                select.innerHTML += `<option value="${slot.id}">${slot.slot_number}</option>`;
            });
            select.innerHTML += '</optgroup>';
        }
        
        if (groupedSlots.truk.length > 0) {
            select.innerHTML += '<optgroup label="Truk">';
            groupedSlots.truk.forEach(slot => {
                select.innerHTML += `<option value="${slot.id}">${slot.slot_number}</option>`;
            });
            select.innerHTML += '</optgroup>';
        }
    }

    updateAvailableCounts() {
        const motor = this.getAvailableSlots('motor').length;
        const mobil = this.getAvailableSlots('mobil').length;
        const truk = this.getAvailableSlots('truk').length;
        
        const motorEl = document.getElementById('available-motor');
        const mobilEl = document.getElementById('available-mobil');
        const trukEl = document.getElementById('available-truk');
        
        if (motorEl) motorEl.textContent = motor;
        if (mobilEl) mobilEl.textContent = mobil;
        if (trukEl) mobilEl.textContent = mobil;
        if (trukEl) trukEl.textContent = truk;
    }

    renderSlotPreview() {
        const container = document.getElementById('slot-preview');
        if (!container) return;
        
        const slots = this.storage.getSlots();
        
        if (slots.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 20px;">Belum ada slot. Tambahkan slot di menu Manajemen Slot.</p>';
            return;
        }
        
        container.innerHTML = slots.map(slot => `
            <div class="slot-item ${slot.status}" title="${slot.slot_number} - ${slot.vehicle_type}">
                <span class="number">${slot.slot_number}</span>
                <span class="status">${slot.vehicle_type}</span>
            </div>
        `).join('');
    }

    loadActiveVehicles() {
        const activeTransactions = this.transactions.filter(t => t.status === 'active');
        const tbody = document.getElementById('active-vehicles');
        const emptyState = document.getElementById('empty-active');
        
        if (!tbody) return;
        
        if (activeTransactions.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        tbody.innerHTML = activeTransactions.map(t => `
            <tr>
                <td><strong>${t.vehicle_plate}</strong></td>
                <td><span class="badge badge-primary">${t.vehicle_type}</span></td>
                <td><strong>${t.slot_number}</strong></td>
                <td>${formatTime(t.entry_time)}</td>
                <td>${getDurationText(t.entry_time, new Date().toISOString())}</td>
            </tr>
        `).join('');
    }

    checkIn(plate, vehicleType, slotId) {
        const slot = this.slots.find(s => s.id === slotId);
        if (!slot) {
            return { success: false, message: 'Slot tidak ditemukan' };
        }
        
        if (slot.status !== 'available') {
            return { success: false, message: 'Slot sudah terisi' };
        }
        
        if (vehicleType !== slot.vehicle_type && slot.vehicle_type !== vehicleType) {
            return { success: false, message: 'Tipe kendaraan tidak sesuai dengan slot' };
        }
        
        const existingTransaction = this.transactions.find(t => 
            t.vehicle_plate.toLowerCase() === plate.toLowerCase() && t.status === 'active'
        );
        
        if (existingTransaction) {
            return { success: false, message: 'Kendaraan dengan plat ini sudah terdaftar dan belum keluar' };
        }
        
        const transaction = {
            id: this.storage.generateId(),
            slot_id: slot.id,
            slot_number: slot.slot_number,
            vehicle_plate: plate.toUpperCase(),
            vehicle_type: vehicleType,
            entry_time: new Date().toISOString(),
            exit_time: null,
            duration_hours: 0,
            fee: 0,
            payment_method: null,
            amount_paid: 0,
            change: 0,
            status: 'active',
            created_at: new Date().toISOString()
        };
        
        this.transactions.push(transaction);
        this.storage.setTransactions(this.transactions);
        
        slot.status = 'occupied';
        this.storage.setSlots(this.slots);
        
        this.currentTicket = transaction;
        
        return { success: true, ticket: transaction };
    }

    findByPlate(plate) {
        return this.transactions.find(t => 
            t.vehicle_plate.toLowerCase() === plate.toLowerCase() && t.status === 'active'
        );
    }

    checkOut(transactionId, paymentMethod, amountPaid) {
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index === -1) {
            return { success: false, message: 'Transaksi tidak ditemukan' };
        }
        
        const transaction = this.transactions[index];
        
        if (transaction.status !== 'active') {
            return { success: false, message: 'Kendaraan sudah keluar' };
        }
        
        const exitTime = new Date().toISOString();
        const duration = calculateDuration(transaction.entry_time, exitTime);
        const rate = this.settings.rates[transaction.vehicle_type] || 0;
        const fee = duration * rate;
        
        let change = 0;
        if (paymentMethod === 'cash') {
            if (amountPaid < fee) {
                return { success: false, message: 'Jumlah pembayaran kurang dari tarif' };
            }
            change = amountPaid - fee;
        }
        
        this.transactions[index] = {
            ...transaction,
            exit_time: exitTime,
            duration_hours: duration,
            fee: fee,
            payment_method: paymentMethod,
            amount_paid: amountPaid,
            change: change,
            status: 'completed'
        };
        
        this.storage.setTransactions(this.transactions);
        
        const slotIndex = this.slots.findIndex(s => s.id === transaction.slot_id);
        if (slotIndex !== -1) {
            this.slots[slotIndex].status = 'available';
            this.storage.setSlots(this.slots);
        }
        
        return { success: true, transaction: this.transactions[index] };
    }

    getTodayStats() {
        const today = getToday();
        const todayTransactions = this.transactions.filter(t => 
            t.created_at.startsWith(today) && t.status === 'completed'
        );
        
        return {
            totalTransactions: todayTransactions.length,
            totalIncome: todayTransactions.reduce((sum, t) => sum + t.fee, 0)
        };
    }
}

const parkingManager = new ParkingManager();

function resetForm() {
    document.getElementById('checkin-form').reset();
    parkingManager.loadAvailableSlots();
}

function showTicket(transaction) {
    document.getElementById('ticket-datetime').textContent = formatDateTime(transaction.entry_time);
    document.getElementById('ticket-plate').textContent = transaction.vehicle_plate;
    document.getElementById('ticket-type').textContent = transaction.vehicle_type.charAt(0).toUpperCase() + transaction.vehicle_type.slice(1);
    document.getElementById('ticket-slot').textContent = transaction.slot_number;
    document.getElementById('ticket-entry').textContent = formatTime(transaction.entry_time);
    
    document.getElementById('ticket-modal').classList.add('active');
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.remove('active');
}

function printTicket() {
    window.print();
}

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.requireAuth()) return;
    initAuth();
    parkingManager.init();
    
    const form = document.getElementById('checkin-form');
    const vehicleTypeSelect = document.getElementById('vehicle-type');
    
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const plate = document.getElementById('vehicle-plate').value.trim();
        const vehicleType = vehicleTypeSelect.value;
        const slotId = document.getElementById('slot-select').value;
        
        if (!plate || !vehicleType || !slotId) {
            showToast('Mohon isi semua field', 'error');
            return;
        }
        
        const result = parkingManager.checkIn(plate, vehicleType, slotId);
        
        if (result.success) {
            showToast('Check-in berhasil!', 'success');
            showTicket(result.ticket);
            parkingManager.init();
        } else {
            showToast(result.message, 'error');
        }
    });
    
    vehicleTypeSelect?.addEventListener('change', function() {
        const slots = parkingManager.getAvailableSlots(this.value);
        const select = document.getElementById('slot-select');
        
        select.innerHTML = '<option value="">Pilih Slot Tersedia</option>';
        
        if (slots.length === 0) {
            select.innerHTML += '<option value="" disabled>Tidak ada slot tersedia</option>';
            return;
        }
        
        slots.forEach(slot => {
            select.innerHTML += `<option value="${slot.id}">${slot.slot_number}</option>`;
        });
    });
    
    document.getElementById('ticket-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeTicketModal();
    });
});
