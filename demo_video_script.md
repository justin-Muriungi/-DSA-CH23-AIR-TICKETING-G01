# SkyVoyage — Demo Video Script (5 Presenters)

Target length: ~6–7 minutes. Format: brief intro slide per section, then live demo on the running site. Record each person's segment as a separate clip, then stitch together — much easier than one continuous take.

**Recording tool:** Windows Game Bar (`Win + G`) or OBS Studio (free) to capture screen + mic. Stitch clips in Clipchamp (built into Windows) or CapCut (free). Upload to YouTube as **Unlisted** (shareable link, doesn't need to be public) unless your instructor requires public.

---

## Segment 1 — Intro & Problem Statement (Team Lead) — ~60 sec

**Slide:** Title "SkyVoyage — Air Ticketing System" + group name/number + team member names + one line: "A DSA Chapter 23 group project applying the 5-step system design process to an airline booking platform."

**Say:**
> "Hi, we're [Group Name], and this is SkyVoyage — an air ticketing system we built for our Data Structures and Algorithms project, following Chapter 23's five-step design process. The problem we're solving: passengers need to search flights, book seats, and check in quickly, while the system needs to handle lookups, waitlists, and route planning efficiently as it scales. I'll hand over to [Member 2] to show the system running."

---

## Segment 2 — Live Demo: The Running System (Member 2) — ~100 sec

**No slide — straight to browser.** Open `index.html#/home`.

**Click-through path:**
1. Home page → point out the search box, popular destinations
2. Search a real route from the seed data (e.g. **NBO → DXB**, any date) → hit "Search Flights"
3. On results page: show sort pills (price/duration/departure) and the filters sidebar (airline, stops, price slider)
4. Select a flight → walk through the booking stepper: passenger details → seat map (click a seat) → payment step
5. Complete booking → show the confirmation page with the generated PNR

**Say (while clicking):**
> "Here's SkyVoyage running. I'll search Nairobi to Dubai... Notice the results are sorted and filterable by price, duration, and stops. I'll pick a flight, choose a seat on the seat map, and go through payment. And there's our confirmation with a generated booking reference — that PNR is what powers check-in later."

---

## Segment 3 — Data Structures & Algorithms Used (DS Lead) — ~110 sec

**Slide:** Table listing the six requirements and what you used — hash map, stack, queue, heap, graph, sort/search. (Reuse the DSA table from the README.)

**Then switch to code** — open `js/dsa.js` in VS Code or any editor and scroll through briefly while narrating (don't read code line by line, just point at each class):

**Say:**
> "Our DSA logic lives in `dsa.js`. For fast lookups, we use a hash map — `HashIndex` — so finding a flight by ID is O(1) average instead of scanning every flight. For undo support, we use a stack — `BookingHistoryStack` — LIFO, so the last booking action can be reversed. For flights that are full, we use a FIFO queue — `WaitlistQueue` — so passengers are seated fairly in the order they joined. For boarding priority, we use a min-heap, which also powers Dijkstra's algorithm on our route graph — `RouteGraph` — giving us the cheapest multi-leg route between airports that don't have a direct flight, like Nairobi to New York via Dubai. And for search results, we sort with O(n log n) sort and support binary search once results are sorted by price."

*(If you have time, briefly show the `RouteGraph.dijkstraCheapest()` call actually running in the browser console — open DevTools, type `AppDSA.buildRouteGraph().dijkstraCheapest('NBO','JFK')`, show the returned path. This is a strong, concrete demo moment.)*

---

## Segment 4 — Scalability & Bottlenecks (System Design Lead) — ~90 sec

**Slide:** Two columns — "Bottleneck" vs "Fix" (pull directly from your README's Section 4/5).

**Say:**
> "Following Chapter 23's process, we identified a few bottlenecks. First, searching flights by scanning the full array doesn't scale — our fix is the hash index, turning lookups from O(n) to near O(1). Second, double-booking the last seat is a race condition risk — we'd handle that with an atomic decrement or transaction around the booking write. Third, as our airport network grows, running Dijkstra on every search gets expensive — we'd cache common routes and only compute on demand for uncommon pairs. For scaling further, we'd talk about caching hot routes, and read replicas if this moved to a real backend instead of localStorage."

---

## Segment 5 — Q&A / Walkthrough Wrap-up (Demo/Video Lead) — ~60 sec

**No slide — camera/screen back on the site**, maybe the check-in page or dashboard, whatever's most visually interesting left to show.

**Say:**
> "One tricky part we ran into: [pick one real thing — e.g. "making sure the waitlist queue and seat count stayed in sync" or "getting Dijkstra to correctly reconstruct the path, not just the cost"]. We solved it by [one sentence]. That's SkyVoyage — thanks for watching, and thanks to [Group Name] for the work on this. Links to our GitHub repo and full report are in the description."

---

## Before recording — checklist

- [ ] Test the full click-through path once with no recording, so there's no dead time figuring out where buttons are
- [ ] Confirm `dsa.js` is actually wired into `booking.js`/`flights.js`/`checkin.js` (see prior integration notes) — the demo needs to show it working, not just exist as an unused file
- [ ] Each person records on mute except their own segment (avoid crosstalk if recording together on a call)
- [ ] Export each clip, stitch in order 1→5, trim dead air, add simple text overlay per segment (optional but looks polished)
- [ ] Upload unlisted to YouTube, copy the link, submit alongside your repo link
