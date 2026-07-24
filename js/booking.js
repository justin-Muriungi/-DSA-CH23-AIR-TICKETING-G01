/* =============================================
   SKYVOYAGE — Booking Flow Module
   ============================================= */

const Booking = {
  currentStep: 0,
  steps: ['flight', 'passengers', 'seats', 'addons', 'review', 'payment'],

  init() {
    if (!App.state.selectedFlight || !App.state.bookingData) {
      App.navigate('home');
      return;
    }
    this.currentStep = 0;
    this.renderBooking();
  },

  renderBooking() {
    const container = document.getElementById('booking-content');
    const sidebar = document.getElementById('booking-sidebar');
    if (!container) return;

    this.renderStepper();
    this.renderStep(container);
    this.renderSidebar(sidebar);
  },

  renderStepper() {
    const stepperEl = document.getElementById('booking-stepper');
    if (!stepperEl) return;

    const labels = ['Flight', 'Passengers', 'Seats', 'Add-ons', 'Review', 'Payment'];
    const icons = ['plane', 'users', 'grid-3x3', 'package', 'clipboard-check', 'credit-card'];

    stepperEl.innerHTML = this.steps.map((step, i) => `
      <div class="step ${i < this.currentStep ? 'completed' : ''} ${i === this.currentStep ? 'active' : ''}">
        <div class="step-number">${i < this.currentStep ? '<i data-lucide="check" style="width:16px;height:16px"></i>' : i + 1}</div>
        <span class="step-label">${labels[i]}</span>
      </div>
      ${i < this.steps.length - 1 ? '<div class="step-line"></div>' : ''}
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderStep(container) {
    const data = App.state.bookingData;
    const flight = data.flight;

    switch (this.steps[this.currentStep]) {
      case 'flight':
        this.renderFlightSummary(container, flight, data);
        break;
      case 'passengers':
        this.renderPassengerForm(container, data);
        break;
      case 'seats':
        SeatMap.render(container, flight, data);
        break;
      case 'addons':
        this.renderAddons(container, data);
        break;
      case 'review':
        this.renderReview(container, data);
        break;
      case 'payment':
        Payment.render(container, data);
        break;
    }
  },

  renderFlightSummary(container, flight, data) {
    const airline = getAirline(flight.airlineId);
    const depAirport = getAirport(flight.departureAirport);
    const arrAirport = getAirport(flight.arrivalAirport);
    const price = flight.prices[data.cabin];

    container.innerHTML = `
      <div class="animate-fadeInUp">
        <h2 class="text-2xl font-bold mb-6">Flight Summary</h2>
        <div class="card mb-6">
          <div class="flight-card-main">
            <div class="flight-airline">
              <div class="airline-logo" style="border-color: ${airline?.color}">${airline?.shortCode}</div>
              <div>
                <div class="airline-name">${airline?.name}</div>
                <div class="flight-number">${flight.flightNumber}</div>
              </div>
            </div>
            <div class="flight-route">
              <div class="flight-time">
                <div class="flight-time-value">${formatTime(flight.departureTime)}</div>
                <div class="flight-time-code">${depAirport?.code}</div>
                <div class="text-xs text-muted mt-1">${depAirport?.city}</div>
              </div>
              <div class="flight-duration">
                <div class="flight-duration-time">${formatDuration(flight.duration)}</div>
                <div class="flight-duration-line"></div>
                <div class="flight-stops ${flight.stops === 0 ? 'direct' : ''}">${flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</div>
              </div>
              <div class="flight-time">
                <div class="flight-time-value">${formatTime(flight.arrivalTime)}</div>
                <div class="flight-time-code">${arrAirport?.code}</div>
                <div class="text-xs text-muted mt-1">${arrAirport?.city}</div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-sm text-secondary">Date:</span>
              <span class="font-semibold ml-2">${formatDate(flight.departureTime)}</span>
            </div>
            <div>
              <span class="text-sm text-secondary">Cabin:</span>
              <span class="badge badge-info ml-2">${data.cabin}</span>
            </div>
            <div>
              <span class="text-sm text-secondary">Passengers:</span>
              <span class="font-semibold ml-2">${data.passengers}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" onclick="App.navigate('search')"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back to Results</button>
          <button class="btn btn-primary" onclick="Booking.nextStep()">Continue <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderPassengerForm(container, data) {
    let html = '<div class="animate-fadeInUp"><h2 class="text-2xl font-bold mb-6">Passenger Information</h2>';

    for (let i = 0; i < data.passengers; i++) {
      const existing = data.passengerDetails[i] || {};
      html += `
        <div class="passenger-card">
          <div class="passenger-card-header">
            <div class="passenger-number">${i + 1}</div>
            <h3 class="font-semibold">Passenger ${i + 1} ${i === 0 ? '(Primary)' : ''}</h3>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input type="text" class="form-input passenger-field" data-idx="${i}" data-field="firstName" value="${existing.firstName || (i === 0 ? App.state.currentUser?.firstName || '' : '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input type="text" class="form-input passenger-field" data-idx="${i}" data-field="lastName" value="${existing.lastName || (i === 0 ? App.state.currentUser?.lastName || '' : '')}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-input passenger-field" data-idx="${i}" data-field="email" value="${existing.email || (i === 0 ? App.state.currentUser?.email || '' : '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input passenger-field" data-idx="${i}" data-field="phone" value="${existing.phone || (i === 0 ? App.state.currentUser?.phone || '' : '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Passport Number *</label>
              <input type="text" class="form-input passenger-field" data-idx="${i}" data-field="passport" value="${existing.passport || ''}" placeholder="e.g., AB1234567">
            </div>
            <div class="form-group">
              <label class="form-label">Nationality *</label>
              <input type="text" class="form-input passenger-field" data-idx="${i}" data-field="nationality" value="${existing.nationality || ''}" placeholder="e.g., Kenyan">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date of Birth *</label>
              <input type="date" class="form-input passenger-field" data-idx="${i}" data-field="dob" value="${existing.dob || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-input passenger-field" data-idx="${i}" data-field="gender">
                <option value="">Select</option>
                <option value="male" ${existing.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${existing.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="other" ${existing.gender === 'other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }

    html += `
      <div class="flex justify-between mt-6">
        <button class="btn btn-secondary" onclick="Booking.prevStep()"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>
        <button class="btn btn-primary" onclick="Booking.savePassengers()">Continue <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
      </div>
    </div>`;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  savePassengers() {
    const fields = document.querySelectorAll('.passenger-field');
    const passengers = [];

    fields.forEach(f => {
      const idx = parseInt(f.dataset.idx);
      if (!passengers[idx]) passengers[idx] = {};
      passengers[idx][f.dataset.field] = f.value;
    });

    // Validate
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName || !p.lastName || !p.passport || !p.nationality || !p.dob) {
        Toast.show('Error', `Please fill in all required fields for Passenger ${i + 1}.`, 'error');
        return;
      }
    }

    App.state.bookingData.passengerDetails = passengers;
    this.nextStep();
  },

  renderAddons(container, data) {
    const luggageOptions = [
      { id: 'bag-cabin', name: 'Cabin Bag', desc: '7kg carry-on', price: 0, icon: '🎒', selected: true },
      { id: 'bag-checked-20', name: 'Checked Bag 20kg', desc: 'Standard checked luggage', price: 35, icon: '🧳' },
      { id: 'bag-checked-30', name: 'Checked Bag 30kg', desc: 'Large checked luggage', price: 55, icon: '💼' },
      { id: 'bag-extra', name: 'Extra Bag', desc: 'Additional piece', price: 75, icon: '🛄' }
    ];

    const mealOptions = [
      { id: 'meal-standard', name: 'Standard Meal', desc: 'Complimentary airline meal', price: 0, icon: '🍽️', selected: true },
      { id: 'meal-vegetarian', name: 'Vegetarian', desc: 'Plant-based option', price: 12, icon: '🥗' },
      { id: 'meal-halal', name: 'Halal Meal', desc: 'Halal certified', price: 15, icon: '🍖' },
      { id: 'meal-kids', name: 'Kids Meal', desc: 'Child-friendly menu', price: 10, icon: '🍔' },
      { id: 'meal-premium', name: 'Premium Dining', desc: 'Chef-curated menu', price: 45, icon: '🥂' }
    ];

    container.innerHTML = `
      <div class="animate-fadeInUp">
        <h2 class="text-2xl font-bold mb-6">Add-ons & Extras</h2>

        <h3 class="text-lg font-semibold mb-4">🧳 Luggage</h3>
        <div class="addon-grid mb-8">
          ${luggageOptions.map(opt => `
            <div class="addon-card ${data.addons.luggage.includes(opt.id) || opt.selected ? 'selected' : ''}" data-addon-type="luggage" data-addon-id="${opt.id}" data-price="${opt.price}" onclick="Booking.toggleAddon(this, 'luggage', '${opt.id}', ${opt.price})">
              <div class="addon-icon">${opt.icon}</div>
              <div class="addon-name">${opt.name}</div>
              <div class="text-xs text-muted mb-2">${opt.desc}</div>
              <div class="addon-price">${opt.price === 0 ? 'Free' : formatPrice(opt.price)}</div>
            </div>
          `).join('')}
        </div>

        <h3 class="text-lg font-semibold mb-4">🍽️ Meal Preference</h3>
        <div class="addon-grid mb-8">
          ${mealOptions.map(opt => `
            <div class="addon-card ${data.addons.meals.includes(opt.id) || opt.selected ? 'selected' : ''}" data-addon-type="meal" data-addon-id="${opt.id}" data-price="${opt.price}" onclick="Booking.toggleAddon(this, 'meals', '${opt.id}', ${opt.price})">
              <div class="addon-icon">${opt.icon}</div>
              <div class="addon-name">${opt.name}</div>
              <div class="text-xs text-muted mb-2">${opt.desc}</div>
              <div class="addon-price">${opt.price === 0 ? 'Free' : formatPrice(opt.price)}</div>
            </div>
          `).join('')}
        </div>

        <div class="flex justify-between">
          <button class="btn btn-secondary" onclick="Booking.prevStep()"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>
          <button class="btn btn-primary" onclick="Booking.nextStep()">Continue <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  toggleAddon(el, type, id, price) {
    el.classList.toggle('selected');
    const addons = App.state.bookingData.addons;
    const idx = addons[type].indexOf(id);
    if (idx !== -1) {
      addons[type].splice(idx, 1);
    } else {
      addons[type].push(id);
    }
    this.renderSidebar(document.getElementById('booking-sidebar'));
  },

  renderReview(container, data) {
    const flight = data.flight;
    const airline = getAirline(flight.airlineId);
    const depAirport = getAirport(flight.departureAirport);
    const arrAirport = getAirport(flight.arrivalAirport);
    const totals = this.calculateTotals(data);

    container.innerHTML = `
      <div class="animate-fadeInUp">
        <h2 class="text-2xl font-bold mb-6">Review Your Booking</h2>

        <div class="card mb-4">
          <h3 class="card-title">✈️ Flight Details</h3>
          <div class="divider"></div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-secondary">${airline?.name} ${flight.flightNumber}</span>
            <span class="badge badge-info">${data.cabin}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold">${depAirport?.city} (${depAirport?.code}) → ${arrAirport?.city} (${arrAirport?.code})</span>
          </div>
          <div class="flex justify-between items-center text-sm text-secondary">
            <span>${formatDate(flight.departureTime)} · ${formatTime(flight.departureTime)} - ${formatTime(flight.arrivalTime)}</span>
            <span>${formatDuration(flight.duration)}</span>
          </div>
        </div>

        <div class="card mb-4">
          <h3 class="card-title">👥 Passengers</h3>
          <div class="divider"></div>
          ${data.passengerDetails.map((p, i) => `
            <div class="flex justify-between items-center ${i > 0 ? 'mt-3 pt-3' : ''}" ${i > 0 ? 'style="border-top:1px solid var(--border-subtle)"' : ''}>
              <div>
                <div class="font-semibold">${p.firstName} ${p.lastName}</div>
                <div class="text-xs text-muted">Passport: ${p.passport} · Seat: ${data.selectedSeats[i] || 'Auto-assign'}</div>
              </div>
              <span class="badge badge-neutral">Passenger ${i + 1}</span>
            </div>
          `).join('')}
        </div>

        <div class="card mb-4">
          <h3 class="card-title">💰 Price Breakdown</h3>
          <div class="divider"></div>
          <div class="flex justify-between mb-2 text-sm">
            <span class="text-secondary">Base fare (${data.passengers} × ${formatPrice(flight.prices[data.cabin])})</span>
            <span>${formatPrice(totals.baseFare)}</span>
          </div>
          <div class="flex justify-between mb-2 text-sm">
            <span class="text-secondary">Taxes & fees</span>
            <span>${formatPrice(totals.taxes)}</span>
          </div>
          ${totals.addonsTotal > 0 ? `
          <div class="flex justify-between mb-2 text-sm">
            <span class="text-secondary">Add-ons</span>
            <span>${formatPrice(totals.addonsTotal)}</span>
          </div>` : ''}
          ${totals.seatTotal > 0 ? `
          <div class="flex justify-between mb-2 text-sm">
            <span class="text-secondary">Seat selection</span>
            <span>${formatPrice(totals.seatTotal)}</span>
          </div>` : ''}
          ${data.promoDiscount > 0 ? `
          <div class="flex justify-between mb-2 text-sm text-success">
            <span>Promo discount (${data.promoCode})</span>
            <span>-${formatPrice(data.promoDiscount)}</span>
          </div>` : ''}
          <div class="divider"></div>
          <div class="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span class="text-gradient">${formatPrice(totals.total)}</span>
          </div>
        </div>

        <!-- Promo Code -->
        <div class="card mb-6">
          <h3 class="card-title">🏷️ Promo Code</h3>
          <div class="divider"></div>
          <div class="flex gap-3">
            <input type="text" id="promo-input" class="form-input" placeholder="Enter promo code" value="${data.promoCode || ''}">
            <button class="btn btn-secondary" onclick="Booking.applyPromo()">Apply</button>
          </div>
          ${data.promoCode ? `<div class="text-sm text-success mt-2">✓ Code "${data.promoCode}" applied — ${formatPrice(data.promoDiscount)} off!</div>` : ''}
        </div>

        <div class="flex justify-between">
          <button class="btn btn-secondary" onclick="Booking.prevStep()"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>
          <button class="btn btn-primary btn-lg" onclick="Booking.nextStep()">Proceed to Payment <i data-lucide="credit-card" style="width:16px;height:16px"></i></button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  applyPromo() {
    const code = document.getElementById('promo-input')?.value.trim().toUpperCase();
    if (!code) return;

    const promos = DB.getAll('promoCodes');
    const promo = promos.find(p => p.code === code && p.active);

    if (!promo) {
      Toast.show('Invalid Code', 'This promo code is not valid.', 'error');
      return;
    }

    const totals = this.calculateTotals(App.state.bookingData);
    if (totals.baseFare < promo.minPurchase) {
      Toast.show('Minimum Not Met', `Minimum purchase of ${formatPrice(promo.minPurchase)} required.`, 'warning');
      return;
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = Math.round(totals.subtotal * promo.discount / 100);
    } else {
      discount = promo.discount;
    }

    App.state.bookingData.promoCode = code;
    App.state.bookingData.promoDiscount = discount;

    Toast.show('Promo Applied!', `${promo.description} — Save ${formatPrice(discount)}!`, 'success');
    this.renderStep(document.getElementById('booking-content'));
    this.renderSidebar(document.getElementById('booking-sidebar'));
  },

  calculateTotals(data) {
    const flight = data.flight;
    const baseFare = flight.prices[data.cabin] * data.passengers;
    const taxes = Math.round(baseFare * 0.12);

    // Calculate addon costs
    const addonPrices = { 'bag-checked-20': 35, 'bag-checked-30': 55, 'bag-extra': 75, 'meal-vegetarian': 12, 'meal-halal': 15, 'meal-kids': 10, 'meal-premium': 45 };
    let addonsTotal = 0;
    [...(data.addons.luggage || []), ...(data.addons.meals || [])].forEach(id => {
      addonsTotal += (addonPrices[id] || 0) * data.passengers;
    });

    // Seat selection cost (premium seats)
    let seatTotal = 0;
    (data.selectedSeats || []).forEach(seat => {
      if (seat && seat.includes('premium')) seatTotal += 25;
    });

    const subtotal = baseFare + taxes + addonsTotal + seatTotal;
    const total = Math.max(0, subtotal - (data.promoDiscount || 0));

    return { baseFare, taxes, addonsTotal, seatTotal, subtotal, total };
  },

  renderSidebar(sidebar) {
    if (!sidebar) return;
    const data = App.state.bookingData;
    if (!data.flight) return;

    const flight = data.flight;
    const airline = getAirline(flight.airlineId);
    const depAirport = getAirport(flight.departureAirport);
    const arrAirport = getAirport(flight.arrivalAirport);
    const totals = this.calculateTotals(data);

    sidebar.innerHTML = `
      <div class="booking-summary-sidebar">
        <h3 class="card-title mb-4">Booking Summary</h3>
        <div class="flex items-center gap-3 mb-4">
          <div class="airline-logo" style="border-color:${airline?.color}">${airline?.shortCode}</div>
          <div>
            <div class="font-semibold text-sm">${airline?.name}</div>
            <div class="text-xs text-muted">${flight.flightNumber}</div>
          </div>
        </div>
        <div class="flex justify-between mb-2 text-sm">
          <span class="text-muted">${depAirport?.code}</span>
          <span class="text-muted">→</span>
          <span class="text-muted">${arrAirport?.code}</span>
        </div>
        <div class="text-xs text-muted mb-4">${formatDate(flight.departureTime)} · ${formatTime(flight.departureTime)}</div>
        <div class="divider"></div>
        <div class="flex justify-between mb-2 text-sm">
          <span class="text-secondary">Cabin</span>
          <span class="font-medium">${data.cabin}</span>
        </div>
        <div class="flex justify-between mb-2 text-sm">
          <span class="text-secondary">Passengers</span>
          <span class="font-medium">${data.passengers}</span>
        </div>
        <div class="flex justify-between mb-2 text-sm">
          <span class="text-secondary">Base fare</span>
          <span>${formatPrice(totals.baseFare)}</span>
        </div>
        <div class="flex justify-between mb-2 text-sm">
          <span class="text-secondary">Taxes</span>
          <span>${formatPrice(totals.taxes)}</span>
        </div>
        ${totals.addonsTotal > 0 ? `<div class="flex justify-between mb-2 text-sm"><span class="text-secondary">Add-ons</span><span>${formatPrice(totals.addonsTotal)}</span></div>` : ''}
        ${data.promoDiscount > 0 ? `<div class="flex justify-between mb-2 text-sm text-success"><span>Discount</span><span>-${formatPrice(data.promoDiscount)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span class="text-gradient">${formatPrice(totals.total)}</span>
        </div>
      </div>
    `;
  },

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.renderBooking();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.renderBooking();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};
