const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Add Auth Screen styles
const authStyle = `
/* ══════════════════════════════════
   AUTH SCREEN
══════════════════════════════════ */
#auth {
  background: var(--bg);
  align-items: center;
  justify-content: center;
  padding: 30px;
}
.auth-box {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.auth-box input {
  width: 100%;
  padding: 14px;
  border-radius: var(--r12);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
}
.auth-box input:focus {
  border-color: var(--red);
}
.auth-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--red2), var(--red-dark));
  color: white;
  font-size: 15px;
  font-weight: 800;
  border: none;
  border-radius: var(--r12);
  height: 50px;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(232,37,26,.4);
  font-family: var(--font);
}
.auth-switch {
  text-align: center;
  font-size: 12px;
  color: var(--text3);
  margin-top: 10px;
  cursor: pointer;
}
.auth-switch span {
  color: var(--red);
  font-weight: 700;
}
`;
html = html.replace('/* ── Animations ── */', authStyle + '\n/* ── Animations ── */');

// 2. Add Auth Screen HTML
const authHtml = `
    <!-- ══ AUTH ══ -->
    <div class="screen" id="auth">
      <div class="auth-box" id="login-box">
        <h2 style="font-size:24px; font-weight:800; text-align:center; margin-bottom:10px;">Welcome Back!</h2>
        <input type="email" id="login-email" placeholder="Email Address">
        <input type="password" id="login-password" placeholder="Password">
        <button class="auth-btn" onclick="doLogin()">Login</button>
        <div class="auth-switch" onclick="document.getElementById('login-box').style.display='none'; document.getElementById('register-box').style.display='flex';">
          Don't have an account? <span>Register</span>
        </div>
      </div>
      <div class="auth-box" id="register-box" style="display:none;">
        <h2 style="font-size:24px; font-weight:800; text-align:center; margin-bottom:10px;">Create Account</h2>
        <input type="text" id="reg-name" placeholder="Full Name">
        <input type="email" id="reg-email" placeholder="Email Address">
        <input type="password" id="reg-password" placeholder="Password">
        <button class="auth-btn" onclick="doRegister()">Register</button>
        <div class="auth-switch" onclick="document.getElementById('register-box').style.display='none'; document.getElementById('login-box').style.display='flex';">
          Already have an account? <span>Login</span>
        </div>
      </div>
    </div>
`;
html = html.replace('<!-- ══ HOME ══ -->', authHtml + '\n    <!-- ══ HOME ══ -->');

// 3. Add Leaflet CSS/JS
const leafletHead = `
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
`;
html = html.replace('</head>', leafletHead + '\n</head>');

// 4. Update JavaScript Logic
const authJs = `
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

async function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });
    if (res.ok) {
        currentUser = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        initApp();
        goTo('home');
    } else {
        alert('Login failed');
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const res = await fetch('/api/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password})
    });
    if (res.ok) {
        currentUser = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        initApp();
        goTo('home');
    } else {
        alert('Registration failed');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    goTo('auth');
}

function initApp() {
    if(currentUser) {
        document.querySelector('.greeting h2 em').innerText = currentUser.name.split(' ')[0] + '?';
        document.querySelector('.profile-name').innerText = currentUser.name;
        document.querySelector('.profile-email').innerText = currentUser.email;
        fetchVehicles();
        fetchBookings();
    }
}

async function fetchVehicles() {
    const res = await fetch('/api/vehicles');
    if(res.ok) {
        const vehicles = await res.json();
        renderVehicles(vehicles);
        renderMap(vehicles);
    }
}

function renderVehicles(vehicles) {
    const container = document.querySelector('.h-scroll');
    if(vehicles.length === 0) return;
    container.innerHTML = '';
    vehicles.forEach(v => {
        const card = document.createElement('div');
        card.className = 'v-card';
        card.innerHTML = \`
            <div class="v-img">
                <img src="\${v.image_url}" style="width:100%;height:100%;object-fit:cover;">
                <div class="v-tag">\${v.type}</div>
            </div>
            <div class="v-body">
                <div class="v-name">\${v.name}</div>
                <div class="v-brand">\${v.brand}</div>
                <div class="v-footer">
                    <div class="v-price"><span class="amt">₹\${v.price}</span><span class="per">/day</span></div>
                </div>
            </div>
        \`;
        card.onclick = () => showVehicleDetail(v);
        container.appendChild(card);
    });
}

function showVehicleDetail(v) {
    // Generate detail screen dynamically
    let screen = document.getElementById('detail-dynamic');
    if(!screen) {
        screen = document.createElement('div');
        screen.className = 'screen';
        screen.id = 'detail-dynamic';
        document.querySelector('.phone-screen').appendChild(screen);
    }
    
    screen.innerHTML = \`
      <div class="status-bar" style="position:absolute;top:0;left:0;right:0;background:transparent;z-index:20;">
        <span style="color:rgba(0,0,0,.6);font-weight:700;">9:41</span>
      </div>
      <div class="scroll-body">
        <div class="detail-hero" style="background-image:url('\${v.image_url}'); background-size:cover; background-position:center;">
          <div class="detail-back" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
          <div class="detail-tag-wrap"><div class="d-tag dark">\${v.type}</div></div>
        </div>
        <div class="detail-body">
          <div class="d-title-row"><div class="d-title">\${v.name}</div><div class="d-price-box"><div class="d-price-amt">₹\${v.price}</div><div class="d-price-per">/day</div></div></div>
          <div class="d-subtitle">\${v.brand} · \${v.address}</div>
          
          <div class="sec-title2">Select Dates</div>
          <div class="date-picker">
            <div class="date-box active"><label>Pick-up</label><input type="date" id="book-start" style="width:100%;border:none;background:transparent;outline:none;"></div>
            <div class="date-box"><label>Return</label><input type="date" id="book-end" style="width:100%;border:none;background:transparent;outline:none;"></div>
          </div>
          
          <div class="sec-title2">Hosted by</div>
          <div class="host-row">
            <div class="host-av">\${v.host_name[0]}</div>
            <div class="host-info"><div class="host-name">\${v.host_name}</div></div>
            \${v.upi_id ? \`<div class="host-badge">UPI: \${v.upi_id}</div>\` : ''}
            \${v.qr_code ? \`<img src="\${v.qr_code}" style="width:40px;height:40px;margin-left:10px;">\` : ''}
          </div>
        </div>
      </div>
      <div class="detail-cta">
        <button class="btn-book" onclick="bookVehicle(\${v.id}, \${v.price})">Book Now & Pay →</button>
      </div>
    \`;
    goTo('detail-dynamic');
}

async function bookVehicle(vid, price) {
    const start = document.getElementById('book-start').value || new Date().toISOString().split('T')[0];
    const end = document.getElementById('book-end').value || new Date().toISOString().split('T')[0];
    const days = Math.max(1, (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    const total = price * days;

    const rzpOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({amount: total})
    });
    const order = await rzpOrderRes.json();

    const options = {
        "key": "rzp_test_123", // Replace with real key
        "amount": order.amount,
        "currency": "INR",
        "name": "Ride It",
        "description": "Vehicle Booking",
        "order_id": order.id,
        "handler": async function (response){
            await fetch('/api/bookings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    vehicle_id: vid,
                    user_id: currentUser.id,
                    start_date: start,
                    end_date: end,
                    total_price: total,
                    payment_status: 'Paid',
                    rzp_order_id: response.razorpay_order_id,
                    rzp_payment_id: response.razorpay_payment_id
                })
            });
            goTo('success');
            fetchBookings();
        },
        "prefill": {
            "name": currentUser.name,
            "email": currentUser.email
        },
        "theme": {
            "color": "#E8251A"
        }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();
}

async function fetchBookings() {
    if(!currentUser) return;
    const res = await fetch('/api/bookings/' + currentUser.id);
    if(res.ok) {
        const bookings = await res.json();
        // Render bookings...
    }
}

let map;
function renderMap(vehicles) {
    const mapArea = document.querySelector('.map-area');
    mapArea.innerHTML = '<div id="map" style="width:100%;height:100%;"></div>';
    map = L.map('map').setView([19.0760, 72.8777], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    vehicles.forEach(v => {
        if(v.location_lat && v.location_lng) {
            L.marker([v.location_lat, v.location_lng]).addTo(map)
                .bindPopup(v.name + ' - ₹' + v.price);
        }
    });
}
`;

html = html.replace("setTimeout(() => goTo('home'), 2000);", `
setTimeout(() => {
    if (currentUser) {
        initApp();
        goTo('home');
    } else {
        goTo('auth');
    }
}, 2000);

${authJs}
`);

// 5. Add file input for listing and profile update
const listFormPatch = `
          <input type="file" id="list-image" accept="image/*" style="margin-top:20px;">
          <input type="text" id="list-name" placeholder="Vehicle Name" style="margin-top:10px;padding:10px;width:100%;">
          <input type="text" id="list-brand" placeholder="Brand" style="margin-top:10px;padding:10px;width:100%;">
          <input type="number" id="list-price" placeholder="Price/Day" style="margin-top:10px;padding:10px;width:100%;">
          <input type="text" id="list-address" placeholder="Address" style="margin-top:10px;padding:10px;width:100%;">
          <button style="margin-top:20px;padding:15px;background:var(--red);color:white;width:100%;border-radius:10px;" onclick="submitListing()">Submit Listing</button>
`;
// Replace the list steps with a simple form for now, or just append to list-step1
html = html.replace('<div class="sec-title2">What type of vehicle?</div>', listFormPatch + '<div class="sec-title2" style="display:none;">What type of vehicle?</div>');

const listScript = `
async function submitListing() {
    const file = document.getElementById('list-image').files[0];
    const name = document.getElementById('list-name').value;
    const brand = document.getElementById('list-brand').value;
    const price = document.getElementById('list-price').value;
    const address = document.getElementById('list-address').value;

    const fd = new FormData();
    fd.append('user_id', currentUser.id);
    fd.append('name', name);
    fd.append('brand', brand);
    fd.append('price', price);
    fd.append('address', address);
    fd.append('type', 'Car');
    fd.append('location_lat', 19.07 + Math.random()*0.1);
    fd.append('location_lng', 72.87 + Math.random()*0.1);
    if(file) fd.append('image', file);

    await fetch('/api/vehicles', { method: 'POST', body: fd });
    fetchVehicles();
    goTo('home');
}
`;
html = html.replace('// Auto-advance splash', listScript + '\n// Auto-advance splash');

// Update Profile UPI ID/QR
const profilePatch = `
          <div style="padding: 20px;">
            <div class="sec-title2">Payment Settings</div>
            <input type="text" id="profile-upi" placeholder="UPI ID" style="padding:10px;width:100%;margin-bottom:10px;">
            <label style="font-size:12px;color:var(--text3);">Upload QR Code</label>
            <input type="file" id="profile-qr" accept="image/*" style="margin-bottom:10px;width:100%;">
            <button onclick="updateProfile()" style="padding:10px;background:var(--blue);color:white;border-radius:10px;width:100%;">Update</button>
          </div>
`;
html = html.replace('<div class="section-label">Account</div>', profilePatch + '<div class="section-label">Account</div>');

const profileScript = `
async function updateProfile() {
    const upi = document.getElementById('profile-upi').value;
    const qrFile = document.getElementById('profile-qr').files[0];
    
    const fd = new FormData();
    fd.append('user_id', currentUser.id);
    fd.append('upi_id', upi);
    if(qrFile) fd.append('qr_code', qrFile);

    const res = await fetch('/api/profile/update', { method: 'POST', body: fd });
    if(res.ok) alert('Profile updated!');
}
`;
html = html.replace('// Auto-advance splash', profileScript + '\n// Auto-advance splash');


fs.writeFileSync('public/index.html', html);
console.log('Patched index.html');
