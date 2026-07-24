/* =============================================
   SKYVOYAGE — Data Structures & Algorithms Module
   Hash Index | Stack | Queue | MinHeap | Graph
   ============================================= */

// --- Hash map: O(1) average lookup (flights by id, PNR, etc.) ---
class HashIndex {
  constructor(items = [], key) {
    this.map = new Map();
    items.forEach(item => this.map.set(item[key], item));
  }
  get(key) { return this.map.get(key) || null; }
  has(key) { return this.map.has(key); }
  set(key, value) { this.map.set(key, value); }
  delete(key) { this.map.delete(key); }
}

// --- Stack: LIFO booking action history / undo ---
class BookingHistoryStack {
  constructor() { this.stack = []; }
  push(action) { this.stack.push(action); }
  pop() { return this.stack.length ? this.stack.pop() : null; }
  peek() { return this.stack[this.stack.length - 1] || null; }
  isEmpty() { return this.stack.length === 0; }
}

// --- Queue: FIFO waitlist for fully booked flights ---
class WaitlistQueue {
  constructor() { this.items = []; }
  enqueue(passenger) { this.items.push(passenger); }
  dequeue() { return this.items.length ? this.items.shift() : null; }
  peek() { return this.items[0] || null; }
  size() { return this.items.length; }
}

// --- Min-heap: boarding priority (lower value = boards first), top-k cheapest ---
class MinHeap {
  constructor(compare = (a, b) => a - b) {
    this.heap = [];
    this.compare = compare;
  }
  insert(value) {
    this.heap.push(value);
    this._bubbleUp(this.heap.length - 1);
  }
  extractMin() {
    if (!this.heap.length) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = last;
      this._bubbleDown(0);
    }
    return min;
  }
  get size() { return this.heap.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.heap[i], this.heap[parent]) >= 0) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }
  _bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i, l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.compare(this.heap[l], this.heap[smallest]) < 0) smallest = l;
      if (r < n && this.compare(this.heap[r], this.heap[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

// --- Graph: airport route network — BFS reachability + Dijkstra cheapest path ---
class RouteGraph {
  constructor(flights = []) {
    this.adj = new Map();
    flights.forEach(f => this._addEdge(f));
  }
  _addEdge(flight) {
    const { departureAirport: from, arrivalAirport: to, prices, duration, flightNumber } = flight;
    if (!this.adj.has(from)) this.adj.set(from, []);
    this.adj.get(from).push({ to, price: prices.economy, duration, flightNumber });
  }
  bfsReachable(start) {
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const node = queue.shift();
      for (const edge of this.adj.get(node) || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }
    return [...visited];
  }
  dijkstraCheapest(start, end) {
    const dist = new Map([[start, 0]]);
    const prev = new Map();
    const visited = new Set();
    const pq = new MinHeap((a, b) => a.cost - b.cost);
    pq.insert({ node: start, cost: 0 });

    while (pq.size) {
      const { node, cost } = pq.extractMin();
      if (visited.has(node)) continue;
      visited.add(node);
      if (node === end) break;

      for (const edge of this.adj.get(node) || []) {
        const newCost = cost + edge.price;
        if (newCost < (dist.get(edge.to) ?? Infinity)) {
          dist.set(edge.to, newCost);
          prev.set(edge.to, { from: node, via: edge.flightNumber });
          pq.insert({ node: edge.to, cost: newCost });
        }
      }
    }

    if (!dist.has(end)) return null;
    const path = [];
    let cur = end;
    while (cur !== start) {
      const step = prev.get(cur);
      if (!step) break;
      path.unshift({ from: step.from, to: cur, via: step.via });
      cur = step.from;
    }
    return { totalCost: dist.get(end), path };
  }
}

// --- Binary search over a price-sorted flight list ---
function binarySearchByPrice(sortedFlights, targetPrice) {
  let lo = 0, hi = sortedFlights.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midPrice = sortedFlights[mid].prices.economy;
    if (midPrice === targetPrice) return mid;
    if (midPrice < targetPrice) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}

// --- App-wide singletons ---
const AppDSA = {
  bookingHistory: new BookingHistoryStack(),
  waitlists: new Map(),          // flightId -> WaitlistQueue
  flightIndex: null,             // HashIndex, built after DB.init()

  init() {
    this.flightIndex = new HashIndex(DB.getAll('flights'), 'id');
  },

  getWaitlist(flightId) {
    if (!this.waitlists.has(flightId)) this.waitlists.set(flightId, new WaitlistQueue());
    return this.waitlists.get(flightId);
  },

  buildRouteGraph() {
    return new RouteGraph(DB.getAll('flights'));
  }
};
