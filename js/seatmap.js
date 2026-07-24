/* =============================================
   SKYVOYAGE — Visual Seat Map Module
   ============================================= */

const SeatMap = {
  render(container, flight, data) {
    const aircraft = getAircraft(flight.aircraftId);
    if (!aircraft) {
      container.innerHTML = '<div class="error">Aircraft configuration not found.</div>';
      return;
    }

    const { economy, premiumEconomy, business, first } = aircraft.seatConfig;
    const config = this.parseColumns(aircraft.columns);

    // Simulate reserved seats based on available seats
    const totalSeats = flight.totalSeats;
    const reservedCount = totalSeats - flight.availableSeats;
    const reservedSeats = this.generateSimulatedReservations(totalSeats, reservedCount, data.selectedSeats);

    container.innerHTML = `
      <div class="animate-fadeInUp">
        <h2 class="text-2xl font-bold mb-2">Select Your Seats</h2>
        <p class="text-secondary mb-6">Passenger ${data.selectedSeats.length < data.passengers ? data.selectedSeats.length + 1 : data.passengers} of ${data.passengers}</p>

        <div class="seatmap-container">
          <div class="seatmap-legend">
            <div class="seatmap-legend-item"><div class="seatmap-legend-color bg-gray-600"></div> Available</div>
            <div class="seatmap-legend-item"><div class="seatmap-legend-color" style="background:rgba(239, 68, 68, 0.3)"></div> Reserved</div>
            <div class="seatmap-legend-item"><div class="seatmap-legend-color" style="background:rgba(6, 182, 212, 0.4)"></div> Selected</div>
            <div class="seatmap-legend-item"><div class="seatmap-legend-color" style="background:rgba(245, 158, 11, 0.4)"></div> Premium (+25$)</div>
          </div>

          <div class="aircraft-body">
            <div class="aircraft-nose"></div>
            
            ${this.renderCabinSection('First Class', first, config, 1, 'first', reservedSeats, data)}
            ${this.renderCabinSection('Business Class', business, config, Math.ceil(first / config.totalColumns) + 1, 'business', reservedSeats, data)}
            ${this.renderCabinSection('Premium Economy', premiumEconomy, config, Math.ceil((first + business) / config.totalColumns) + 1, 'premiumEconomy', reservedSeats, data)}
            ${this.renderCabinSection('Economy Class', economy, config, Math.ceil((first + business + premiumEconomy) / config.totalColumns) + 1, 'economy', reservedSeats, data)}
          </div>
        </div>

        <div class="flex justify-between mt-8">
          <button class="btn btn-secondary" onclick="Booking.prevStep()"><i data-lucide="arrow-left" style="width:16px;height:16px"></i> Back</button>
          <button class="btn btn-primary" onclick="SeatMap.confirmSelection()">Continue <i data-lucide="arrow-right" style="width:16px;height:16px"></i></button>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  parseColumns(colStr) {
    const parts = colStr.split(' ');
    let totalCols = 0;
    const blocks = [];
    parts.forEach(p => {
      totalCols += p.length;
      blocks.push(p);
    });
    return { blocks, totalColumns: totalCols };
  },

  generateSimulatedReservations(total, reservedCount, currentlySelected) {
    const reserved = new Set();
    while (reserved.size < reservedCount) {
      // Simple hash to generate consistent "random" seats based on total seats
      const r = Math.floor(Math.random() * total);
      // Map to generic seat ID roughly
      const row = Math.floor(r / 6) + 1;
      const col = String.fromCharCode(65 + (r % 6));
      const seatId = `${row}${col}`;
      if (!currentlySelected.includes(seatId)) {
        reserved.add(seatId);
      }
    }
    return Array.from(reserved);
  },

  renderCabinSection(title, seatCount, config, startRow, cabinClass, reservedSeats, data) {
    if (seatCount <= 0) return '';
    if (data.cabin !== 'economy' && cabinClass === 'economy' && data.cabin !== cabinClass) return '';
    // Simplify mapping: restrict selections to booked cabin, but show others as reserved for visual effect,
    // unless they booked economy in which case let them see premium economy as an upsell (simplified logic)

    const rows = Math.ceil(seatCount / config.totalColumns);
    let html = `
      <div class="cabin-section">
        <div class="cabin-label">${title}</div>
        
        <div class="seat-column-labels">
          <div style="width:20px"></div>
          ${config.blocks.map((block, bIdx) => `
            ${block.split('').map(char => `<div class="seat-column-label">${char}</div>`).join('')}
            ${bIdx < config.blocks.length - 1 ? '<div class="seat-aisle"></div>' : ''}
          `).join('')}
        </div>
    `;

    for (let r = 0; r < rows; r++) {
      const rowNum = startRow + r;
      if (rowNum === startRow + Math.floor(rows / 2) && rows > 5) {
         html += `<div class="exit-row-marker">EXIT ROW</div>`;
      }

      html += `<div class="seat-row">
        <div class="seat-row-number">${rowNum}</div>`;
      
      let colOffset = 0;
      config.blocks.forEach((block, bIdx) => {
        block.split('').forEach(char => {
          const seatId = `${rowNum}${char}`;
          const isReserved = reservedSeats.includes(seatId) || (data.cabin !== cabinClass && data.cabin !== 'economy');
          const isSelected = data.selectedSeats.includes(seatId);
          const isPremium = cabinClass === 'premiumEconomy' || (cabinClass === 'economy' && (char === 'A' || char === 'F' || rowNum === startRow)); // Fake premium seats
          
          let classes = 'seat ';
          if (isSelected) classes += 'selected';
          else if (isReserved) classes += 'reserved';
          else {
            classes += 'available ';
            if (isPremium) classes += 'premium';
          }

          html += `<div class="${classes}" 
                        ${!isReserved ? `onclick="SeatMap.toggleSeat('${seatId}', ${isPremium})"` : ''}
                        data-tooltip="Seat ${seatId} ${isPremium ? '(Premium +$25)' : ''}">
                    ${isSelected ? '✓' : ''}
                   </div>`;
        });
        if (bIdx < config.blocks.length - 1) {
          html += `<div class="seat-aisle"></div>`;
        }
      });
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  },

  toggleSeat(seatId, isPremium) {
    const data = App.state.bookingData;
    const max = data.passengers;
    const idx = data.selectedSeats.indexOf(seatId);

    if (idx !== -1) {
      // Remove
      data.selectedSeats.splice(idx, 1);
    } else {
      // Add
      if (data.selectedSeats.length >= max) {
        // Replace last selected
        data.selectedSeats.pop();
      }
      data.selectedSeats.push(seatId + (isPremium ? '-premium' : '')); // store premium flag implicitly
    }

    Booking.renderStep(document.getElementById('booking-content'));
    Booking.renderSidebar(document.getElementById('booking-sidebar'));
  },

  confirmSelection() {
    const data = App.state.bookingData;
    if (data.selectedSeats.length < data.passengers) {
      const remaining = data.passengers - data.selectedSeats.length;
      Toast.show('Seats Pending', `Please select ${remaining} more seat${remaining > 1 ? 's' : ''} or they will be auto-assigned.`, 'warning');
      // For UX, we allow continuing but warn them.
    }
    Booking.nextStep();
  }
};
