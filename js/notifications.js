/* =============================================
   SKYVOYAGE — Notifications Module
   ============================================= */

const Notifications = {
  init() {
    this.setupListeners();
    this.updateBadge();
  },

  getAll() {
    if (!App.state.currentUser) return [];
    const notifs = DB.getAll('notifications');
    return notifs.filter(n => n.userId === App.state.currentUser.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  add(data) {
    const notif = {
      id: DB.generateId(),
      userId: data.userId,
      type: data.type, // 'info', 'success', 'warning', 'alert', 'booking', 'checkin'
      title: data.title,
      message: data.message,
      icon: data.icon || 'bell',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    DB.add('notifications', notif);
    
    // If it's for current user, show toast and update badge
    if (App.state.currentUser && App.state.currentUser.id === data.userId) {
      Toast.show(notif.title, notif.message, 'info');
      this.updateBadge();
      
      // Update view if on dashboard
      if (document.getElementById('nav-notifications-dropdown')?.classList.contains('open')) {
         this.renderDropdown();
      }
    }
  },

  markAsRead(id) {
    const notif = DB.find('notifications', id);
    if (notif) {
      notif.read = true;
      DB.update('notifications', id, notif);
      this.updateBadge();
    }
  },
  
  markAllAsRead() {
    if (!App.state.currentUser) return;
    const notifs = DB.getAll('notifications');
    let updated = false;
    notifs.forEach(n => {
       if(n.userId === App.state.currentUser.id && !n.read) {
          n.read = true;
          updated = true;
       }
    });
    if(updated) {
       DB.set('notifications', notifs);
       this.updateBadge();
       this.renderDropdown();
    }
  },

  updateBadge() {
    const unread = this.getAll().filter(n => !n.read).length;
    document.querySelectorAll('.notification-count').forEach(badge => {
      if (unread > 0) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  },

  setupListeners() {
    const btn = document.getElementById('nav-notifications-btn');
    const dropdown = document.getElementById('nav-notifications-dropdown');
    
    if (btn && dropdown) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        
        // Close others
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('open'));
        
        if (!isOpen) {
          dropdown.classList.add('open');
          this.renderDropdown();
        }
      });
      
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    }
  },

  renderDropdown() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const notifs = this.getAll().slice(0, 5); // Show top 5
    
    if (notifs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-secondary text-sm">No notifications</div>`;
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" onclick="Notifications.handleNotifClick('${n.id}')">
        <div class="notification-icon bg-gray-800"><i data-lucide="${n.icon}" class="w-5 h-5 ${n.read ? 'text-gray-400' : 'text-cyan-400'}"></i></div>
        <div class="notification-body">
          <div class="flex justify-between items-start">
             <div class="notification-title ${n.read ? 'text-gray-300' : 'text-white'}">${n.title}</div>
             <div class="notification-time">${timeAgo(n.createdAt)}</div>
          </div>
          <div class="notification-text ${n.read ? 'text-gray-500' : 'text-gray-400'}">${n.message}</div>
        </div>
      </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  handleNotifClick(id) {
    this.markAsRead(id);
    document.getElementById('nav-notifications-dropdown')?.classList.remove('open');
    App.navigate('dashboard'); // Simple routing logic for demo
  }
};
