# DSA-CH23-AIR-TICKETING-G01

## Air Ticketing System — Data Structures & Algorithms Group Project

A web-based air ticketing platform demonstrating core data structures and algorithms as required under the Chapter 23 (Hemant Jain, *System Design*) design methodology.

---

## 1. Use Cases Generation

- A user searches for available flights between an origin and destination on a given date.
- A user books a seat on a flight and receives a confirmation reference (PNR).
- A user cancels or modifies an existing booking.
- A user joins a waitlist when a flight is fully booked.
- An admin views/manages flight schedules, routes, and seat inventory.
- The system recommends the cheapest or fastest route, including connecting flights.
- The system prioritizes boarding/check-in based on ticket class or loyalty tier.

## 2. Constraints and Analysis

- **Scale (assumed for this project):** N flights, M airports, K bookings per flight.
- **Read-heavy:** flight search happens far more often than booking.
- **Consistency requirement:** seat inventory must never be oversold — updates to seat count must be atomic per booking.
- **Latency target:** search results should return quickly even as the flight/route table grows.
- Any additional constraints your group agrees on (concurrent users, expected booking volume, etc.) — replace this with real numbers once you define them.

## 3. Basic Design

- **Frontend:** Vanilla HTML/CSS/JS single-page app (SkyVoyage), hash-based routing (`index.html#/home`, etc.)
- **Data storage:** Browser `localStorage`, keyed and accessed through the `DB` helper object (`js/data.js`)
- **Core modules:** `flights.js` (search/filter/sort), `booking.js` (booking + payment flow), `checkin.js`, `admin.js`, `dashboard.js`, `seatmap.js`, `reviews.js`, `notifications.js`
- **New DSA module:** `js/dsa.js` — adds the hash index, stack, queue, heap, and graph structures the assignment requires (see table below)

### Data Structures & Algorithms Used

| Requirement | Structure/Algorithm | Implemented in | Where it's used | Why |
|---|---|---|---|---|
| Hash table/map | `HashIndex` (JS `Map`) | `js/dsa.js` → `AppDSA.flightIndex` | Flight lookup by ID in `flights.js`, replacing linear `.find()` | O(1) average lookup vs. O(n) scan over all flights |
| Stack | `BookingHistoryStack` | `js/dsa.js` → `AppDSA.bookingHistory` | Undo last booking action in `booking.js` | LIFO matches "undo last action" |
| Queue | `WaitlistQueue` | `js/dsa.js` → `AppDSA.waitlists` (per flight) | Waitlist when `availableSeats === 0` in `booking.js` | FIFO fairness for waitlisted passengers |
| Heap/priority queue | `MinHeap` | `js/dsa.js` | Boarding priority order in `checkin.js`; also powers Dijkstra's priority queue | O(log n) insert/extract-min |
| Graph | `RouteGraph` (adjacency map) + BFS + Dijkstra | `js/dsa.js` | Airport reachability and cheapest multi-leg route (e.g. NBO → JFK via DXB) | Natural fit for an airport/route network |
| Sorting + searching | Native `Array.sort()` (price/duration/departure) + `binarySearchByPrice()` | `flights.js` (sort), `js/dsa.js` (binary search) | Ranking and filtering flight search results | O(n log n) sort, O(log n) search on sorted list |

*Note: as of the uploaded codebase, `flights.js`/`booking.js` use plain array `.find()`/`.filter()`/`.sort()` on data seeded in `js/data.js`. The structures above live in the new `js/dsa.js` module and need to be wired into the existing files before the demo — this is real implementation work each member should split.*

## 4. Bottlenecks

Identify likely bottlenecks in your current design, for example:

- Linear scan over all flights for every search query as flight count grows.
- Seat-booking race condition if two users book the last seat simultaneously.
- Graph search (Dijkstra) becoming expensive as the airport network grows.
- Single point of failure if all data lives in one file/database instance.

## 5. Scalability

For each bottleneck above, describe the fix and iterate:

- Index flights by origin/destination/date (hash map) instead of scanning — turns search from O(n) to near O(1) lookup + O(k log k) sort of the matching subset.
- Use atomic/locking operations (or a transaction) around seat decrement to prevent overselling.
- Precompute or cache common routes; only run Dijkstra for uncommon origin-destination pairs.
- Discuss horizontal scaling / read replicas / caching layer (hot-route cache) as a future step.

---

## Features

- Flight search by origin, destination, and date
- Seat booking with instant confirmation (PNR generation)
- Booking cancellation with undo support
- Waitlist handling for fully booked flights
- Route/connection lookup between airports
- Admin view for managing flights and inventory
- *(edit this list to match what's actually built)*

## Architecture Diagram

`![Architecture Diagram](docs/architecture-diagram.png)`

Add a simple diagram (draw.io, Excalidraw, or even a hand-drawn photo) showing: Frontend → API layer → Booking Engine / Route Graph / Waitlist Queue → Data Store. Export as PNG and place it in a `docs/` folder in the repo, then keep the image link above.

## How to Run

```bash
# Clone the repository
git clone https://github.com/<your-org-or-user>/DSA-CH23-AIR-TICKETING-G01.git
cd DSA-CH23-AIR-TICKETING-G01

# If using XAMPP:
# 1. Copy the project folder into htdocs/
# 2. Start Apache (and MySQL if used) via XAMPP Control Panel
# 3. Open in browser:
#    http://localhost/air-ticketing-system/index.html#/home
```

*(Replace with your actual run steps once confirmed — e.g. if there's a build step, `npm install`, database import, etc.)*

## Sample Inputs / Outputs

**Search request (matches seeded routes in `data.js`):**
```
Origin: NBO (Jomo Kenyatta International, Nairobi)
Destination: DXB (Dubai International)
Date: any date within the next 14 days
```

**Sample output:**
```
Flight KQ1xx | Airline: Kenya Airways | Duration: 5h 0m | Price: $XXX | Seats left: XX
```

**Booking request:**
```
Flight: [selected flight ID]
Passenger: [logged-in user, e.g. demo@skyvoyage.com]
Cabin: Economy
```

**Booking response:**
```
Booking confirmed. PNR: [6-character alphanumeric, e.g. 7F3K9A]
Status: Confirmed
```

*(Run the actual app and paste real output here once the DSA hooks are wired in — exact prices are randomized per session in `data.js`.)*

## Team Member Roles

| Name | GitHub Username | Role |
|---|---|---|
| [Member 1] | @[username] | Team Lead / Integrator |
| [Member 2] | @[username] | System Design Lead (Chapter 23 steps owner) |
| [Member 3] | @[username] | Data Structures & Algorithms Lead |
| [Member 4] | @[username] | Backend/API Developer + Testing/QA |
| [Member 5] | @[username] | Documentation, Benchmark & Demo/Video Lead |

*(With 5 members instead of 10, roles are combined — adjust as your group agrees.)*

## Test Plan

Minimum 15 test cases required. Suggested categories:

1. Search returns correct flights for valid origin/destination/date
2. Search returns empty result for a route with no flights
3. Booking succeeds when seats are available
4. Booking fails/redirects to waitlist when flight is full
5. Cancelling a booking frees up the seat
6. Undo reverses the last booking action correctly
7. Waitlisted passenger is auto-booked when a seat frees up
8. Priority heap boards business class before economy
9. Route graph correctly finds a direct flight
10. Route graph correctly finds a connecting flight via BFS/Dijkstra
11. Sorting flight results by price is correct and stable
12. Binary search finds a flight by ID after sorting
13. Duplicate booking attempts (double-click) don't double-book a seat
14. Invalid date/route input is handled gracefully
15. Performance benchmark: search time for N=100 vs N=10,000 flights

## Complexity Analysis & Benchmark Notes

| Operation | Structure | Time Complexity |
|---|---|---|
| Seat/PNR lookup | Hash map | O(1) average |
| Undo last action | Stack | O(1) |
| Enqueue/dequeue waitlist | Queue | O(1) |
| Insert/extract boarding priority | Heap | O(log n) |
| Shortest route search | Dijkstra (graph) | O((V+E) log V) |
| Sort flight results | Merge/Quick sort | O(n log n) |
| Search sorted results | Binary search | O(log n) |

*(Add your actual benchmark: e.g., time taken to search N flights at N=100/1,000/10,000, run 3x and average.)*

## Demo Video

Link: `[insert YouTube link here]`

Video should cover (5–8 min):
1. The running system (live demo)
2. Data structures/algorithms used and where in the code
3. Scalability/bottleneck discussion
4. Short Q&A / walkthrough of a tricky part of the implementation
#   - D S A - C H 2 3 - A I R - T I C K E T I N G - G 0 1  
 #   - D S A - C H 2 3 - A I R - T I C K E T I N G - G 0 1  
 