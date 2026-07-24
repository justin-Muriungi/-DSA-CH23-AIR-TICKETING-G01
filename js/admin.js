/* =============================================
   SKYVOYAGE — Admin Dashboard Module
   ============================================= */

const Admin = {
  init() {
    this.renderSidebar();
    this.showTab(App.state.adminTab || 'overview');
  },

  renderSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="sidebar-menu">
        <div class="sidebar-section-label">Analytics</div>
        <button class="sidebar-menu-item" data-tab="overview" onclick="Admin.showTab('overview')">
          <i data-lucide="bar-chart-2"></i> Overview
        </button>
        <button class="sidebar-menu-item" data-tab="reports" onclick="Admin.showTab('reports')">
          <i data-lucide="pie-chart"></i> Reports
        </button>

        <div class="sidebar-section-label mt-4">Management</div>
        <button class="sidebar-menu-item" data-tab="flights" onclick="Admin.showTab('flights')">
          <i data-lucide="plane"></i> Flights
        </button>
        <button class="sidebar-menu-item" data-tab="bookings" onclick="Admin.showTab('bookings')">
          <i data-lucide="briefcase"></i> Bookings
        </button>
        <button class="sidebar-menu-item" data-tab="users" onclick="Admin.showTab('users')">
          <i data-lucide="users"></i> Users
        </button>
        <button class="sidebar-menu-item" data-tab="promo" onclick="Admin.showTab('promo')">
          <i data-lucide="tag"></i> Promo Codes
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  showTab(tabId) {
    App.state.adminTab = tabId;
    
    document.querySelectorAll('#admin-sidebar .sidebar-menu-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabId);
    });

    const content = document.getElementById('admin-content');
    if (!content) return;

    switch (tabId) {
      case 'overview': this.renderOverview(content); break;
      case 'reports': this.renderReports(content); break;
      case 'flights': this.renderFlightsManagement(content); break;
      case 'bookings': this.renderBookingsManagement(content); break;
      case 'users': this.renderUsersManagement(content); break;
      case 'promo': this.renderPromoManagement(content); break;
    }
  },

  // --- OVERVIEW ---
  renderOverview(container) {
    const bookings = DB.getAll('bookings');
    const flights = DB.getAll('flights');
    const users = DB.getAll('users');

    const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totals.total, 0);
    const activeFlights = flights.filter(f => new Date(f.departureTime) > new Date()).length;
    const thisMonthBookings = bookings.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).length;

    let html = `
      <div class="animate-fadeIn">
        <h2 class="dashboard-title">Admin Overview</h2>
        
        <div class="grid grid-4 gap-6 mb-8">
          <div class="stat-card">
            <div class="stat-icon bg-blue-500/20 text-blue-400"><i data-lucide="dollar-sign"></i></div>
            <div class="stat-value">${formatPrice(totalRevenue)}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-change up"><i data-lucide="trending-up" class="w-3 h-3"></i> 12.5%</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green-500/20 text-green-400"><i data-lucide="briefcase"></i></div>
            <div class="stat-value">${bookings.length}</div>
            <div class="stat-label">Total Bookings</div>
            <div class="stat-change up"><i data-lucide="trending-up" class="w-3 h-3"></i> 8.2%</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-purple-500/20 text-purple-400"><i data-lucide="plane"></i></div>
            <div class="stat-value">${activeFlights}</div>
            <div class="stat-label">Active Flights</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-orange-500/20 text-orange-400"><i data-lucide="users"></i></div>
            <div class="stat-value">${users.length}</div>
            <div class="stat-label">Registered Users</div>
            <div class="stat-change up"><i data-lucide="trending-up" class="w-3 h-3"></i> 24 new this week</div>
          </div>
        </div>

        <div class="grid grid-2 gap-6">
          <div class="card">
            <h3 class="card-title">Recent Bookings</h3>
            <div class="table-wrapper mt-4 border-none">
              <table class="table">
                <thead><tr><th>PNR</th><th>Flight</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  ${bookings.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5).map(b => `
                    <tr>
                      <td class="font-mono text-xs">${b.pnr}</td>
                      <td>${b.flightNumber}</td>
                      <td class="font-semibold text-accent">${formatPrice(b.totals.total)}</td>
                      <td><span class="badge badge-${b.status==='cancelled'?'error':'success'}">${b.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="card">
             <h3 class="card-title mb-4">Flight Status Overview</h3>
             ${this.renderMiniDonutChart(flights)}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderMiniDonutChart(flights) {
    const statuses = { 'scheduled': 0, 'on-time': 0, 'delayed': 0, 'cancelled': 0 };
    flights.forEach(f => {
       if(statuses[f.status] !== undefined) statuses[f.status]++;
       else statuses['scheduled']++;
    });

    return `
      <div class="space-y-4">
         <div class="flex items-center justify-between">
           <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-500"></div> Scheduled</div>
           <div class="font-bold">${statuses.scheduled}</div>
         </div>
         <div class="flex items-center justify-between">
           <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div> On-Time</div>
           <div class="font-bold">${statuses['on-time']}</div>
         </div>
         <div class="flex items-center justify-between">
           <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div> Delayed</div>
           <div class="font-bold">${statuses.delayed}</div>
         </div>
         <div class="flex items-center justify-between">
           <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-500"></div> Cancelled</div>
           <div class="font-bold">${statuses.cancelled}</div>
         </div>
         <div class="progress-bar mt-4 flex" style="background:transparent">
            <div style="width:${(statuses.scheduled/flights.length)*100}%; background:#3b82f6" title="Scheduled"></div>
            <div style="width:${(statuses['on-time']/flights.length)*100}%; background:#10b981" title="On-time"></div>
            <div style="width:${(statuses.delayed/flights.length)*100}%; background:#f59e0b" title="Delayed"></div>
            <div style="width:${(statuses.cancelled/flights.length)*100}%; background:#ef4444" title="Cancelled"></div>
         </div>
      </div>
    `;
  },

  // --- REPORTS ---
  renderReports(container) {
    // Generate some fake historical data for chart
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revData = Array.from({length: 7}, () => Math.floor(Math.random() * 50000) + 10000);
    const maxRev = Math.max(...revData);

    let html = `
      <div class="animate-fadeIn">
        <div class="flex justify-between items-center mb-6">
          <h2 class="dashboard-title mb-0">Reports & Analytics</h2>
          <button class="btn btn-secondary"><i data-lucide="download"></i> Export CSV</button>
        </div>

        <div class="card mb-6">
          <h3 class="card-title mb-4">Weekly Revenue</h3>
          <div class="chart-bar-group border-b border-gray-700">
            ${revData.map((val, i) => `
              <div class="chart-bar" style="height: ${(val/maxRev)*100}%" data-tooltip="${formatPrice(val)}">
                 <div class="chart-bar-value">${formatPrice(val).replace('$','')}</div>
                 <div class="chart-bar-label">${days[i]}</div>
              </div>
            `).join('')}
          </div>
          <div class="h-8"></div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  // --- FLIGHTS ---
  renderFlightsManagement(container) {
    const flights = DB.getAll('flights').sort((a,b) => new Date(a.departureTime) - new Date(b.departureTime));

    let html = `
      <div class="animate-fadeIn">
        <div class="flex justify-between items-center mb-6">
          <h2 class="dashboard-title mb-0">Flight Management</h2>
          <button class="btn btn-primary" onclick="Admin.openAddFlightModal()"><i data-lucide="plus"></i> Add Flight</button>
        </div>

        <div class="card p-0 overflow-hidden">
          <div class="table-wrapper border-none">
            <table class="table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Date & Time</th>
                  <th>Aircraft</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${flights.slice(0,20).map(f => `
                  <tr>
                    <td class="font-bold">${f.flightNumber}</td>
                    <td>${f.departureAirport} → ${f.arrivalAirport}</td>
                    <td>
                      <div>${formatDate(f.departureTime)}</div>
                      <div class="text-xs text-muted">${formatTime(f.departureTime)}</div>
                    </td>
                    <td class="text-xs text-secondary">${f.aircraftId}</td>
                    <td>
                      <div class="w-full bg-gray-700 h-2 rounded-full overflow-hidden" title="${f.availableSeats}/${f.totalSeats} available">
                        <div class="bg-cyan-500 h-full" style="width: ${((f.totalSeats-f.availableSeats)/f.totalSeats)*100}%"></div>
                      </div>
                      <div class="text-xs text-center mt-1 text-muted">${f.availableSeats} left</div>
                    </td>
                    <td>
                       <select class="form-input py-1 px-2 text-xs w-auto bg-transparent border-gray-700" onchange="Admin.updateFlightStatus('${f.id}', this.value)">
                         <option value="scheduled" ${f.status==='scheduled'?'selected':''}>Scheduled</option>
                         <option value="on-time" ${f.status==='on-time'?'selected':''}>On Time</option>
                         <option value="delayed" ${f.status==='delayed'?'selected':''}>Delayed</option>
                         <option value="boarding" ${f.status==='boarding'?'selected':''}>Boarding</option>
                         <option value="departed" ${f.status==='departed'?'selected':''}>Departed</option>
                         <option value="cancelled" ${f.status==='cancelled'?'selected':''}>Cancelled</option>
                       </select>
                    </td>
                    <td>
                      <button class="btn-icon btn-sm text-error" onclick="Admin.deleteFlight('${f.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  updateFlightStatus(id, newStatus) {
    const flight = DB.find('flights', id);
    if(flight) {
      flight.status = newStatus;
      DB.update('flights', id, flight);
      Toast.show('Updated', `Flight ${flight.flightNumber} status updated to ${newStatus}.`, 'success');
      
      // If delayed or cancelled, notify users who booked this flight
      if (newStatus === 'delayed' || newStatus === 'cancelled') {
         const bookings = DB.getAll('bookings').filter(b => b.flightId === id);
         bookings.forEach(b => {
            Notifications.add({
              userId: b.userId,
              type: newStatus === 'cancelled' ? 'alert' : 'warning',
              title: `Flight ${newStatus.toUpperCase()}`,
              message: `Your flight ${flight.flightNumber} to ${flight.arrivalAirport} has been ${newStatus}.`,
              icon: 'alert-circle'
            });
         });
      }
    }
  },

  deleteFlight(id) {
    if(confirm('Are you sure you want to delete this flight? This action cannot be undone.')) {
      DB.delete('flights', id);
      Toast.show('Deleted', 'Flight deleted successfully.', 'info');
      this.renderFlightsManagement(document.getElementById('admin-content'));
    }
  },

  openAddFlightModal() {
    Toast.show('Not Implemented', 'Add flight form would open here in full version.', 'info');
  },

  // --- BOOKINGS & USERS (Stubs for brevity) ---
  renderBookingsManagement(container) {
    container.innerHTML = `<div class="animate-fadeIn"><h2 class="dashboard-title">All Bookings</h2><p class="text-secondary">Full booking management table would go here.</p></div>`;
  },
  
  renderUsersManagement(container) {
    const users = DB.getAll('users');
    let html = `
      <div class="animate-fadeIn">
        <h2 class="dashboard-title">User Management</h2>
        <div class="card p-0 overflow-hidden">
          <table class="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td class="font-bold">${u.firstName} ${u.lastName}</td>
                  <td>${u.email}</td>
                  <td><span class="badge ${u.role==='admin'?'badge-premium':'badge-neutral'}">${u.role}</span></td>
                  <td>${formatDate(u.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.innerHTML = html;
  },

  renderPromoManagement(container) {
    const promos = DB.getAll('promoCodes');
    let html = `
      <div class="animate-fadeIn">
        <div class="flex justify-between items-center mb-6">
          <h2 class="dashboard-title mb-0">Promo Codes</h2>
          <button class="btn btn-primary" onclick="Toast.show('Info','Create promo form would open here.','info')"><i data-lucide="plus"></i> Add Code</button>
        </div>
        <div class="grid grid-3 gap-4">
          ${promos.map(p => `
            <div class="card p-4 border-l-4 ${p.active ? 'border-l-success' : 'border-l-gray-600'}">
              <div class="flex justify-between items-start mb-2">
                <div class="font-mono font-bold text-lg text-accent">${p.code}</div>
                <span class="badge ${p.active?'badge-success':'badge-neutral'}">${p.active?'Active':'Inactive'}</span>
              </div>
              <div class="text-sm font-semibold mb-1">${p.type === 'percentage' ? p.discount+'%' : formatPrice(p.discount)} OFF</div>
              <div class="text-xs text-secondary mb-3">${p.description}</div>
              <div class="flex justify-between text-xs text-muted">
                <span>Uses: ${p.usedCount}/${p.maxUses}</span>
                <span>Exp: ${formatDate(p.expiryDate)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};
