/* =============================================
   SKYVOYAGE — Check-in & Boarding Pass Module
   ============================================= */

const CheckIn = {
  init() {
    this.setupCheckInForm();
  },

  setupCheckInForm() {
    const form = document.getElementById('checkin-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pnr = document.getElementById('checkin-pnr').value.trim().toUpperCase();
      const lastName = document.getElementById('checkin-lastname').value.trim().toLowerCase();

      if (!pnr || !lastName) {
        Toast.show('Error', 'Please enter both PNR and Last Name.', 'error');
        return;
      }

      this.processCheckIn(pnr, lastName);
    });
  },

  processCheckIn(pnr, lastName) {
    const bookings = DB.getAll('bookings');
    const booking = bookings.find(b => b.pnr === pnr);

    if (!booking) {
      Toast.show('Not Found', 'We could not find a booking with this PNR.', 'error');
      return;
    }

    // Verify last name (check primary passenger)
    const primaryLast = booking.passengerDetails[0].lastName.toLowerCase();
    if (primaryLast !== lastName) {
      Toast.show('Error', 'Last name does not match our records for this booking.', 'error');
      return;
    }

    // Check if within 24h (Simulated check)
    // For demo purposes, we allow check-in anytime if flight is confirmed
    if (booking.status === 'cancelled') {
      Toast.show('Error', 'This booking has been cancelled.', 'error');
      return;
    }

    this.renderCheckInFlow(booking);
  },

  renderCheckInFlow(booking) {
    const container = document.getElementById('checkin-content');
    if (!container) return;

    const flight = DB.getAll('flights').find(f => f.id === booking.flightId) || booking;
    const airline = getAirline(flight.airlineId);
    const dep = getAirport(flight.departureAirport);
    const arr = getAirport(flight.arrivalAirport);

    // If already checked in
    if (booking.checkedIn) {
      this.renderBoardingPasses(booking, container);
      return;
    }

    container.innerHTML = `
      <div class="animate-fadeInUp max-w-2xl mx-auto">
        <h2 class="text-3xl font-bold mb-6 text-center">Online Check-in</h2>
        
        <div class="card mb-6">
          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
             <div class="airline-logo" style="border-color:${airline?.color}">${airline?.shortCode}</div>
             <div>
               <div class="font-bold text-lg">${dep?.city} to ${arr?.city}</div>
               <div class="text-sm text-secondary">${airline?.name} ${flight.flightNumber} · ${formatDate(flight.departureTime)}</div>
             </div>
          </div>

          <h3 class="font-semibold mb-3">Passengers</h3>
          <div class="space-y-3 mb-6">
            ${booking.passengerDetails.map((p, i) => `
              <div class="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div class="flex items-center gap-3">
                  <input type="checkbox" id="check-${i}" class="w-5 h-5 accent-cyan-500" checked>
                  <label for="check-${i}" class="font-medium">${p.firstName} ${p.lastName}</label>
                </div>
                <div class="text-sm text-secondary">
                  Seat: <span class="font-bold text-white">${booking.selectedSeats[i]?.replace('-premium','') || 'Unassigned'}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6 flex gap-3 text-sm">
            <i data-lucide="info" class="text-blue-400 shrink-0"></i>
            <div>
              <p class="font-semibold text-blue-400 mb-1">Hazardous Materials Notice</p>
              <p class="text-gray-300">By checking in, you confirm that you are not carrying any restricted items such as explosives, flammable liquids, or toxic substances in your baggage.</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-8">
            <button class="btn btn-primary btn-lg" onclick="CheckIn.confirmCheckIn('${booking.id}')">
              Agree & Check In <i data-lucide="check-circle" class="ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  confirmCheckIn(bookingId) {
    const booking = DB.find('bookings', bookingId);
    if (!booking) return;

    booking.checkedIn = true;
    booking.status = 'checked-in';
    DB.update('bookings', bookingId, booking);

    Toast.show('Check-in Complete!', 'Your boarding passes are ready.', 'success');
    
    // Add notification
    Notifications.add({
      userId: booking.userId,
      type: 'checkin',
      title: 'Checked In Successfully',
      message: `You are checked in for flight ${booking.flightNumber}. Have a great trip!`,
      icon: 'check-circle'
    });

    this.renderBoardingPasses(booking, document.getElementById('checkin-content'));
  },

  renderBoardingPasses(booking, container) {
    const flight = DB.getAll('flights').find(f => f.id === booking.flightId) || booking;
    const airline = getAirline(flight.airlineId);
    const dep = getAirport(flight.departureAirport);
    const arr = getAirport(flight.arrivalAirport);
    const bDate = new Date(flight.departureTime);
    // Boarding is usually 45 mins before departure
    const boardingTime = new Date(bDate.getTime() - 45*60000);

    let html = `
      <div class="animate-fadeInUp max-w-3xl mx-auto">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <i data-lucide="check" style="width:32px;height:32px"></i>
          </div>
          <h2 class="text-3xl font-bold mb-2">You're Checked In!</h2>
          <p class="text-secondary">Your boarding passes are ready. You can print them or save them to your device.</p>
        </div>
        
        <div class="flex justify-center gap-4 mb-8">
          <button class="btn btn-secondary" onclick="window.print()">
            <i data-lucide="printer" class="mr-2"></i> Print All
          </button>
          <button class="btn btn-primary" onclick="App.navigate('dashboard')">
            Done
          </button>
        </div>

        <div class="space-y-8">
    `;

    booking.passengerDetails.forEach((p, i) => {
      const seat = booking.selectedSeats[i]?.replace('-premium','') || 'TBA';
      const qrcodeId = `qrcode-${booking.id}-${i}`;
      // Data to encode in QR (simplified standard BCBP format)
      const qrData = `M1${p.lastName}/${p.firstName} ${booking.pnr} ${dep.code}${arr.code}${airline.code} ${flight.flightNumber.replace(/\D/g, '')} ${bDate.getDate().toString().padStart(3,'0')} ${seat}`;

      html += `
        <div class="boarding-pass">
          <div class="boarding-pass-header" style="background: ${airline?.color || 'var(--gradient-primary)'}">
            <div class="boarding-pass-airline">${airline?.name}</div>
            <div class="boarding-pass-class">${booking.cabin}</div>
          </div>
          
          <div class="boarding-pass-body">
            <div class="flex justify-between items-end mb-6">
              <div>
                <div class="text-xs text-muted uppercase tracking-wider mb-1">Passenger</div>
                <div class="font-bold text-lg">${p.firstName} ${p.lastName}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-muted uppercase tracking-wider mb-1">Flight</div>
                <div class="font-bold text-lg">${flight.flightNumber}</div>
              </div>
            </div>

            <div class="boarding-pass-route">
              <div class="boarding-pass-city">
                <div class="boarding-pass-code">${dep.code}</div>
                <div class="boarding-pass-city-name">${dep.city}</div>
              </div>
              <div class="boarding-pass-plane">✈</div>
              <div class="boarding-pass-city">
                <div class="boarding-pass-code">${arr.code}</div>
                <div class="boarding-pass-city-name">${arr.city}</div>
              </div>
            </div>

            <div class="boarding-pass-details">
              <div class="boarding-pass-detail">
                <label>Date</label>
                <span>${formatDate(flight.departureTime)}</span>
              </div>
              <div class="boarding-pass-detail">
                <label>Boarding Time</label>
                <span class="text-red-500">${formatTime(boardingTime.toISOString())}</span>
              </div>
              <div class="boarding-pass-detail text-right">
                <label>Departure</label>
                <span>${formatTime(flight.departureTime)}</span>
              </div>
              
              <div class="boarding-pass-detail">
                <label>Terminal</label>
                <span>T${flight.terminal || 1}</span>
              </div>
              <div class="boarding-pass-detail">
                <label>Gate</label>
                <span>${flight.gate || 'TBA'}</span>
              </div>
              <div class="boarding-pass-detail text-right">
                <label>Seat</label>
                <span class="text-xl">${seat}</span>
              </div>
            </div>

            <div class="boarding-pass-qr">
              <div id="${qrcodeId}" data-qr="${qrData}"></div>
            </div>
            
            <div class="text-center text-xs text-muted mt-2">PNR: <strong class="text-white">${booking.pnr}</strong></div>
          </div>
          
          <div class="boarding-pass-footer">
            Gate closes 20 minutes before departure. Please ensure you have valid travel documents.
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Generate actual QR codes using qrcode.js if available
    setTimeout(() => {
      if (typeof QRCode !== 'undefined') {
        booking.passengerDetails.forEach((p, i) => {
          const el = document.getElementById(`qrcode-${booking.id}-${i}`);
          if (el) {
            new QRCode(el, {
              text: el.dataset.qr,
              width: 120,
              height: 120,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.L
            });
          }
        });
      } else {
        // Fallback fake QR
        booking.passengerDetails.forEach((p, i) => {
          const el = document.getElementById(`qrcode-${booking.id}-${i}`);
          if (el) {
            el.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(el.dataset.qr)}" alt="QR Code">`;
          }
        });
      }
    }, 100);
  },

  generateTicket(bookingId) {
    const booking = DB.find('bookings', bookingId);
    if (!booking) return;
    
    // Simulate PDF generation/download
    Toast.show('Generating Ticket', 'Your E-ticket is being generated...', 'info');
    setTimeout(() => {
      Toast.show('Success', 'E-ticket downloaded successfully.', 'success');
    }, 1500);
  }
};
