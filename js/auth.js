class Auth {
    constructor() {
        this.storage = storage;
    }

    login(username, password) {
        const users = this.storage.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            const session = {
                id: user.id,
                username: user.username,
                role: user.role,
                login_at: new Date().toISOString()
            };
            this.storage.setSession(session);
            return { success: true, user: session };
        }
        
        return { success: false, message: 'Username atau password salah' };
    }

    logout() {
        this.storage.clearSession();
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return this.storage.getSession() !== null;
    }

    getCurrentUser() {
        return this.storage.getSession();
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    requireRole(roles) {
        if (!this.requireAuth()) return false;
        
        const user = this.getCurrentUser();
        if (!roles.includes(user.role)) {
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    isPetugas() {
        const user = this.getCurrentUser();
        return user && user.role === 'petugas';
    }

    register(username, password, role = 'petugas') {
        const users = this.storage.getUsers();
        
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username sudah digunakan' };
        }
        
        const newUser = {
            id: users.length + 1,
            username,
            password,
            role,
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        this.storage.setUsers(users);
        
        return { success: true, message: 'User berhasil dibuat' };
    }

    changePassword(oldPassword, newPassword) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Not logged in' };
        
        const users = this.storage.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex === -1) return { success: false, message: 'User not found' };
        
        if (users[userIndex].password !== oldPassword) {
            return { success: false, message: 'Password lama salah' };
        }
        
        users[userIndex].password = newPassword;
        this.storage.setUsers(users);
        
        return { success: true, message: 'Password berhasil diubah' };
    }
}

const auth = new Auth();

function initAuth() {
    if (!auth.requireAuth()) return;
    
    const user = auth.getCurrentUser();
    
    document.getElementById('user-name')?.setAttribute('data-name', user.username);
    document.getElementById('user-role')?.setAttribute('data-role', user.role);
    
    const userNameEl = document.querySelector('.user-details h4');
    const userRoleEl = document.querySelector('.user-details p');
    const userAvatarEl = document.querySelector('.user-avatar');
    
    if (userNameEl) userNameEl.textContent = user.username;
    if (userRoleEl) userRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (userAvatarEl) userAvatarEl.textContent = user.username.charAt(0).toUpperCase();
    
    if (user.role !== 'admin') {
        document.querySelectorAll('[data-role="admin"]').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function logout() {
    auth.logout();
}
