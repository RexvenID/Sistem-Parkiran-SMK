const STORAGE_KEYS = {
    USERS: 'parking_users',
    CONFIG: 'parking_config',
    TRANSACTIONS: 'parking_transactions',
    SESSION: 'parking_session'
};

const DEFAULT_USERS = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, username: 'petugas', password: 'petugas123', role: 'petugas', created_at: '2024-01-01T00:00:00Z' }
];

const DEFAULT_CONFIG = {
    parking_name: 'Sistem Parkiran',
    rates: {
        motor: 2000,
        mobil: 5000,
        truk: 10000
    },
    capacity: {
        motor: 10,
        mobil: 10,
        truk: 5
    }
};

class Storage {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
            this.set(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
        }
        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            this.set(STORAGE_KEYS.TRANSACTIONS, []);
        }
    }

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    clear() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.init();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    getUsers() {
        return this.get(STORAGE_KEYS.USERS) || [];
    }

    setUsers(users) {
        return this.set(STORAGE_KEYS.USERS, users);
    }

    getConfig() {
        return this.get(STORAGE_KEYS.CONFIG) || DEFAULT_CONFIG;
    }

    setConfig(config) {
        return this.set(STORAGE_KEYS.CONFIG, config);
    }

    getTransactions() {
        return this.get(STORAGE_KEYS.TRANSACTIONS) || [];
    }

    setTransactions(transactions) {
        return this.set(STORAGE_KEYS.TRANSACTIONS, transactions);
    }

    getSession() {
        return this.get(STORAGE_KEYS.SESSION);
    }

    setSession(session) {
        return this.set(STORAGE_KEYS.SESSION, session);
    }

    clearSession() {
        return this.remove(STORAGE_KEYS.SESSION);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

const storage = new Storage();
