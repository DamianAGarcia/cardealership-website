const grid = document.getElementById('grid');
const countLabel = document.querySelector('.count');
const chips = document.querySelectorAll('.chip');

let allListings = [];
let activeType = 'all';
let activePrice = null;

const placeholderSVG = `
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M15 68 Q15 50 35 48 L55 30 Q65 22 80 22 L130 22 Q145 22 155 32 L172 48 Q188 50 188 68 L188 78 L15 78 Z" fill="#3A3A3D"/>
    <circle cx="52" cy="80" r="13" fill="#0B0B0C"/><circle cx="52" cy="80" r="5" fill="#DCDCDF"/>
    <circle cx="150" cy="80" r="13" fill="#0B0B0C"/><circle cx="150" cy="80" r="5" fill="#DCDCDF"/>
    <path d="M62 32 L78 24 L128 24 L148 32 Z" fill="#5A5A5E"/>
  </svg>`;

function formatPrice(n){
  return '$' + Number(n).toLocaleString('en-US');
}
function formatMiles(n){
  return Number(n).toLocaleString('en-US') + ' mi';
}
function bodyLabel(type){
  const labels = { sedan:'Sedan', suv:'SUV', truck:'Pickup', coupe:'Coupe', wagon:'Wagon', other:'Vehicle' };
  return labels[type] || 'Vehicle';
}

function cardHTML(car){
  const photo = (car.photo_urls && car.photo_urls.length)
    ? `<img src="${car.photo_urls[0]}" alt="${car.year} ${car.make} ${car.model}">`
    : placeholderSVG;
  const trimText = [bodyLabel(car.body_type), car.transmission].filter(Boolean).join(' · ');
  return `
    <div class="card" data-type="${car.body_type}" data-price="${car.price}">
      <div class="photo">${photo}</div>
      <div class="perforation"></div>
      <div class="details">
        <div class="title">${car.year} ${car.make} ${car.model}${car.trim ? ' ' + car.trim : ''}</div>
        <div class="trim">${trimText}</div>
        <div class="price-row">
          <span class="price">${formatPrice(car.price)}</span>
          <span class="price-label">as shown</span>
        </div>
        <div class="specs">
          <span>${formatMiles(car.mileage)}</span><span>·</span>
          <span>${car.fuel_type || 'Gas'}</span>
          ${car.condition_note ? `<span>·</span><span>${car.condition_note}</span>` : ''}
        </div>
        <button class="btn-card" onclick="location.href='tel:+12813880775'">Text about this car</button>
      </div>
    </div>`;
}

function render(){
  const visible = allListings.filter(car => {
    const typeOk = activeType === 'all' || car.body_type === activeType;
    const priceOk = !activePrice || Number(car.price) <= activePrice;
    return typeOk && priceOk;
  });

  countLabel.textContent = visible.length + ' vehicle' + (visible.length === 1 ? '' : 's');

  if (visible.length === 0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <h3>No matching cars right now</h3>
      <p>Try a different filter, or check back soon — new inventory is added regularly.</p>
    </div>`;
    return;
  }

  grid.innerHTML = visible.map(cardHTML).join('');
}

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (chip.dataset.type){
      chips.forEach(c => { if (c.dataset.type) c.classList.remove('active'); });
      chip.classList.add('active');
      activeType = chip.dataset.type;
    }
    if (chip.dataset.price){
      const isActive = chip.classList.contains('active');
      chips.forEach(c => { if (c.dataset.price) c.classList.remove('active'); });
      if (!isActive){ chip.classList.add('active'); activePrice = Number(chip.dataset.price); }
      else { activePrice = null; }
    }
    render();
  });
});

async function loadListings(){
  grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Loading inventory…</h3></div>`;
  const { data, error } = await supabaseClient
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <h3>Couldn't load inventory</h3>
      <p>${error.message}</p>
    </div>`;
    return;
  }

  allListings = data;
  render();
}

loadListings();
