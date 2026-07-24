/* =============================================
   SKYVOYAGE — App Router & State Manager
   ============================================= */

const App = {
  state: {
    currentPage: 'home',
    currentUser: null,
    searchResults: [],
    selectedFlight: null,
    bookingData: {},
    bookingStep: 0,
    adminTab: 'overview',
    dashboardTab: 'bookings'
  },

  init() {
    DB.init();
    AppDSA.init();
    this.loadSession();
    this.setupRouter();
    this.setupNavigation();
    this.setupMobileNav();
    this.updateNavState();

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();

    // Initialize notifications
    Notifications.init();

    console.log('✈️ SkyVoyage App initialized');
  },

  // --- Session Management ---
  loadSession() {
    const userId = DB.get('currentUserId');
    if (userId) {
      const users = DB.getAll('users');
      this.state.currentUser = users.find(u => u.id === userId);
    }
  },

  login(user) {
    this.state.currentUser = user;
    DB.set('currentUserId', user.id);
    this.updateNavState();
    Toast.show('Welcome back!', `Hello, ${user.firstName}!`, 'success');
    this.navigate('home');
  },

  logout() {
    this.state.currentUser = null;
    DB.remove('currentUserId');
    this.updateNavState();
    Toast.show('Logged out', 'See you next time!', 'info');
    this.navigate('home');
  },

  // --- Router ---
  setupRouter() {
    this.routes = {
      'home': { page: 'page-home', title: 'Book Your Next Adventure', auth: false },
      'search': { page: 'page-search', title: 'Flight Results', auth: false },
      'login': { page: 'page-login', title: 'Sign In', auth: false },
      'register': { page: 'page-register', title: 'Create Account', auth: false },
      'booking': { page: 'page-booking', title: 'Complete Your Booking', auth: true },
      'confirmation': { page: 'page-confirmation', title: 'Booking Confirmed', auth: true },
      'dashboard': { page: 'page-dashboard', title: 'My Dashboard', auth: true },
      'admin': { page: 'page-admin', title: 'Admin Panel', auth: true, role: 'admin' },
      'checkin': { page: 'page-checkin', title: 'Online Check-In', auth: true },
      'reviews': { page: 'page-reviews', title: 'Flight Reviews', auth: false }
    };
  },

  handleRoute() {
    const hash = window.location.hash.slice(2) || 'home';
    const [page, ...params] = hash.split('/');
    const route = this.routes[page];

    if (!route) {
      this.navigate('home');
      return;
    }

    // Auth guard
    if (route.auth && !this.state.currentUser) {
      Toast.show('Authentication Required', 'Please sign in to continue.', 'warning');
      this.navigate('login');
      return;
    }

    // Role guard
    if (route.role && this.state.currentUser?.role !== route.role) {
      Toast.show('Access Denied', 'You do not have permission.', 'error');
      this.navigate('home');
      return;
    }

    this.showPage(page, params);
  },

  navigate(page, params = '') {
    window.location.hash = `/${page}${params ? '/' + params : ''}`;
  },

  showPage(page, params) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const route = this.routes[page];
    if (!route) return;

    const pageEl = document.getElementById(route.page);
    if (pageEl) {
      pageEl.classList.add('active');
      this.state.currentPage = page;
      document.title = `${route.title} — SkyVoyage`;
      this.updateActiveNav(page);

      // Trigger page-specific init
      this.onPageEnter(page, params);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  onPageEnter(page, params) {
    switch (page) {
      case 'home':
        Flights.initHomePage();
        break;
      case 'search':
        Flights.renderResults();
        break;
      case 'booking':
        Booking.init();
        break;
      case 'dashboard':
        Dashboard.init();
        break;
      case 'admin':
        Admin.init();
        break;
      case 'checkin':
        CheckIn.init();
        break;
      case 'reviews':
        Reviews.init();
        break;
    }
  },

  // --- Navigation ---
  setupNavigation() {
    // Nav link clicks
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.getAttribute('data-nav');
        this.navigate(page);
        this.closeMobileNav();
      });
    });

    // Logout button
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.logout();
    });
    document.getElementById('btn-logout-mobile')?.addEventListener('click', () => {
      this.logout();
      this.closeMobileNav();
    });

    // User dropdown
    const userBtn = document.getElementById('nav-user-btn');
    const userDropdown = document.getElementById('nav-user-dropdown');
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        userDropdown.classList.remove('open');
      });
    }
  },

  setupMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        toggle.innerHTML = mobileNav.classList.contains('open')
          ? '<i data-lucide="x"></i>'
          : '<i data-lucide="menu"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    }
  },

  closeMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const toggle = document.getElementById('nav-toggle');
    if (mobileNav) {
      mobileNav.classList.remove('open');
      if (toggle) {
        toggle.innerHTML = '<i data-lucide="menu"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  },

  updateNavState() {
    const user = this.state.currentUser;
    const guestNav = document.getElementById('nav-guest');
    const userNav = document.getElementById('nav-user');
    const adminLink = document.getElementById('nav-admin-link');
    const adminLinkMobile = document.getElementById('nav-admin-link-mobile');
    const dashLink = document.getElementById('nav-dash-link');
    const dashLinkMobile = document.getElementById('nav-dash-link-mobile');
    const guestMobile = document.getElementById('mobile-guest');
    const userMobile = document.getElementById('mobile-user');

    if (user) {
      if (guestNav) guestNav.classList.add('hidden');
      if (userNav) userNav.classList.remove('hidden');
      if (guestMobile) guestMobile.classList.add('hidden');
      if (userMobile) userMobile.classList.remove('hidden');

      // Update user info
      const nameEl = document.getElementById('nav-user-name');
      const roleEl = document.getElementById('nav-user-role');
      const avatarEl = document.getElementById('nav-user-avatar');
      if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
      if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      if (avatarEl) avatarEl.textContent = user.firstName[0] + user.lastName[0];

      // Show/hide admin link
      const isAdmin = user.role === 'admin';
      if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';
      if (adminLinkMobile) adminLinkMobile.style.display = isAdmin ? '' : 'none';
      if (dashLink) dashLink.style.display = '';
      if (dashLinkMobile) dashLinkMobile.style.display = '';
    } else {
      if (guestNav) guestNav.classList.remove('hidden');
      if (userNav) userNav.classList.add('hidden');
      if (guestMobile) guestMobile.classList.remove('hidden');
      if (userMobile) userMobile.classList.add('hidden');
      if (adminLink) adminLink.style.display = 'none';
      if (adminLinkMobile) adminLinkMobile.style.display = 'none';
    }
  },

  updateActiveNav(page) {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-nav') === page);
    });
  }
};

// --- Toast Notification System ---
const Toast = {
  show(title, message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${icons[type] || 'info'}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">
        <i data-lucide="x" style="width:14px;height:14px"></i>
      </button>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
