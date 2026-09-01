const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const logoutBtn = document.getElementById('logout-btn');

const carForm = document.getElementById('car-form');
const carMsg = document.getElementById('car-msg');
const submitBtn = document.getElementById('submit-btn');
const photoInput = document.getElementById('photo-input');
const photoDrop = document.getElementById('photo-drop');
const photoPreviews = document.getElementById('photo-previews');
const listingsList = document.getElementById('listings-list');
const listingsCount = document.getElementById('listings-count');

let selectedFiles = [];
const HOME_PAGE = 'index.html';

/* ---------- Auth gating ---------- */

async function checkSession(){
  const { data } = await supabaseClient.auth.getSession();
  if (data.session){
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin(){
  loginView.style.display = '';
  dashboardView.style.display = 'none';
}

function showDashboard(){
  loginView.style.display = 'none';
  dashboardView.style.display = '';
  loadListings();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.style.display = 'none';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error){
    loginMsg.textContent = error.message;
    loginMsg.className = 'msg msg-error';
    loginMsg.style.display = '';
    return;
  }

  window.location.assign(HOME_PAGE);
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* ---------- Photo picker ---------- */

photoDrop.addEventListener('click', () => photoInput.click());
photoDrop.addEventListener('dragover', (e) => { e.preventDefault(); photoDrop.classList.add('dragover'); });
photoDrop.addEventListener('dragleave', () => photoDrop.classList.remove('dragover'));
photoDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  photoDrop.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});
photoInput.addEventListener('change', () => addFiles(photoInput.files));

function addFiles(fileList){
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  selectedFiles = selectedFiles.concat(files);
  renderPreviews();
}

function renderPreviews(){
  photoPreviews.innerHTML = '';
  selectedFiles.forEach((file) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    photoPreviews.appendChild(img);
  });
}

/* ---------- Add car form ---------- */

carForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  carMsg.style.display = 'none';

  if (selectedFiles.length === 0){
    carMsg.textContent = 'Add at least one photo before saving.';
    carMsg.className = 'msg msg-error';
    carMsg.style.display = '';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    const photoUrls = [];
    for (const file of selectedFiles){
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('car-photos')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseClient.storage
        .from('car-photos')
        .getPublicUrl(path);
      photoUrls.push(publicUrlData.publicUrl);
    }

    const newCar = {
      year: Number(document.getElementById('field-year').value),
      make: document.getElementById('field-make').value.trim(),
      model: document.getElementById('field-model').value.trim(),
      trim: document.getElementById('field-trim').value.trim(),
      price: Number(document.getElementById('field-price').value),
      mileage: Number(document.getElementById('field-mileage').value),
      body_type: document.getElementById('field-body').value,
      fuel_type: document.getElementById('field-fuel').value,
      transmission: document.getElementById('field-transmission').value,
      condition_note: document.getElementById('field-condition').value.trim(),
      description: document.getElementById('field-description').value.trim(),
      photo_urls: photoUrls
    };

    const { error: insertError } = await supabaseClient.from('listings').insert(newCar);
    if (insertError) throw insertError;

    carMsg.textContent = 'Car added to the lot.';
    carMsg.className = 'msg msg-success';
    carMsg.style.display = '';
    carForm.reset();
    selectedFiles = [];
    photoPreviews.innerHTML = '';
    loadListings();

  } catch (err){
    carMsg.textContent = err.message || 'Something went wrong. Try again.';
    carMsg.className = 'msg msg-error';
    carMsg.style.display = '';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add to the lot';
  }
});

/* ---------- Listings management + one-button remove ---------- */

async function loadListings(){
  listingsList.innerHTML = '<p style="color:var(--gray-500); font-size:14px;">Loading…</p>';
  const { data, error } = await supabaseClient
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error){
    listingsList.innerHTML = `<p style="color:var(--red-dark); font-size:14px;">${error.message}</p>`;
    return;
  }

  listingsCount.textContent = data.length + ' vehicle' + (data.length === 1 ? '' : 's');

  if (data.length === 0){
    listingsList.innerHTML = '<p style="color:var(--gray-500); font-size:14px;">No cars listed yet. Add your first one on the left.</p>';
    return;
  }

  listingsList.innerHTML = data.map(car => `
    <div class="admin-row" data-id="${car.id}">
      <img src="${car.photo_urls && car.photo_urls[0] ? car.photo_urls[0] : ''}" alt="">
      <div class="info">
        <div class="title">${car.year} ${car.make} ${car.model}</div>
        <div class="sub">$${Number(car.price).toLocaleString('en-US')} · ${Number(car.mileage).toLocaleString('en-US')} mi</div>
      </div>
      <button class="btn-remove" data-id="${car.id}">Remove</button>
    </div>
  `).join('');

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => handleRemoveClick(btn));
  });
}

// Two-tap remove: first click arms it ("Confirm remove?"), second click
// within 3 seconds actually deletes. Keeps it to one button, with a
// built-in guard against accidental taps.
function handleRemoveClick(btn){
  if (!btn.classList.contains('confirming')){
    btn.classList.add('confirming');
    btn.textContent = 'Confirm remove?';
    btn.dataset.timer = setTimeout(() => {
      btn.classList.remove('confirming');
      btn.textContent = 'Remove';
    }, 3000);
    return;
  }

  clearTimeout(btn.dataset.timer);
  deleteListing(btn.dataset.id, btn);
}

async function deleteListing(id, btn){
  btn.disabled = true;
  btn.textContent = 'Removing…';

  const { error } = await supabaseClient.from('listings').delete().eq('id', id);
  if (error){
    alert('Could not remove this listing: ' + error.message);
    btn.disabled = false;
    btn.classList.remove('confirming');
    btn.textContent = 'Remove';
    return;
  }

  loadListings();
}

checkSession();
