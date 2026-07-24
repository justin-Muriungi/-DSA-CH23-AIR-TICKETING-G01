SkyVoyage — Air Ticketing System

A group project for our Data Structures & Algorithms module, built around Chapter 23's system design approach (Hemant Jain). SkyVoyage is a web-based flight booking platform where users can search flights, book seats, join a waitlist when a flight is full, and check in — while the backend logic leans on the core data structures the assignment requires.

Problem we're solving

Passengers need to search and book flights quickly, without double-booked seats or slow lookups as the flight catalog grows. Airlines need to handle full flights fairly (waitlists), prioritize boarding, and find the cheapest route even when there's no direct flight between two cities.

System design (Chapter 23, five steps)

Use cases: search flights by route and date, book a seat and get a PNR, cancel or undo a booking, join a waitlist when full, find the cheapest multi-leg route, prioritize boarding by class.
Constraints: read-heavy (search happens far more than booking), seat counts must stay consistent under concurrent bookings, search should stay fast as the flight table grows.
Basic design: plain HTML/CSS/JS single-page app with hash routing, data stored in localStorage through a DB helper (js/data.js). Feature logic is split across flights.js, booking.js, checkin.js, admin.js, dashboard.js, seatmap.js, reviews.js, notifications.js. The data structures live in js/dsa.js.
Bottlenecks: scanning every flight for each search, a possible race condition if two people book the last seat at once, and Dijkstra getting expensive as the route network grows.
Scalability: replace linear scans with a hash index, wrap seat decrements in an atomic operation, and cache common routes instead of recomputing shortest paths every time.

Data structures used

Hash map (HashIndex) — flight lookup by ID, O(1) instead of scanning the array
Stack (BookingHistoryStack) — undo the last booking action
Queue (WaitlistQueue) — fair, first-come-first-served waitlist per flight
Min-heap (MinHeap) — boarding priority, also powers Dijkstra
Graph (RouteGraph) — BFS/Dijkstra for route reachability and cheapest multi-leg flights
Sorting + binary search — ranking and searching flight results by price

All five live in js/dsa.js and get wired into the existing feature files.

Running it locally

Clone the repo, drop it into your XAMPP htdocs folder, start Apache, and open: http://localhost/air-ticketing-system/index.html#/home

Example search

Nairobi (NBO) to Dubai (DXB), any date in the next two weeks — returns Kenya Airways flights with duration, price, and seats left. Booking a flight returns a 6-character PNR like 7F3K9A.

Team

[Justin Muriungi] — team lead
[Felix Kiplangat] — system design
[Paul Kioko] — data structures & algorithms
[David Maina] — backend & testing
[Justus Maina] — docs, benchmarking, demo video

Testing

15+ test cases covering search, booking, waitlist, undo, boarding order, route lookup, sorting, and edge cases like double-booking and invalid input. Benchmark: lookup/search time before and after the hash index, measured at increasing flight counts.

Demo video

https://youtu.be/BzLB_kMKMto
