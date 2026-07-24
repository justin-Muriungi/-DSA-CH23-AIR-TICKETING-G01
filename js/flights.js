/* =============================================
   SKYVOYAGE — Flight Search & Results
   ============================================= */

const Flights = {
  searchParams: {},
  results: [],
  sortBy: 'price',
  filters: {
    maxPrice: Infinity,
    stops: 'any',
    airlines: [],
    timeRange: 'any'
  },

  initHomePage() {
    this.setupSearchForm();
    this.renderPopularDestinations();
    this.setupAutocomplete('search-from', 'from-list');
    this.setupAutocomplete('search-to', 'to-list');
  },

  setupSearchForm() {
    const form = document.getElementById('flight-search-form');
    if (!form) return;

    // Trip type toggle
    document.querySelectorAll('.search-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.search-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        const returnField = document.getElementById('return-date-field');
        const multiCity = document.getElementById('multi-city-fields');
        if (returnField) returnField.style.display = type === 'one-way' ? 'none' : (type === 'multi-city' ? 'none' : '');
        if (multiCity) multiCity.style.display = type === 'multi-city' ? 'block' : 'none';
      });
    });

    // Swap button
    const swapBtn = document.getElementById('swap-airports');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const fromInput = document.getElementById('search-from');
        const toInput = document.getElementById('search-to');
        const temp = fromInput.value;
        fromInput.value = toInput.value;
        toInput.value = temp;
      });
    }

    // Set min dates
    const today = new Date().toISOString().split('T')[0];
    const depDate = document.getElementById('search-dep-date');
    const retDate = document.getElementById('search-ret-date');
    if (depDate) { depDate.min = today; depDate.value = today; }
    if (retDate) { retDate.min = today; }

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.performSearch();
    });
  },

  setupAutocomplete(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input || !list) return;

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (query.length < 1) { list.classList.remove('show'); return; }

      const airports = DB.getAll('airports');
      const matches = airports.filter(a =>
        a.city.toLowerCase().includes(query) ||
        a.code.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.country.toLowerCase().includes(query)
      ).slice(0, 8);

      if (matches.length === 0) { list.classList.remove('show'); return; }

      list.innerHTML = matches.map(a => `
        <div class="autocomplete-item" data-code="${a.code}" data-city="${a.city}">
          <span class="airport-code">${a.code}</span>
          <div>
            <div class="airport-name">${a.city}</div>
            <div class="airport-city">${a.name}, ${a.country}</div>
          </div>
        </div>
      `).join('');

      list.classList.add('show');

      list.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          input.value = `${item.dataset.city} (${item.dataset.code})`;
          input.dataset.code = item.dataset.code;
          list.classList.remove('show');
        });
      });
    });

    input.addEventListener('blur', () => {
      setTimeout(() => list.classList.remove('show'), 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.length > 0) input.dispatchEvent(new Event('input'));
    });
  },

  performSearch() {
    const fromInput = document.getElementById('search-from');
    const toInput = document.getElementById('search-to');
    const depDate = document.getElementById('search-dep-date')?.value;
    const passengers = document.getElementById('search-passengers')?.value || 1;
    const cabin = document.getElementById('search-cabin')?.value || 'economy';

    const fromCode = fromInput?.dataset.code || this.extractCode(fromInput?.value);
    const toCode = toInput?.dataset.code || this.extractCode(toInput?.value);

    if (!fromCode || !toCode) {
      Toast.show('Error', 'Please select departure and destination cities.', 'error');
      return;
    }

    if (!depDate) {
      Toast.show('Error', 'Please select a departure date.', 'error');
      return;
    }

    this.searchParams = { from: fromCode, to: toCode, date: depDate, passengers: parseInt(passengers), cabin };

    const allFlights = DB.getAll('flights');
    const searchDate = new Date(depDate);

    this.results = allFlights.filter(f => {
      const flightDate = new Date(f.departureTime);
      return f.departureAirport === fromCode &&
             f.arrivalAirport === toCode &&
             flightDate.toDateString() === searchDate.toDateString() &&
             f.availableSeats >= parseInt(passengers);
    });

    // If no results on exact date, search nearby dates
    if (this.results.length === 0) {
      this.results = allFlights.filter(f => {
        const flightDate = new Date(f.departureTime);
        const dayDiff = Math.abs((flightDate - searchDate) / 86400000);
        return f.departureAirport === fromCode &&
               f.arrivalAirport === toCode &&
               dayDiff <= 3 &&
               f.availableSeats >= parseInt(passengers);
      });
    }

    App.state.searchResults = this.results;
    App.navigate('search');
  },

  extractCode(value) {
    if (!value) return null;
    const match = value.match(/\(([A-Z]{3})\)/);
    if (match) return match[1];

    const query = value.toLowerCase().trim();
    const airports = DB.getAll('airports');
    const airport = airports.find(a => 
      a.code.toLowerCase() === query || 
      a.city.toLowerCase() === query || 
      a.name.toLowerCase() === query ||
      a.city.toLowerCase().includes(query)
    );
    return airport ? airport.code : null;
  },

  renderResults() {
    const container = document.getElementById('results-list');
    const summaryEl = document.getElementById('results-summary');
    const filtersEl = document.getElementById('results-filters-panel');
    if (!container) return;

    const results = this.getFilteredSorted();

    // Summary
    const fromAirport = getAirport(this.searchParams.from);
    const toAirport = getAirport(this.searchParams.to);
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div>
          <h2 class="text-2xl font-bold mb-1">${fromAirport?.city || this.searchParams.from} → ${toAirport?.city || this.searchParams.to}</h2>
          <p class="text-secondary text-sm">${formatDate(this.searchParams.date)} · ${this.searchParams.passengers} passenger${this.searchParams.passengers > 1 ? 's' : ''} · ${this.searchParams.cabin}</p>
        </div>
        <p class="text-sm text-muted">${results.length} flight${results.length !== 1 ? 's' : ''} found</p>
      `;
    }

    // Sort controls
    this.renderSortControls();

    // Filters
    this.renderFilters(filtersEl);

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✈️</div>
          <h3 class="empty-state-title">No flights found</h3>
          <p class="empty-state-text">Try adjusting your search criteria or selecting different dates.</p>
          <button class="btn btn-primary mt-6" onclick="App.navigate('home')">
            <i data-lucide="search"></i> New Search
          </button>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = results.map(flight => this.renderFlightCard(flight)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Attach click handlers
    container.querySelectorAll('.flight-card').forEach(card => {
      const selectBtn = card.querySelector('.btn-select-flight');
      if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectFlight(card.dataset.flightId);
        });
      }

      const wishBtn = card.querySelector('.btn-wishlist');
      if (wishBtn) {
        wishBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleWishlist(card.dataset.flightId, wishBtn);
        });
      }
    });
  },

  renderFlightCard(flight) {
    const airline = getAirline(flight.airlineId);
    const depAirport = getAirport(flight.departureAirport);
    const arrAirport = getAirport(flight.arrivalAirport);
    const cabin = this.searchParams.cabin || 'economy';
    const price = flight.prices[cabin] || flight.prices.economy;
    const isWishlisted = DB.getAll('wishlist').some(w => w.flightId === flight.id);

    return `
      <div class="flight-card" data-flight-id="${flight.id}">
        <div class="flight-card-main">
          <div class="flight-airline">
            <div class="airline-logo" style="border-color: ${airline?.color || '#06b6d4'}">${airline?.shortCode || '??'}</div>
            <div>
              <div class="airline-name">${airline?.name || 'Unknown'}</div>
              <div class="flight-number">${flight.flightNumber}</div>
            </div>
          </div>
          <div class="flight-route">
            <div class="flight-time">
              <div class="flight-time-value">${formatTime(flight.departureTime)}</div>
              <div class="flight-time-code">${depAirport?.code || flight.departureAirport}</div>
            </div>
            <div class="flight-duration">
              <div class="flight-duration-time">${formatDuration(flight.duration)}</div>
              <div class="flight-duration-line"></div>
              <div class="flight-stops ${flight.stops === 0 ? 'direct' : ''}">${flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</div>
            </div>
            <div class="flight-time">
              <div class="flight-time-value">${formatTime(flight.arrivalTime)}</div>
              <div class="flight-time-code">${arrAirport?.code || flight.arrivalAirport}</div>
            </div>
          </div>
          <div class="flight-price">
            <div class="flight-price-value">${formatPrice(price)}</div>
            <div class="flight-price-per">per person</div>
          </div>
        </div>
        <div class="flight-card-footer">
          <div class="flight-tags">
            <span class="badge badge-${flight.status === 'on-time' || flight.status === 'scheduled' ? 'success' : 'warning'}">${flight.status.replace('-', ' ')}</span>
            <span class="tag"><i data-lucide="armchair" style="width:12px;height:12px"></i> ${flight.availableSeats} seats left</span>
            ${flight.availableSeats < 20 ? '<span class="badge badge-error">Filling fast</span>' : ''}
          </div>
          <div class="flex gap-2">
            <button class="btn-icon btn-wishlist ${isWishlisted ? 'active' : ''}" data-tooltip="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
              <i data-lucide="heart" style="width:18px;height:18px;${isWishlisted ? 'fill:var(--error);color:var(--error)' : ''}"></i>
            </button>
            <button class="btn btn-primary btn-sm btn-select-flight">Select <i data-lucide="arrow-right" style="width:14px;height:14px"></i></button>
          </div>
        </div>
      </div>
    `;
  },

  renderSortControls() {
    const sortContainer = document.getElementById('results-sort');
    if (!sortContainer) return;

    sortContainer.innerHTML = `
      <span class="text-sm text-muted">Sort by:</span>
      <div class="pill-group">
        <button class="pill ${this.sortBy === 'price' ? 'active' : ''}" data-sort="price">Price</button>
        <button class="pill ${this.sortBy === 'duration' ? 'active' : ''}" data-sort="duration">Duration</button>
        <button class="pill ${this.sortBy === 'departure' ? 'active' : ''}" data-sort="departure">Departure</button>
      </div>
    `;

    sortContainer.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.sortBy = pill.dataset.sort;
        this.renderResults();
      });
    });
  },

  renderFilters(container) {
    if (!container) return;

    const allAirlines = [...new Set(this.results.map(f => f.airlineId))];
    const maxPrice = Math.max(...this.results.map(f => f.prices[this.searchParams.cabin || 'economy']));

    container.innerHTML = `
      <div class="card">
        <h3 class="card-title mb-4"><i data-lucide="sliders-horizontal" style="width:18px;height:18px"></i> Filters</h3>

        <div class="filter-section">
          <div class="filter-title">Stops</div>
          <label class="form-check"><input type="radio" name="stops" value="any" ${this.filters.stops === 'any' ? 'checked' : ''}> Any</label>
          <label class="form-check"><input type="radio" name="stops" value="0" ${this.filters.stops === '0' ? 'checked' : ''}> Direct only</label>
          <label class="form-check"><input type="radio" name="stops" value="1" ${this.filters.stops === '1' ? 'checked' : ''}> 1 stop max</label>
        </div>

        <div class="filter-section">
          <div class="filter-title">Max Price: <span id="price-display">${formatPrice(this.filters.maxPrice === Infinity ? maxPrice : this.filters.maxPrice)}</span></div>
          <input type="range" id="price-filter" min="50" max="${maxPrice + 100}" value="${this.filters.maxPrice === Infinity ? maxPrice + 100 : this.filters.maxPrice}" step="10">
        </div>

        <div class="filter-section">
          <div class="filter-title">Airlines</div>
          ${allAirlines.map(aId => {
            const airline = getAirline(aId);
            return `<label class="form-check"><input type="checkbox" value="${aId}" ${this.filters.airlines.length === 0 || this.filters.airlines.includes(aId) ? 'checked' : ''}> ${airline?.name || aId}</label>`;
          }).join('')}
        </div>

        <div class="filter-section">
          <div class="filter-title">Departure Time</div>
          <label class="form-check"><input type="radio" name="time" value="any" ${this.filters.timeRange === 'any' ? 'checked' : ''}> Any time</label>
          <label class="form-check"><input type="radio" name="time" value="morning" ${this.filters.timeRange === 'morning' ? 'checked' : ''}> Morning (6-12)</label>
          <label class="form-check"><input type="radio" name="time" value="afternoon" ${this.filters.timeRange === 'afternoon' ? 'checked' : ''}> Afternoon (12-18)</label>
          <label class="form-check"><input type="radio" name="time" value="evening" ${this.filters.timeRange === 'evening' ? 'checked' : ''}> Evening (18-24)</label>
        </div>

        <button class="btn btn-secondary btn-block mt-4" onclick="Flights.resetFilters()">Reset Filters</button>
      </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Filter event listeners
    container.querySelectorAll('input[name="stops"]').forEach(r => {
      r.addEventListener('change', () => { this.filters.stops = r.value; this.renderResults(); });
    });

    const priceSlider = container.querySelector('#price-filter');
    if (priceSlider) {
      priceSlider.addEventListener('input', () => {
        this.filters.maxPrice = parseInt(priceSlider.value);
        const display = container.querySelector('#price-display');
        if (display) display.textContent = formatPrice(priceSlider.value);
      });
      priceSlider.addEventListener('change', () => { this.renderResults(); });
    }

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...container.querySelectorAll('input[type="checkbox"]:checked')].map(c => c.value);
        this.filters.airlines = checked.length === allAirlines.length ? [] : checked;
        this.renderResults();
      });
    });

    container.querySelectorAll('input[name="time"]').forEach(r => {
      r.addEventListener('change', () => { this.filters.timeRange = r.value; this.renderResults(); });
    });
  },

  getFilteredSorted() {
    const cabin = this.searchParams.cabin || 'economy';
    let results = [...this.results];

    // Apply filters
    if (this.filters.stops !== 'any') {
      const maxStops = parseInt(this.filters.stops);
      results = results.filter(f => f.stops <= maxStops);
    }

    if (this.filters.maxPrice !== Infinity) {
      results = results.filter(f => f.prices[cabin] <= this.filters.maxPrice);
    }

    if (this.filters.airlines.length > 0) {
      results = results.filter(f => this.filters.airlines.includes(f.airlineId));
    }

    if (this.filters.timeRange !== 'any') {
      results = results.filter(f => {
        const hour = new Date(f.departureTime).getHours();
        switch (this.filters.timeRange) {
          case 'morning': return hour >= 6 && hour < 12;
          case 'afternoon': return hour >= 12 && hour < 18;
          case 'evening': return hour >= 18;
          default: return true;
        }
      });
    }

    // Sort
    switch (this.sortBy) {
      case 'price':
        results.sort((a, b) => a.prices[cabin] - b.prices[cabin]);
        break;
      case 'duration':
        results.sort((a, b) => a.duration - b.duration);
        break;
      case 'departure':
        results.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
        break;
    }

    return results;
  },

  resetFilters() {
    this.filters = { maxPrice: Infinity, stops: 'any', airlines: [], timeRange: 'any' };
    this.renderResults();
  },

  selectFlight(flightId) {
    const flight = this.results.find(f => f.id === flightId) || DB.getAll('flights').find(f => f.id === flightId);
    if (!flight) return;

    App.state.selectedFlight = flight;
    App.state.bookingData = {
      flight,
      cabin: this.searchParams.cabin || 'economy',
      passengers: this.searchParams.passengers || 1,
      passengerDetails: [],
      selectedSeats: [],
      addons: { luggage: [], meals: [] },
      promoCode: null,
      promoDiscount: 0
    };

    if (!App.state.currentUser) {
      Toast.show('Sign In Required', 'Please sign in to book a flight.', 'warning');
      App.navigate('login');
      return;
    }

    App.navigate('booking');
  },

  toggleWishlist(flightId, btn) {
    if (!App.state.currentUser) {
      Toast.show('Sign In Required', 'Please sign in to save flights.', 'warning');
      return;
    }

    const wishlist = DB.getAll('wishlist');
    const idx = wishlist.findIndex(w => w.flightId === flightId && w.userId === App.state.currentUser.id);

    if (idx !== -1) {
      wishlist.splice(idx, 1);
      DB.set('wishlist', wishlist);
      Toast.show('Removed', 'Flight removed from wishlist.', 'info');
      if (btn) {
        btn.classList.remove('active');
        const icon = btn.querySelector('i');
        if (icon) icon.style.cssText = 'width:18px;height:18px';
      }
    } else {
      wishlist.push({ flightId, userId: App.state.currentUser.id, addedAt: new Date().toISOString() });
      DB.set('wishlist', wishlist);
      Toast.show('Saved!', 'Flight added to wishlist.', 'success');
      if (btn) {
        btn.classList.add('active');
        const icon = btn.querySelector('i');
        if (icon) icon.style.cssText = 'width:18px;height:18px;fill:var(--error);color:var(--error)';
      }
    }
  },

  renderPopularDestinations() {
    const container = document.getElementById('popular-destinations');
    if (!container) return;

    const destinations = [
      { city: 'Dubai', code: 'DXB', country: 'UAE', price: 450, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
      { city: 'London', code: 'LHR', country: 'UK', price: 680, gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
      { city: 'Paris', code: 'CDG', country: 'France', price: 640, gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
      { city: 'Singapore', code: 'SIN', country: 'Singapore', price: 780, gradient: 'linear-gradient(135deg, #06b6d4, #10b981)' },
      { city: 'New York', code: 'JFK', country: 'USA', price: 890, gradient: 'linear-gradient(135deg, #6366f1, #ec4899)' },
      { city: 'Tokyo', code: 'HND', country: 'Japan', price: 950, gradient: 'linear-gradient(135deg, #ef4444, #f59e0b)' }
    ];

    container.innerHTML = destinations.map(d => `
      <div class="destination-card card-interactive" onclick="Flights.quickSearch('NBO','${d.code}')">
        <div class="destination-card-bg" style="background: ${d.gradient}"></div>
        <div class="destination-card-overlay"></div>
        <div class="destination-card-content">
          <div class="destination-city">${d.city}</div>
          <div class="destination-country">${d.country}</div>
          <div class="destination-price">From ${formatPrice(d.price)}</div>
        </div>
      </div>
    `).join('');
  },

  quickSearch(from, to) {
    const fromInput = document.getElementById('search-from');
    const toInput = document.getElementById('search-to');
    const fromAirport = getAirport(from);
    const toAirport = getAirport(to);
    if (fromInput && fromAirport) { fromInput.value = `${fromAirport.city} (${from})`; fromInput.dataset.code = from; }
    if (toInput && toAirport) { toInput.value = `${toAirport.city} (${to})`; toInput.dataset.code = to; }

    // Scroll to search
    document.getElementById('flight-search-form')?.scrollIntoView({ behavior: 'smooth' });
  }
};
