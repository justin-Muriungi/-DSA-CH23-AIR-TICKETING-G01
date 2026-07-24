/* =============================================
   SKYVOYAGE — Flight Reviews Module
   ============================================= */

const Reviews = {
  init() {
    this.renderReviewsPage();
  },

  renderReviewsPage() {
    const container = document.getElementById('reviews-content');
    if (!container) return;
    
    // Seed some reviews if empty
    let reviews = DB.getAll('reviews');
    if (reviews.length === 0) {
      reviews = this.generateSeedReviews();
      DB.set('reviews', reviews);
    }

    const avgRatings = this.calculateAverages(reviews);

    container.innerHTML = `
      <div class="animate-fadeIn max-w-4xl mx-auto">
        
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-4">Traveler Reviews</h2>
          <p class="text-secondary max-w-2xl mx-auto">Real experiences from our passengers. We pride ourselves on transparency and continuous improvement.</p>
        </div>

        <div class="grid grid-3 gap-6 mb-12">
          <!-- Overall Rating -->
          <div class="card flex flex-col items-center justify-center text-center p-8">
            <div class="text-5xl font-bold text-accent mb-2">${avgRatings.overall.toFixed(1)}</div>
            ${this.renderStars(avgRatings.overall, true)}
            <div class="text-sm text-secondary mt-2">Based on ${reviews.length} reviews</div>
          </div>
          
          <!-- Detailed Ratings -->
          <div class="card col-span-2">
            <h3 class="font-semibold mb-4">Rating Breakdown</h3>
            <div class="space-y-4">
              ${this.renderRatingBar('Comfort', avgRatings.comfort)}
              ${this.renderRatingBar('Service', avgRatings.service)}
              ${this.renderRatingBar('Cleanliness', avgRatings.cleanliness)}
              ${this.renderRatingBar('Value', avgRatings.value)}
            </div>
          </div>
        </div>

        <!-- Review Form (Only if logged in and has completed flight) -->
        ${this.renderReviewFormSection()}

        <!-- Review List -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">Recent Reviews</h3>
          <select class="form-input w-48 text-sm bg-transparent">
            <option>Most Recent</option>
            <option>Highest Rated</option>
            <option>Lowest Rated</option>
          </select>
        </div>

        <div class="space-y-6">
          ${reviews.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => this.renderReviewCard(r)).join('')}
        </div>
      </div>
    `;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.setupReviewForm();
  },

  renderReviewFormSection() {
    if (!App.state.currentUser) return '';
    
    // Check if user has completed flights without reviews
    const completedBookings = DB.getAll('bookings').filter(b => 
      b.userId === App.state.currentUser.id && 
      (b.status === 'completed' || b.status === 'confirmed') && // allow confirmed for demo
      new Date(b.departureTime) < new Date()
    );

    if (completedBookings.length === 0) return '';

    return `
      <div class="card mb-12 border-cyan-900/50">
        <h3 class="text-xl font-bold mb-4">Write a Review</h3>
        <p class="text-sm text-secondary mb-6">You recently flew with us! How was your experience?</p>
        
        <form id="submit-review-form">
          <div class="grid grid-2 gap-8 mb-6">
            <div>
              <div class="form-group">
                <label class="form-label">Flight</label>
                <select id="review-flight" class="form-input" required>
                  ${completedBookings.map(b => `<option value="${b.id}">${b.departureAirport} to ${b.arrivalAirport} (${b.flightNumber})</option>`).join('')}
                </select>
              </div>
              
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm">Comfort</span>
                  <div class="star-rating interactable" data-category="comfort">${this.renderInteractiveStars()}</div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Service</span>
                  <div class="star-rating interactable" data-category="service">${this.renderInteractiveStars()}</div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Cleanliness</span>
                  <div class="star-rating interactable" data-category="cleanliness">${this.renderInteractiveStars()}</div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm">Value</span>
                  <div class="star-rating interactable" data-category="value">${this.renderInteractiveStars()}</div>
                </div>
              </div>
            </div>
            
            <div>
               <div class="form-group h-full flex flex-col">
                 <label class="form-label">Your Review</label>
                 <textarea id="review-text" class="form-input flex-1 resize-none" placeholder="Share your experience..." required minlength="10"></textarea>
               </div>
            </div>
          </div>
          
          <div class="flex justify-end">
             <button type="submit" class="btn btn-primary">Submit Review</button>
          </div>
        </form>
      </div>
    `;
  },

  setupReviewForm() {
    const form = document.getElementById('submit-review-form');
    if (!form) return;

    // Interactive stars
    document.querySelectorAll('.star-rating.interactable').forEach(container => {
      const stars = container.querySelectorAll('.star');
      let currentVal = 0;
      
      stars.forEach(star => {
        star.addEventListener('mouseover', () => {
          const val = parseInt(star.dataset.val);
          this.highlightStars(stars, val);
        });
        
        star.addEventListener('mouseout', () => {
          this.highlightStars(stars, currentVal);
        });
        
        star.addEventListener('click', () => {
          currentVal = parseInt(star.dataset.val);
          container.dataset.value = currentVal;
          this.highlightStars(stars, currentVal);
        });
      });
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const comfort = parseInt(document.querySelector('[data-category="comfort"]').dataset.value || 0);
      const service = parseInt(document.querySelector('[data-category="service"]').dataset.value || 0);
      const cleanliness = parseInt(document.querySelector('[data-category="cleanliness"]').dataset.value || 0);
      const value = parseInt(document.querySelector('[data-category="value"]').dataset.value || 0);
      
      if (!comfort || !service || !cleanliness || !value) {
        Toast.show('Error', 'Please rate all categories.', 'error');
        return;
      }
      
      const overall = (comfort + service + cleanliness + value) / 4;
      
      const review = {
        id: DB.generateId(),
        userId: App.state.currentUser.id,
        author: `${App.state.currentUser.firstName} ${App.state.currentUser.lastName[0]}.`,
        flightId: document.getElementById('review-flight').value,
        text: document.getElementById('review-text').value,
        ratings: { overall, comfort, service, cleanliness, value },
        date: new Date().toISOString()
      };
      
      DB.add('reviews', review);
      Toast.show('Success', 'Thank you for your review!', 'success');
      this.renderReviewsPage();
    });
  },

  highlightStars(stars, value) {
    stars.forEach(s => {
      if (parseInt(s.dataset.val) <= value) {
        s.classList.add('active');
        s.innerHTML = '★';
      } else {
        s.classList.remove('active');
        s.innerHTML = '☆';
      }
    });
  },

  renderInteractiveStars() {
    return [1,2,3,4,5].map(v => `<span class="star" data-val="${v}">☆</span>`).join('');
  },

  renderReviewCard(review) {
    const flight = DB.find('flights', review.flightId);
    let routeInfo = '';
    if (flight) {
      const airline = getAirline(flight.airlineId);
      routeInfo = `<span class="badge badge-neutral ml-2">${flight.departureAirport} → ${flight.arrivalAirport} (${airline?.shortCode})</span>`;
    }

    return `
      <div class="review-card">
        <div class="review-header justify-between">
          <div class="flex items-center gap-3">
             <div class="avatar avatar-sm bg-gray-700">${review.author[0]}</div>
             <div>
               <div class="review-author">${review.author} ${routeInfo}</div>
               <div class="review-date">${formatDate(review.date)}</div>
             </div>
          </div>
          <div class="star-rating-display text-accent flex items-center gap-2">
            <span class="font-bold">${review.ratings.overall.toFixed(1)}</span>
            <div class="flex">${this.renderStars(review.ratings.overall)}</div>
          </div>
        </div>
        
        <p class="review-text">${review.text}</p>
        
        <div class="review-ratings">
           <div class="review-rating-item">
             <span class="review-rating-label">Comfort</span>
             <div class="star-rating-display text-xs flex">${this.renderStars(review.ratings.comfort)}</div>
           </div>
           <div class="review-rating-item">
             <span class="review-rating-label">Service</span>
             <div class="star-rating-display text-xs flex">${this.renderStars(review.ratings.service)}</div>
           </div>
           <div class="review-rating-item">
             <span class="review-rating-label">Cleanliness</span>
             <div class="star-rating-display text-xs flex">${this.renderStars(review.ratings.cleanliness)}</div>
           </div>
           <div class="review-rating-item">
             <span class="review-rating-label">Value</span>
             <div class="star-rating-display text-xs flex">${this.renderStars(review.ratings.value)}</div>
           </div>
        </div>
      </div>
    `;
  },

  renderStars(rating, large = false) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    
    const sizeCls = large ? 'text-2xl' : '';
    
    let html = '';
    for(let i=0; i<full; i++) html += `<span class="star active ${sizeCls}">★</span>`;
    if(half) html += `<span class="star active half ${sizeCls}" style="opacity:0.7">★</span>`;
    for(let i=0; i<empty; i++) html += `<span class="star ${sizeCls}" style="color:var(--border-strong)">★</span>`;
    return html;
  },

  renderRatingBar(label, rating) {
    const pct = (rating / 5) * 100;
    return `
      <div class="flex items-center gap-4">
        <div class="w-24 text-sm text-secondary">${label}</div>
        <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style="width: ${pct}%"></div>
        </div>
        <div class="w-8 text-right text-sm font-semibold">${rating.toFixed(1)}</div>
      </div>
    `;
  },

  calculateAverages(reviews) {
    if(reviews.length === 0) return { overall:0, comfort:0, service:0, cleanliness:0, value:0 };
    const sums = { overall:0, comfort:0, service:0, cleanliness:0, value:0 };
    reviews.forEach(r => {
      sums.overall += r.ratings.overall;
      sums.comfort += r.ratings.comfort;
      sums.service += r.ratings.service;
      sums.cleanliness += r.ratings.cleanliness;
      sums.value += r.ratings.value;
    });
    return {
      overall: sums.overall / reviews.length,
      comfort: sums.comfort / reviews.length,
      service: sums.service / reviews.length,
      cleanliness: sums.cleanliness / reviews.length,
      value: sums.value / reviews.length
    };
  },

  generateSeedReviews() {
    return [
      {
        id: 'rev1', userId: 'usr1', author: 'Sarah M.', flightId: 'FL00000',
        text: 'Excellent service from start to finish. The plane was clean, and the staff were incredibly attentive during the long flight. Will definitely fly with them again.',
        ratings: { overall: 4.8, comfort: 4.5, service: 5, cleanliness: 5, value: 4.5 },
        date: new Date(Date.now() - 2*86400000).toISOString()
      },
      {
        id: 'rev2', userId: 'usr2', author: 'David K.', flightId: 'FL01000',
        text: 'Good flight overall, but the legroom in economy is a bit tight for a 6hr journey. Food was surprisingly good though.',
        ratings: { overall: 3.8, comfort: 3.0, service: 4, cleanliness: 4, value: 4.0 },
        date: new Date(Date.now() - 5*86400000).toISOString()
      },
      {
        id: 'rev3', userId: 'usr3', author: 'Elena R.', flightId: 'FL02000',
        text: 'Smooth booking process, easy check-in, and we arrived 15 minutes early! Can\'t ask for much more.',
        ratings: { overall: 5.0, comfort: 5, service: 5, cleanliness: 5, value: 5 },
        date: new Date(Date.now() - 10*86400000).toISOString()
      }
    ];
  }
};
