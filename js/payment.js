/* =============================================
   SKYVOYAGE — Payment & Confirmation Module
   ============================================= */

const Payment = {
  render(container, data) {
    const totals = Booking.calculateTotals(data);

    container.innerHTML = `
      <div class="animate-fadeInUp">
        <h2 class="text-2xl font-bold mb-6">Payment</h2>
        <p class="text-secondary mb-6">Total amount to pay: <strong class="text-gradient text-xl">${formatPrice(totals.total)}</strong></p>

        <div class="payment-methods">
          <div class="payment-method selected" data-method="card" onclick="Payment.selectMethod('card', this)">
            <div class="payment-method-icon">💳</div>
            <div class="payment-method-name">Credit/Debit Card</div>
          </div>
          <div class="payment-method" data-method="mpesa" onclick="Payment.selectMethod('mpesa', this)">
            <div class="payment-method-icon">📱</div>
            <div class="payment-method-name">Mobile Money (M-Pesa)</div>
          </div>
          <div class="payment-method" data-method="paypal" onclick="Payment.selectMethod('paypal', this)">
            <div class="payment-method-icon">🅿️</div>
            <div class="payment-method-name">PayPal</div>
          </div>
        </div>

        <div id="payment-form-container">
          ${this.getCardForm()}
        </div>

        <div class="flex justify-between mt-8">
          <button class="btn btn-secondary" onclick="Booking.prevStep()"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>
          <button class="btn btn-primary btn-lg" id="btn-pay" onclick="Payment.processPayment()">
            Pay ${formatPrice(totals.total)} <i data-lucide="lock" style="width:16px;height:16px"></i>
          </button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.setupCardFormatters();
  },

  selectMethod(method, el) {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');

    const container = document.getElementById('payment-form-container');
    if (method === 'card') {
      container.innerHTML = this.getCardForm();
      this.setupCardFormatters();
    } else if (method === 'mpesa') {
      container.innerHTML = `
        <div class="card max-w-md mx-auto">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📱</div>
            <h3 class="font-bold text-lg">M-Pesa Express</h3>
            <p class="text-sm text-secondary">Enter your M-Pesa registered phone number. A prompt will be sent to your phone.</p>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <div class="input-icon-wrapper">
              <i data-lucide="phone" class="input-icon"></i>
              <input type="tel" id="mpesa-phone" class="form-input" placeholder="e.g. 0712345678" value="${App.state.currentUser?.phone || ''}">
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card max-w-md mx-auto text-center py-8">
          <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🅿️</div>
          <h3 class="font-bold text-lg mb-2">Pay with PayPal</h3>
          <p class="text-sm text-secondary mb-6">You will be redirected to PayPal to complete your secure transaction.</p>
          <p class="text-xs text-muted italic">Simulation: Clicking Pay will auto-complete.</p>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  getCardForm() {
    return `
      <div class="credit-card-visual mb-8">
        <div class="flex justify-between items-start">
          <div class="cc-chip"></div>
          <div class="text-xl font-bold italic" id="cc-type-display">VISA</div>
        </div>
        <div class="cc-number" id="cc-number-display">•••• •••• •••• ••••</div>
        <div class="cc-info">
          <div>
            <div class="cc-label">Card Holder</div>
            <div class="cc-value truncate w-32" id="cc-name-display">${App.state.currentUser?.firstName || 'JOHN'} ${App.state.currentUser?.lastName || 'DOE'}</div>
          </div>
          <div>
            <div class="cc-label">Expires</div>
            <div class="cc-value" id="cc-expiry-display">MM/YY</div>
          </div>
        </div>
      </div>
      
      <div class="card max-w-lg mx-auto">
        <div class="form-group">
          <label class="form-label">Name on Card</label>
          <input type="text" id="cc-name" class="form-input" placeholder="e.g. JOHN DOE" value="${App.state.currentUser?.firstName || ''} ${App.state.currentUser?.lastName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Card Number</label>
          <div class="input-icon-wrapper">
            <i data-lucide="credit-card" class="input-icon"></i>
            <input type="text" id="cc-number" class="form-input" placeholder="0000 0000 0000 0000" maxlength="19">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="text" id="cc-expiry" class="form-input" placeholder="MM/YY" maxlength="5">
          </div>
          <div class="form-group">
            <label class="form-label">CVV</label>
            <input type="password" id="cc-cvv" class="form-input" placeholder="123" maxlength="4">
          </div>
        </div>
      </div>
    `;
  },

  setupCardFormatters() {
    const numInput = document.getElementById('cc-number');
    const nameInput = document.getElementById('cc-name');
    const expInput = document.getElementById('cc-expiry');

    if (numInput) {
      numInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = '';
        for (let i = 0; i < val.length; i++) {
          if (i > 0 && i % 4 === 0) formatted += ' ';
          formatted += val[i];
        }
        e.target.value = formatted;
        document.getElementById('cc-number-display').textContent = formatted || '•••• •••• •••• ••••';
        
        const typeEl = document.getElementById('cc-type-display');
        if (val.startsWith('4')) typeEl.textContent = 'VISA';
        else if (val.startsWith('5')) typeEl.textContent = 'MC';
        else if (val.startsWith('3')) typeEl.textContent = 'AMEX';
        else typeEl.textContent = 'CARD';
      });
    }

    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        document.getElementById('cc-name-display').textContent = e.target.value.toUpperCase() || 'NAME ON CARD';
      });
    }

    if (expInput) {
      expInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
        e.target.value = val;
        document.getElementById('cc-expiry-display').textContent = val || 'MM/YY';
      });
    }
  },

  processPayment() {
    const method = document.querySelector('.payment-method.selected').dataset.method;
    
    // Basic validation based on method
    if (method === 'card') {
      if (!document.getElementById('cc-number').value || !document.getElementById('cc-expiry').value || !document.getElementById('cc-cvv').value) {
        Toast.show('Error', 'Please fill in all card details.', 'error');
        return;
      }
    } else if (method === 'mpesa') {
      if (!document.getElementById('mpesa-phone').value) {
        Toast.show('Error', 'Please enter your phone number.', 'error');
        return;
      }
    }

    const btn = document.getElementById('btn-pay');
    btn.innerHTML = '<div class="spinner border-white"></div> Processing...';
    btn.disabled = true;

    // Simulate network delay
    setTimeout(() => {
      this.finalizeBooking(method);
    }, 2500);
  },

  finalizeBooking(paymentMethod) {
    const data = App.state.bookingData;
    const totals = Booking.calculateTotals(data);
    const pnr = DB.generatePNR();

    // Auto-assign remaining seats if needed
    for (let i = 0; i < data.passengers; i++) {
      if (!data.selectedSeats[i]) {
        // Find first available seat string for simplicity in demo
        data.selectedSeats[i] = 'AUTO-' + (i+1);
      }
    }

    const booking = {
      id: DB.generateId(),
      pnr: pnr,
      userId: App.state.currentUser.id,
      flightId: data.flight.id,
      flightNumber: data.flight.flightNumber,
      departureAirport: data.flight.departureAirport,
      arrivalAirport: data.flight.arrivalAirport,
      departureTime: data.flight.departureTime,
      arrivalTime: data.flight.arrivalTime,
      cabin: data.cabin,
      passengers: data.passengers,
      passengerDetails: data.passengerDetails,
      selectedSeats: data.selectedSeats,
      addons: data.addons,
      totals: totals,
      paymentMethod: paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Update DB
    DB.add('bookings', booking);
    
    // Update flight seats
    const flight = data.flight;
    flight.availableSeats -= data.passengers;
    DB.update('flights', flight.id, flight);

    // Send notification
    Notifications.add({
      userId: App.state.currentUser.id,
      type: 'booking',
      title: 'Booking Confirmed!',
      message: `Your flight ${flight.flightNumber} to ${flight.arrivalAirport} is confirmed. PNR: ${pnr}`,
      icon: 'check-circle'
    });

    // Clear booking state
    App.state.bookingData = null;
    
    // Show confirmation
    this.renderConfirmation(booking);
  },

  renderConfirmation(booking) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const confirmPage = document.getElementById('page-confirmation');
    confirmPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const container = document.getElementById('confirmation-content');
    if (!container) return;

    container.innerHTML = `
      <div class="confirmation-icon"><i data-lucide="check" style="width:48px;height:48px"></i></div>
      <h2 class="text-4xl font-bold mb-2">Payment Successful!</h2>
      <p class="text-secondary mb-6">Your booking has been confirmed and your e-ticket has been sent to your email.</p>
      
      <div class="text-sm text-muted uppercase tracking-wider mb-2">Booking Reference (PNR)</div>
      <div class="confirmation-pnr">${booking.pnr}</div>
      
      <p class="text-sm text-secondary mt-4 mb-8">Please save this reference number. You will need it for check-in.</p>
      
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <button class="btn btn-secondary btn-lg" onclick="App.navigate('dashboard')">
          <i data-lucide="layout-dashboard"></i> Go to Dashboard
        </button>
        <button class="btn btn-primary btn-lg" onclick="CheckIn.generateTicket('${booking.id}')">
          <i data-lucide="download"></i> Download E-Ticket
        </button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};
