/* =============================================
   SKYVOYAGE — User Dashboard Module
   ============================================= */

const Dashboard = {
  init() {
    this.renderSidebar();
    this.showTab(App.state.dashboardTab || 'bookings');
  },

  renderSidebar() {
    const user = App.state.currentUser;
    const sidebar = document.getElementById('dashboard-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="flex items-center gap-4 mb-6 md-hidden-flex">
        <div class="avatar avatar-lg">${user.firstName[0]}${user.lastName[0]}</div>
        <div>
          <div class="font-bold">${user.firstName} ${user.lastName}</div>
          <div class="text-xs text-muted">${user.email}</div>
        </div>
      </div>

      <div class="sidebar-menu">
        <div class="sidebar-section-label">Manage Travel</div>
        <button class="sidebar-menu-item" data-tab="bookings" onclick="Dashboard.showTab('bookings')">
          <i data-lucide="briefcase"></i> My Bookings
        </button>
        <button class="sidebar-menu-item" data-tab="wishlist" onclick="Dashboard.showTab('wishlist')">
          <i data-lucide="heart"></i> Saved Flights
        </button>
        
        <div class="sidebar-section-label mt-4">Account</div>
        <button class="sidebar-menu-item" data-tab="profile" onclick="Dashboard.showTab('profile')">
          <i data-lucide="user"></i> Profile Settings
        </button>
        <button class="sidebar-menu-item" data-tab="payment-history" onclick="Dashboard.showTab('payment-history')">
          <i data-lucide="credit-card"></i> Payment History
        </button>
        <button class="sidebar-menu-item text-error hover:bg-red-500/10 mt-4" onclick="App.logout()">
          <i data-lucide="log-out"></i> Sign Out
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  showTab(tabId) {
    App.state.dashboardTab = tabId;
    
    // Update active state in sidebar
    document.querySelectorAll('#dashboard-sidebar .sidebar-menu-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabId);
    });

    const content = document.getElementById('dashboard-content');
    if (!content) return;

    switch (tabId) {
      case 'bookings':
        this.renderBookings(content);
        break;
      case 'wishlist':
        this.renderWishlist(content);
        break;
      case 'profile':
        this.renderProfile(content);
        break;
      case 'payment-history':
        this.renderPaymentHistory(content);
        break;
    }
  },

  renderBookings(container) {
    const allBookings = DB.getAll('bookings').filter(b => b.userId === App.state.currentUser.id);
    // Sort by departure time desc
    allBookings.sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime));

    const upcoming = allBookings.filter(b => new Date(b.departureTime) > new Date() && b.status !== 'cancelled');
    const past = allBookings.filter(b => new Date(b.departureTime) <= new Date() || b.status === 'cancelled');

    let html = `<div class="animate-fadeIn"><h2 class="dashboard-title">My Bookings</h2>`;

    if (allBookings.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="briefcase" style="width:40px;height:40px"></i></div>
          <h3 class="empty-state-title">No bookings yet</h3>
          <p class="empty-state-text">You haven't booked any flights yet. Start exploring destinations!</p>
          <button class="btn btn-primary mt-6" onclick="App.navigate('home')">Search Flights</button>
        </div>
      `;
    } else {
      if (upcoming.length > 0) {
        html += `<h3 class="text-lg font-semibold mb-4 text-cyan-400">Upcoming Flights</h3>`;
        html += `<div class="grid gap-4 mb-8">` + upcoming.map(b => this.getBookingCard(b)).join('') + `</div>`;
      }
      
      if (past.length > 0) {
        html += `<h3 class="text-lg font-semibold mb-4 text-gray-400">Past & Cancelled</h3>`;
        html += `<div class="grid gap-4 opacity-80">` + past.map(b => this.getBookingCard(b, true)).join('') + `</div>`;
      }
    }

    html += `</div>`;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  getBookingCard(booking, isPast = false) {
    const flight = DB.find('flights', booking.flightId) || booking;
    const airline = getAirline(flight.airlineId);
    const statusMap = {
      'confirmed': { label: 'Confirmed', color: 'success' },
      'checked-in': { label: 'Checked In', color: 'info' },
      'cancelled': { label: 'Cancelled', color: 'error' },
      'completed': { label: 'Completed', color: 'neutral' }
    };
    
    let status = booking.status;
    if (isPast && status === 'confirmed') status = 'completed'; // Auto complete past flights
    
    const statusInfo = statusMap[status] || { label: status, color: 'neutral' };

    return `
      <div class="card ${isPast ? '' : 'border-cyan-900/50 hover:border-cyan-500/50'}">
        <div class="flex flex-col md:flex-row gap-4 justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <span class="badge badge-${statusInfo.color}">${statusInfo.label}</span>
              <span class="text-sm font-mono text-secondary">PNR: <strong class="text-white">${booking.pnr}</strong></span>
              <span class="text-xs text-muted ml-auto">Booked on ${formatDate(booking.createdAt)}</span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="airline-logo" style="border-color:${airline?.color}">${airline?.shortCode}</div>
              <div>
                <div class="font-bold text-lg">${booking.departureAirport} → ${booking.arrivalAirport}</div>
                <div class="text-sm text-secondary">${airline?.name} ${flight.flightNumber} · ${formatDate(flight.departureTime)} at ${formatTime(flight.departureTime)}</div>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-800 text-sm text-secondary flex gap-4">
              <span><i data-lucide="users" class="inline w-4 h-4"></i> ${booking.passengers} Passenger${booking.passengers>1?'s':''}</span>
              <span><i data-lucide="armchair" class="inline w-4 h-4"></i> ${booking.cabin}</span>
              <span class="ml-auto font-semibold text-white">${formatPrice(booking.totals.total)}</span>
            </div>
          </div>
          
          <div class="flex flex-row md:flex-col gap-2 justify-end min-w-[140px]">
            ${!isPast && status !== 'cancelled' ? `
              ${status !== 'checked-in' ? `
                <button class="btn btn-primary btn-block btn-sm" onclick="App.navigate('checkin')">Check-in</button>
              ` : `
                <button class="btn btn-secondary btn-block btn-sm" onclick="CheckIn.generateTicket('${booking.id}')"><i data-lucide="download" class="w-4 h-4"></i> Boarding Pass</button>
              `}
              <button class="btn btn-danger btn-block btn-sm" onclick="Dashboard.cancelBooking('${booking.id}')">Cancel</button>
            ` : ''}
            
            ${isPast && status === 'completed' ? `
              <button class="btn btn-secondary btn-block btn-sm" onclick="App.navigate('reviews')"><i data-lucide="star" class="w-4 h-4"></i> Leave Review</button>
            ` : ''}
            
            <button class="btn btn-ghost btn-block btn-sm" onclick="CheckIn.generateTicket('${booking.id}')"><i data-lucide="file-text" class="w-4 h-4"></i> E-Ticket</button>
          </div>
        </div>
      </div>
    `;
  },

  cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? Refund policies will apply.')) {
      const booking = DB.find('bookings', bookingId);
      if (booking) {
        booking.status = 'cancelled';
        DB.update('bookings', bookingId, booking);
        
        // Return seats
        const flight = DB.find('flights', booking.flightId);
        if (flight) {
          flight.availableSeats += booking.passengers;
          DB.update('flights', flight.id, flight);
        }

        Toast.show('Booking Cancelled', 'Your refund will be processed within 5-7 business days.', 'info');
        this.renderBookings(document.getElementById('dashboard-content'));
      }
    }
  },

  renderWishlist(container) {
    const wishlist = DB.getAll('wishlist').filter(w => w.userId === App.state.currentUser.id);
    
    let html = `<div class="animate-fadeIn"><h2 class="dashboard-title">Saved Flights</h2>`;

    if (wishlist.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="heart" style="width:40px;height:40px"></i></div>
          <h3 class="empty-state-title">Your wishlist is empty</h3>
          <p class="empty-state-text">Save flights you're interested in to easily track prices and book later.</p>
        </div>
      `;
    } else {
      const flights = wishlist.map(w => DB.find('flights', w.flightId)).filter(f => f);
      App.state.searchResults = flights; // so we can reuse renderFlightCard (hacky but works for demo)
      
      // Temporarily override searchParams to render correctly
      const oldParams = Flights.searchParams;
      Flights.searchParams = { cabin: 'economy', passengers: 1 };
      
      html += `<div class="grid gap-4">` + flights.map(f => Flights.renderFlightCard(f)).join('') + `</div>`;
      
      Flights.searchParams = oldParams;
    }

    html += `</div>`;
    container.innerHTML = html;
    
    // Attach event listeners for the rendered flight cards
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
      container.querySelectorAll('.flight-card').forEach(card => {
        const selectBtn = card.querySelector('.btn-select-flight');
        if (selectBtn) selectBtn.addEventListener('click', (e) => { e.stopPropagation(); Flights.selectFlight(card.dataset.flightId); });
        const wishBtn = card.querySelector('.btn-wishlist');
        if (wishBtn) wishBtn.addEventListener('click', (e) => { 
          e.stopPropagation(); 
          Flights.toggleWishlist(card.dataset.flightId, wishBtn);
          // Re-render
          setTimeout(() => this.renderWishlist(container), 300);
        });
      });
    }, 50);
  },

  renderProfile(container) {
    const user = App.state.currentUser;
    
    container.innerHTML = `
      <div class="animate-fadeIn max-w-2xl">
        <h2 class="dashboard-title">Profile Settings</h2>
        
        <div class="card mb-6">
          <h3 class="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Personal Information</h3>
          <form id="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input type="text" id="prof-first" class="form-input" value="${user.firstName}">
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input type="text" id="prof-last" class="form-input" value="${user.lastName}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input bg-gray-800" value="${user.email}" disabled>
                <div class="form-hint">Email cannot be changed.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="prof-phone" class="form-input" value="${user.phone || ''}">
              </div>
            </div>
            <button type="submit" class="btn btn-primary mt-2">Save Changes</button>
          </form>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Security</h3>
          <form id="password-form">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" id="pwd-curr" class="form-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" id="pwd-new" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" id="pwd-conf" class="form-input">
              </div>
            </div>
            <button type="submit" class="btn btn-secondary mt-2">Update Password</button>
          </form>
        </div>
      </div>
    `;

    // Handle Profile Save
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      user.firstName = document.getElementById('prof-first').value;
      user.lastName = document.getElementById('prof-last').value;
      user.phone = document.getElementById('prof-phone').value;
      
      DB.update('users', user.id, user);
      App.updateNavState(); // update name in nav
      this.renderSidebar(); // update name in sidebar
      Toast.show('Success', 'Profile updated successfully.', 'success');
    });

    // Handle Password Save
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const curr = document.getElementById('pwd-curr').value;
      const newP = document.getElementById('pwd-new').value;
      const conf = document.getElementById('pwd-conf').value;

      if (curr !== user.password) { Toast.show('Error', 'Incorrect current password.', 'error'); return; }
      if (newP.length < 6) { Toast.show('Error', 'New password must be at least 6 characters.', 'error'); return; }
      if (newP !== conf) { Toast.show('Error', 'Passwords do not match.', 'error'); return; }

      user.password = newP;
      DB.update('users', user.id, user);
      Toast.show('Success', 'Password updated successfully.', 'success');
      e.target.reset();
    });
  },

  renderPaymentHistory(container) {
    const bookings = DB.getAll('bookings').filter(b => b.userId === App.state.currentUser.id);
    
    let html = `<div class="animate-fadeIn max-w-4xl"><h2 class="dashboard-title">Payment History</h2>`;

    if (bookings.length === 0) {
      html += `<div class="card p-8 text-center text-secondary">No transactions found.</div>`;
    } else {
      html += `
        <div class="card p-0 overflow-hidden">
          <div class="table-wrapper" style="border:none">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID / PNR</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th class="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${bookings.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(b => `
                  <tr>
                    <td>${formatDate(b.createdAt)}</td>
                    <td class="font-mono text-xs">${b.id.substring(0,8).toUpperCase()} / ${b.pnr}</td>
                    <td><span class="badge badge-neutral uppercase">${b.paymentMethod}</span></td>
                    <td>
                      ${b.status === 'cancelled' 
                        ? '<span class="badge badge-error">Refunded</span>' 
                        : '<span class="badge badge-success">Paid</span>'}
                    </td>
                    <td class="text-right font-semibold">${formatPrice(b.totals.total)}</td>
                    <td class="text-right">
                      <button class="btn btn-ghost btn-sm" onclick="Toast.show('Receipt', 'Receipt downloaded (simulated)', 'info')">
                        <i data-lucide="download"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};
