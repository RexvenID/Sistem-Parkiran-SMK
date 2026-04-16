class SlotsManager {
    constructor() {
        this.storage = storage;
        this.slots = this.storage.getSlots();
        this.filteredSlots = [...this.slots];
    }

    init() {
        this.render();
    }

    render() {
        this.filteredSlots = this.getFilteredSlots();
        this.renderSlots();
        this.updateEmptyState();
    }

    getFilteredSlots() {
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const typeFilter = document.getElementById('filter-type')?.value || '';
        
        return this.slots.filter(slot => {
            if (statusFilter && slot.status !== statusFilter) return false;
            if (typeFilter && slot.vehicle_type !== typeFilter) return false;
            return true;
        });
    }

    renderSlots() {
        const container = document.getElementById('slot-container');
        if (!container) return;
        
        if (this.filteredSlots.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.filteredSlots.map(slot => `
            <div class="slot-item ${slot.status}" data-id="${slot.id}">
                <span class="number">${slot.slot_number}</span>
                <span class="status">${slot.vehicle_type}</span>
                <div style="display: flex; gap: 4px; margin-top: 8px;" onclick="event.stopPropagation()">
                    <button class="btn btn-sm btn-secondary" onclick="openEditModal('${slot.id}')" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${slot.id}')" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const container = document.getElementById('slot-container');
        
        if (this.slots.length === 0) {
            emptyState.style.display = 'block';
            container.style.display = 'none';
        } else if (this.filteredSlots.length === 0) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'Tidak Ditemukan';
            emptyState.querySelector('p').textContent = 'Tidak ada slot yang sesuai dengan filter.';
            emptyState.querySelector('button')?.remove();
            container.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            container.style.display = 'grid';
        }
    }

    add(slotData) {
        const exists = this.slots.find(s => s.slot_number === slotData.slot_number);
        if (exists) {
            return { success: false, message: 'Nomor slot sudah ada' };
        }
        
        const newSlot = {
            id: this.storage.generateId(),
            ...slotData,
            created_at: new Date().toISOString()
        };
        
        this.slots.push(newSlot);
        this.storage.setSlots(this.slots);
        
        return { success: true, message: 'Slot berhasil ditambahkan' };
    }

    update(id, slotData) {
        const index = this.slots.findIndex(s => s.id === id);
        if (index === -1) {
            return { success: false, message: 'Slot tidak ditemukan' };
        }
        
        const exists = this.slots.find(s => s.slot_number === slotData.slot_number && s.id !== id);
        if (exists) {
            return { success: false, message: 'Nomor slot sudah digunakan' };
        }
        
        this.slots[index] = { ...this.slots[index], ...slotData };
        this.storage.setSlots(this.slots);
        
        return { success: true, message: 'Slot berhasil diperbarui' };
    }

    delete(id) {
        const index = this.slots.findIndex(s => s.id === id);
        if (index === -1) {
            return { success: false, message: 'Slot tidak ditemukan' };
        }
        
        const slot = this.slots[index];
        if (slot.status === 'occupied') {
            return { success: false, message: 'Tidak dapat menghapus slot yang sedang terisi' };
        }
        
        this.slots.splice(index, 1);
        this.storage.setSlots(this.slots);
        
        return { success: true, message: 'Slot berhasil dihapus' };
    }

    getById(id) {
        return this.slots.find(s => s.id === id);
    }

    getAvailable(vehicleType) {
        return this.slots.filter(s => 
            s.status === 'available' && 
            (s.vehicle_type === vehicleType || vehicleType === 'all')
        );
    }

    occupySlot(id) {
        const index = this.slots.findIndex(s => s.id === id);
        if (index !== -1) {
            this.slots[index].status = 'occupied';
            this.storage.setSlots(this.slots);
            return true;
        }
        return false;
    }

    releaseSlot(id) {
        const index = this.slots.findIndex(s => s.id === id);
        if (index !== -1) {
            this.slots[index].status = 'available';
            this.storage.setSlots(this.slots);
            return true;
        }
        return false;
    }
}

const slotsManager = new SlotsManager();
let deleteSlotId = null;

function filterSlots() {
    slotsManager.render();
}

function openAddModal() {
    document.getElementById('modal-title').textContent = 'Tambah Slot';
    document.getElementById('slot-form').reset();
    document.getElementById('slot-id').value = '';
    document.getElementById('slot-status').value = 'available';
    document.getElementById('modal-overlay').classList.add('active');
}

function openEditModal(id) {
    const slot = slotsManager.getById(id);
    if (!slot) return;
    
    document.getElementById('modal-title').textContent = 'Edit Slot';
    document.getElementById('slot-id').value = slot.id;
    document.getElementById('slot-number').value = slot.slot_number;
    document.getElementById('vehicle-type').value = slot.vehicle_type;
    document.getElementById('slot-status').value = slot.status;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function saveSlot() {
    const id = document.getElementById('slot-id').value;
    const slot_number = document.getElementById('slot-number').value.trim();
    const vehicle_type = document.getElementById('vehicle-type').value;
    const status = document.getElementById('slot-status').value;
    
    if (!slot_number || !vehicle_type) {
        showToast('Mohon isi semua field', 'error');
        return;
    }
    
    const slotData = { slot_number, vehicle_type, status };
    let result;
    
    if (id) {
        result = slotsManager.update(id, slotData);
    } else {
        result = slotsManager.add(slotData);
    }
    
    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        slotsManager.render();
    } else {
        showToast(result.message, 'error');
    }
}

function openDeleteModal(id) {
    const slot = slotsManager.getById(id);
    if (!slot) return;
    
    deleteSlotId = id;
    document.getElementById('delete-slot-number').textContent = slot.slot_number;
    document.getElementById('delete-modal-overlay').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-modal-overlay').classList.remove('active');
    deleteSlotId = null;
}

function confirmDelete() {
    if (!deleteSlotId) return;
    
    const result = slotsManager.delete(deleteSlotId);
    
    if (result.success) {
        showToast(result.message, 'success');
        slotsManager.render();
    } else {
        showToast(result.message, 'error');
    }
    
    closeDeleteModal();
}

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.requireRole(['admin'])) return;
    initAuth();
    slotsManager.init();
    
    document.getElementById('modal-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('delete-modal-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
});
