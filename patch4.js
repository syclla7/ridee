const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace the entire list-vehicle screen
const newListingScreen = `
    <div class="screen" id="list-vehicle">
      <div class="confirm-header">
        <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
        <span class="confirm-title">List Your Vehicle</span>
      </div>
      <div class="scroll-body" style="padding:20px 20px 100px;">
          <div style="font-size:18px;font-weight:800;margin-bottom:15px;">Vehicle Details</div>
          <input type="text" id="v-name" placeholder="Vehicle Name (e.g. Swift, Thar)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <input type="text" id="v-brand" placeholder="Brand" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <input type="number" id="v-price" placeholder="Price per day (₹)" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <select id="v-type" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
            <option>Car</option><option>Bike</option><option>Van</option><option>Bus</option><option>Truck</option><option>Sports</option><option>Electric</option>
          </select>
          
          <div style="font-size:18px;font-weight:800;margin-top:20px;margin-bottom:15px;">Personal Details (KYC)</div>
          <input type="text" id="v-owner" placeholder="Full Legal Name" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <input type="date" id="v-dob" placeholder="Date of Birth" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <input type="tel" id="v-phone" placeholder="Phone Number" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          
          <div style="font-size:18px;font-weight:800;margin-top:20px;margin-bottom:15px;">Location</div>
          <input type="text" id="v-address" placeholder="Address" style="width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
          <div style="display:flex;gap:10px;margin-bottom:10px;">
              <input type="number" id="v-lat" placeholder="Latitude" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border);">
              <input type="number" id="v-lng" placeholder="Longitude" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border);">
          </div>
          <button onclick="getListingLocation()" class="btn-book" style="width:100%;background:#EFF6FF;color:var(--blue);margin-bottom:20px;">📍 Pin My Location (GPS)</button>

          <div style="font-size:18px;font-weight:800;margin-top:20px;margin-bottom:15px;">Photos & Documents</div>
          <label style="font-size:12px;color:var(--text3);font-weight:bold;">Vehicle Main Photo</label>
          <input type="file" id="v-image" accept="image/*" style="width:100%;margin-bottom:15px;">
          
          <label style="font-size:12px;color:var(--text3);font-weight:bold;">Aadhar Card</label>
          <input type="file" id="v-aadhar" accept="image/*,.pdf" style="width:100%;margin-bottom:15px;">
          
          <label style="font-size:12px;color:var(--text3);font-weight:bold;">Driving License</label>
          <input type="file" id="v-license" accept="image/*,.pdf" style="width:100%;margin-bottom:15px;">
          
          <label style="font-size:12px;color:var(--text3);font-weight:bold;">Vehicle RC</label>
          <input type="file" id="v-rc" accept="image/*,.pdf" style="width:100%;margin-bottom:15px;">
          
          <label style="font-size:12px;color:var(--text3);font-weight:bold;">Valid Car Insurance</label>
          <input type="file" id="v-insurance" accept="image/*,.pdf" style="width:100%;margin-bottom:25px;">
          
          <button onclick="submitVehicle()" class="btn-book" style="width:100%;">Upload & List Vehicle</button>
      </div>
    </div>
`;

// Replace from <div class="screen" id="list-vehicle"> to the end of that screen (before id="list-step2")
const startStr = '<div class="screen" id="list-vehicle">';
const endStr = '<!-- LISTING STEP 2: Pricing & Location -->';

if (html.includes(startStr) && html.includes(endStr)) {
    const p1 = html.indexOf(startStr);
    const p2 = html.indexOf(endStr);
    html = html.substring(0, p1) + newListingScreen + '\\n    ' + html.substring(p2);
}

// Append the necessary JS functions before </script>
const newJs = \`
async function submitVehicle() {
    if(!currentUser) { alert('Please log in first!'); return; }
    
    const btn = document.querySelector('#list-vehicle button[onclick="submitVehicle()"]');
    btn.innerText = 'Uploading... Please wait.';
    btn.disabled = true;

    try {
        const fd = new FormData();
        fd.append('user_id', currentUser.id);
        fd.append('name', document.getElementById('v-name').value);
        fd.append('brand', document.getElementById('v-brand').value);
        fd.append('price', document.getElementById('v-price').value);
        fd.append('type', document.getElementById('v-type').value);
        
        fd.append('owner_name', document.getElementById('v-owner').value);
        fd.append('dob', document.getElementById('v-dob').value);
        fd.append('phone', document.getElementById('v-phone').value);

        fd.append('address', document.getElementById('v-address').value);
        fd.append('location_lat', document.getElementById('v-lat').value);
        fd.append('location_lng', document.getElementById('v-lng').value);

        const img = document.getElementById('v-image').files[0];
        if(img) fd.append('image', img);
        const aadhar = document.getElementById('v-aadhar').files[0];
        if(aadhar) fd.append('aadhar', aadhar);
        const license = document.getElementById('v-license').files[0];
        if(license) fd.append('license', license);
        const rc = document.getElementById('v-rc').files[0];
        if(rc) fd.append('rc', rc);
        const insurance = document.getElementById('v-insurance').files[0];
        if(insurance) fd.append('insurance', insurance);

        const res = await fetch('/api/vehicles', { method: 'POST', body: fd });
        if(res.ok) {
            alert('Vehicle successfully listed and all documents securely uploaded!');
            fetchVehicles();
            goTo('home');
        } else {
            const text = await res.text();
            alert('Error: ' + text);
        }
    } catch(e) {
        alert('An error occurred: ' + e.message);
    } finally {
        btn.innerText = 'Upload & List Vehicle';
        btn.disabled = false;
    }
}

function getListingLocation() {
    if (navigator.geolocation) {
        document.getElementById('v-lat').value = 'Locating...';
        document.getElementById('v-lng').value = 'Locating...';
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('v-lat').value = pos.coords.latitude;
            document.getElementById('v-lng').value = pos.coords.longitude;
            // Optionally reverse geocode:
            fetch(\\\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\\\${pos.coords.latitude}&lon=\\\${pos.coords.longitude}\\\`)
                .then(r => r.json())
                .then(data => {
                    if(data.display_name) document.getElementById('v-address').value = data.display_name;
                });
        }, (err) => {
            alert('Unable to retrieve location. Please ensure location services are enabled.');
            document.getElementById('v-lat').value = '';
            document.getElementById('v-lng').value = '';
        });
    } else {
        alert('Geolocation not supported.');
    }
}
\`;

html = html.replace('</script>', newJs + '\\n</script>');

fs.writeFileSync('public/index.html', html);
console.log('Patch complete.');
