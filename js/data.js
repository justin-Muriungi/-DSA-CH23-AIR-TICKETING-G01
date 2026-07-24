/* =============================================
   SKYVOYAGE — Mock Data & localStorage Helpers
   ============================================= */

const DB = {
  // --- localStorage CRUD helpers ---
  get(key) {
    try {
      const data = localStorage.getItem(`skyvoyage_${key}`);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    localStorage.setItem(`skyvoyage_${key}`, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(`skyvoyage_${key}`);
  },

  // Generate unique IDs
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  generatePNR() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) pnr += chars[Math.floor(Math.random() * chars.length)];
    return pnr;
  },

  // --- Initialize all data on first load ---
  init() {
    if (this.get('initialized')) return;

    this.set('airports', SEED.airports);
    this.set('airlines', SEED.airlines);
    this.set('aircraft', SEED.aircraft);
    this.set('flights', SEED.flights);
    this.set('promoCodes', SEED.promoCodes);
    this.set('users', SEED.users);
    this.set('bookings', []);
    this.set('reviews', []);
    this.set('notifications', []);
    this.set('wishlist', []);
    this.set('favoriteRoutes', []);
    this.set('initialized', true);

    console.log('✈️ SkyVoyage database initialized');
  },

  // Collection helpers
  getAll(collection) {
    return this.get(collection) || [];
  },

  add(collection, item) {
    const items = this.getAll(collection);
    items.push(item);
    this.set(collection, items);
    return item;
  },

  update(collection, id, updates) {
    const items = this.getAll(collection);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      this.set(collection, items);
      return items[idx];
    }
    return null;
  },

  delete(collection, id) {
    const items = this.getAll(collection).filter(i => i.id !== id);
    this.set(collection, items);
  },

  find(collection, id) {
    return this.getAll(collection).find(i => i.id === id);
  },

  findBy(collection, key, value) {
    return this.getAll(collection).filter(i => i[key] === value);
  }
};

// --- SEED DATA ---
const AIRCRAFT_DATA = [
  { id: 'B738', type: 'Boeing 737-800', seatConfig: { economy: 150, premiumEconomy: 0, business: 16, first: 0 }, columns: 'ABC DEF', totalRows: 30 },
  { id: 'B789', type: 'Boeing 787-9 Dreamliner', seatConfig: { economy: 198, premiumEconomy: 21, business: 30, first: 8 }, columns: 'ABC DEFG HIJ', totalRows: 40 },
  { id: 'A320', type: 'Airbus A320', seatConfig: { economy: 144, premiumEconomy: 0, business: 12, first: 0 }, columns: 'ABC DEF', totalRows: 28 },
  { id: 'A380', type: 'Airbus A380', seatConfig: { economy: 399, premiumEconomy: 76, business: 76, first: 14 }, columns: 'ABC DEFG HIJ', totalRows: 60 },
  { id: 'B77W', type: 'Boeing 777-300ER', seatConfig: { economy: 304, premiumEconomy: 28, business: 42, first: 8 }, columns: 'ABC DEFG HIJ', totalRows: 50 },
  { id: 'A350', type: 'Airbus A350-900', seatConfig: { economy: 253, premiumEconomy: 32, business: 36, first: 0 }, columns: 'ABC DEFGH IJK', totalRows: 45 },
  { id: 'E190', type: 'Embraer E190', seatConfig: { economy: 88, premiumEconomy: 0, business: 12, first: 0 }, columns: 'AB CD', totalRows: 25 }
];

const SEED = {
  airports: [
    { id: 'NBO', code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', timezone: 'EAT' },
    { id: 'DXB', code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', timezone: 'GST' },
    { id: 'LHR', code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom', timezone: 'GMT' },
    { id: 'JFK', code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA', timezone: 'EST' },
    { id: 'CDG', code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', timezone: 'CET' },
    { id: 'SIN', code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', timezone: 'SGT' },
    { id: 'HND', code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan', timezone: 'JST' },
    { id: 'SYD', code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', timezone: 'AEST' },
    { id: 'LAX', code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', timezone: 'PST' },
    { id: 'ORD', code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'USA', timezone: 'CST' },
    { id: 'FRA', code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', timezone: 'CET' },
    { id: 'IST', code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey', timezone: 'TRT' },
    { id: 'DOH', code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', timezone: 'AST' },
    { id: 'BKK', code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', timezone: 'ICT' },
    { id: 'JNB', code: 'JNB', name: 'OR Tambo International', city: 'Johannesburg', country: 'South Africa', timezone: 'SAST' },
    { id: 'MUM', code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India', timezone: 'IST' },
    { id: 'HKG', code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China', timezone: 'HKT' },
    { id: 'ADD', code: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'Ethiopia', timezone: 'EAT' },
    { id: 'CAI', code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', timezone: 'EET' },
    { id: 'CPT', code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', timezone: 'SAST' },
    { id: 'MBA', code: 'MBA', name: 'Moi International', city: 'Mombasa', country: 'Kenya', timezone: 'EAT' },
    { id: 'DAR', code: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania', timezone: 'EAT' },
    { id: 'EBB', code: 'EBB', name: 'Entebbe International', city: 'Entebbe', country: 'Uganda', timezone: 'EAT' },
    { id: 'KGL', code: 'KGL', name: 'Kigali International', city: 'Kigali', country: 'Rwanda', timezone: 'CAT' }
  ],

  airlines: [
    { id: 'KQ', code: 'KQ', name: 'Kenya Airways', color: '#c8102e', shortCode: 'KQ' },
    { id: 'EK', code: 'EK', name: 'Emirates', color: '#d71921', shortCode: 'EK' },
    { id: 'BA', code: 'BA', name: 'British Airways', color: '#075aaa', shortCode: 'BA' },
    { id: 'QR', code: 'QR', name: 'Qatar Airways', color: '#5c0632', shortCode: 'QR' },
    { id: 'ET', code: 'ET', name: 'Ethiopian Airlines', color: '#006633', shortCode: 'ET' },
    { id: 'TK', code: 'TK', name: 'Turkish Airlines', color: '#c8102e', shortCode: 'TK' },
    { id: 'SQ', code: 'SQ', name: 'Singapore Airlines', color: '#1a237e', shortCode: 'SQ' },
    { id: 'LH', code: 'LH', name: 'Lufthansa', color: '#05164d', shortCode: 'LH' },
    { id: 'AF', code: 'AF', name: 'Air France', color: '#002157', shortCode: 'AF' },
    { id: 'SA', code: 'SA', name: 'South African Airways', color: '#006747', shortCode: 'SA' },
    { id: 'RW', code: 'WB', name: 'RwandAir', color: '#003366', shortCode: 'WB' },
    { id: 'JL', code: 'JL', name: 'Japan Airlines', color: '#c8102e', shortCode: 'JL' }
  ],

  aircraft: AIRCRAFT_DATA,

  flights: (() => {
    const flights = [];
    const routes = [
      { from: 'NBO', to: 'DXB', airline: 'KQ', aircraft: 'B789', basePriceEco: 450, duration: 300 },
      { from: 'NBO', to: 'LHR', airline: 'KQ', aircraft: 'B789', basePriceEco: 680, duration: 510 },
      { from: 'NBO', to: 'LHR', airline: 'BA', aircraft: 'B77W', basePriceEco: 720, duration: 500 },
      { from: 'DXB', to: 'LHR', airline: 'EK', aircraft: 'A380', basePriceEco: 550, duration: 420 },
      { from: 'DXB', to: 'JFK', airline: 'EK', aircraft: 'A380', basePriceEco: 890, duration: 840 },
      { from: 'LHR', to: 'JFK', airline: 'BA', aircraft: 'B77W', basePriceEco: 620, duration: 480 },
      { from: 'NBO', to: 'JNB', airline: 'KQ', aircraft: 'B738', basePriceEco: 320, duration: 240 },
      { from: 'NBO', to: 'ADD', airline: 'ET', aircraft: 'B738', basePriceEco: 180, duration: 120 },
      { from: 'ADD', to: 'DXB', airline: 'ET', aircraft: 'B789', basePriceEco: 280, duration: 210 },
      { from: 'NBO', to: 'CDG', airline: 'AF', aircraft: 'A350', basePriceEco: 640, duration: 480 },
      { from: 'IST', to: 'LHR', airline: 'TK', aircraft: 'A350', basePriceEco: 380, duration: 240 },
      { from: 'NBO', to: 'IST', airline: 'TK', aircraft: 'B77W', basePriceEco: 520, duration: 360 },
      { from: 'DOH', to: 'SIN', airline: 'QR', aircraft: 'A380', basePriceEco: 580, duration: 420 },
      { from: 'NBO', to: 'DOH', airline: 'QR', aircraft: 'B789', basePriceEco: 490, duration: 330 },
      { from: 'SIN', to: 'HND', airline: 'SQ', aircraft: 'A350', basePriceEco: 460, duration: 420 },
      { from: 'LHR', to: 'CDG', airline: 'BA', aircraft: 'A320', basePriceEco: 120, duration: 75 },
      { from: 'FRA', to: 'NBO', airline: 'LH', aircraft: 'A350', basePriceEco: 590, duration: 480 },
      { from: 'NBO', to: 'MBA', airline: 'KQ', aircraft: 'E190', basePriceEco: 80, duration: 60 },
      { from: 'NBO', to: 'DAR', airline: 'KQ', aircraft: 'E190', basePriceEco: 110, duration: 75 },
      { from: 'NBO', to: 'EBB', airline: 'KQ', aircraft: 'E190', basePriceEco: 95, duration: 55 },
      { from: 'NBO', to: 'KGL', airline: 'WB', aircraft: 'A320', basePriceEco: 130, duration: 90 },
      { from: 'JNB', to: 'CPT', airline: 'SA', aircraft: 'A320', basePriceEco: 100, duration: 120 },
      { from: 'NBO', to: 'BKK', airline: 'KQ', aircraft: 'B789', basePriceEco: 620, duration: 540 },
      { from: 'DXB', to: 'BKK', airline: 'EK', aircraft: 'B77W', basePriceEco: 420, duration: 360 },
      { from: 'LHR', to: 'LAX', airline: 'BA', aircraft: 'A380', basePriceEco: 750, duration: 660 },
      { from: 'NBO', to: 'HKG', airline: 'KQ', aircraft: 'B789', basePriceEco: 710, duration: 570 },
      { from: 'CAI', to: 'DXB', airline: 'EK', aircraft: 'B738', basePriceEco: 260, duration: 180 },
      { from: 'NBO', to: 'CAI', airline: 'ET', aircraft: 'B738', basePriceEco: 280, duration: 240 }
    ];

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 2);

    routes.forEach((route, idx) => {
      for (let day = 0; day < 14; day++) {
        const depDate = new Date(baseDate);
        depDate.setDate(depDate.getDate() + day);

        const timesPerDay = route.basePriceEco < 200 ? 3 : (route.basePriceEco < 500 ? 2 : 1);

        for (let t = 0; t < timesPerDay; t++) {
          const depHour = [6, 10, 14, 18, 22][Math.floor(Math.random() * 5)];
          const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

          depDate.setHours(depHour, depMin, 0, 0);
          const arrDate = new Date(depDate.getTime() + route.duration * 60000);

          const priceVariance = 0.8 + Math.random() * 0.6;
          const dayFactor = day < 3 ? 1.2 : (day < 7 ? 1.0 : 0.9);

          const aircraft = AIRCRAFT_DATA.find(a => a.id === route.aircraft);
          const totalSeats = aircraft ? Object.values(aircraft.seatConfig).reduce((a, b) => a + b, 0) : 180;
          const bookedPercentage = Math.random() * 0.6;
          const availableSeats = Math.max(5, Math.floor(totalSeats * (1 - bookedPercentage)));

          const stops = route.duration > 400 && Math.random() > 0.6 ? 1 : 0;
          const statuses = ['on-time', 'on-time', 'on-time', 'on-time', 'delayed', 'on-time'];
          const status = day === 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'scheduled';

          flights.push({
            id: `FL${String(idx).padStart(2, '0')}${String(day).padStart(2, '0')}${t}`,
            flightNumber: `${route.airline}${100 + idx * 3 + t}`,
            airlineId: route.airline,
            aircraftId: route.aircraft,
            departureAirport: route.from,
            arrivalAirport: route.to,
            departureTime: depDate.toISOString(),
            arrivalTime: arrDate.toISOString(),
            duration: route.duration + (stops * 90),
            stops: stops,
            stopCity: stops ? ['DXB', 'ADD', 'DOH', 'IST'][Math.floor(Math.random() * 4)] : null,
            prices: {
              economy: Math.round(route.basePriceEco * priceVariance * dayFactor),
              premiumEconomy: Math.round(route.basePriceEco * 1.6 * priceVariance * dayFactor),
              business: Math.round(route.basePriceEco * 3.2 * priceVariance * dayFactor),
              first: Math.round(route.basePriceEco * 5.5 * priceVariance * dayFactor)
            },
            availableSeats: availableSeats,
            totalSeats: totalSeats,
            status: status,
            gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 30) + 1}`,
            terminal: Math.floor(Math.random() * 4) + 1
          });
        }
      }
    });

    return flights;
  })(),

  promoCodes: [
    { id: 'pc1', code: 'WELCOME20', discount: 20, type: 'percentage', description: '20% off your first booking', minPurchase: 200, maxUses: 100, usedCount: 23, active: true, expiryDate: '2026-12-31' },
    { id: 'pc2', code: 'FLY50', discount: 50, type: 'fixed', description: '$50 off any flight', minPurchase: 300, maxUses: 50, usedCount: 12, active: true, expiryDate: '2026-09-30' },
    { id: 'pc3', code: 'SUMMER15', discount: 15, type: 'percentage', description: '15% summer discount', minPurchase: 150, maxUses: 200, usedCount: 67, active: true, expiryDate: '2026-08-31' },
    { id: 'pc4', code: 'BUSINESS30', discount: 30, type: 'percentage', description: '30% off business class', minPurchase: 500, maxUses: 30, usedCount: 8, active: true, expiryDate: '2026-10-31' },
    { id: 'pc5', code: 'AFRICA10', discount: 10, type: 'percentage', description: '10% off African routes', minPurchase: 100, maxUses: 500, usedCount: 134, active: true, expiryDate: '2026-12-31' }
  ],

  users: [
    {
      id: 'admin1',
      email: 'admin@skyvoyage.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+254700000000',
      verified: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'staff1',
      email: 'staff@skyvoyage.com',
      password: 'staff123',
      firstName: 'Staff',
      lastName: 'Member',
      role: 'staff',
      phone: '+254711111111',
      verified: true,
      createdAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 'demo1',
      email: 'demo@skyvoyage.com',
      password: 'demo123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      phone: '+254722222222',
      verified: true,
      createdAt: '2026-03-01T00:00:00Z'
    }
  ]
};

// Helper functions
function formatPrice(amount) {
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatFullDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function getAirport(code) {
  return DB.getAll('airports').find(a => a.code === code || a.id === code);
}

function getAirline(code) {
  return DB.getAll('airlines').find(a => a.code === code || a.id === code || a.shortCode === code);
}

function getAircraft(id) {
  return DB.getAll('aircraft').find(a => a.id === id);
}

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}
