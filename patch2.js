const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// The profile menu items look like this:
// <div class="menu-item">
//   <div class="m-ico red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
//   <div class="m-text"><div class="m-label">Personal Info</div>...
// Let's replace each specific one using its inner text.

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">Personal Info<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-personal')">$1`
);

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">Payment Methods<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-payment')">$1`
);

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">Verification<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-verify')">$1`
);

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">My Listings<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-listings')">$1`
);

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">Reviews<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-reviews')">$1`
);

html = html.replace(
  /<div class="menu-item">(\s*<div class="m-ico [^>]*>.*?<\/div>\s*<div class="m-text"><div class="m-label">Notifications<\/div>)/g,
  `<div class="menu-item" onclick="goTo('profile-notifications')">$1`
);

// We need to build the 6 screens
const profileScreens = `
    <!-- PROFILE SCREENS -->
    <div class="screen" id="profile-personal">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">Personal Info</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;">
            <label style="font-size:12px;color:var(--text3);">Full Name</label>
            <input type="text" id="pi-name" style="width:100%;padding:12px;margin-bottom:15px;border-radius:10px;border:1px solid var(--border);">
            <label style="font-size:12px;color:var(--text3);">Email</label>
            <input type="email" id="pi-email" style="width:100%;padding:12px;margin-bottom:15px;border-radius:10px;border:1px solid var(--border);">
            <label style="font-size:12px;color:var(--text3);">Phone Number</label>
            <input type="text" id="pi-phone" style="width:100%;padding:12px;margin-bottom:20px;border-radius:10px;border:1px solid var(--border);">
            <button onclick="savePersonalInfo()" class="btn-book" style="width:100%;">Save Changes</button>
        </div>
    </div>

    <div class="screen" id="profile-payment">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">Payment Methods</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;" id="payment-methods-container">
            <!-- Payment settings logic moved here via JS or replaced -->
        </div>
    </div>

    <div class="screen" id="profile-verify">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">Verification Docs</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;">
            <label style="font-size:12px;color:var(--text3);">Government ID</label>
            <input type="file" id="vf-id" style="width:100%;margin-bottom:15px;padding:10px;">
            <label style="font-size:12px;color:var(--text3);">Driving License</label>
            <input type="file" id="vf-license" style="width:100%;margin-bottom:20px;padding:10px;">
            <button onclick="saveVerification()" class="btn-book" style="width:100%;">Upload Documents</button>
        </div>
    </div>

    <div class="screen" id="profile-listings">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">My Listings</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;">
            <div id="my-listings-container" style="display:flex;flex-direction:column;gap:15px;"></div>
        </div>
    </div>

    <div class="screen" id="profile-reviews">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">Reviews</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;">
            <div style="text-align:center;padding:50px 0;">
                <div style="font-size:48px;">⭐</div>
                <div style="font-size:18px;font-weight:800;">4.9 Average Rating</div>
                <div style="color:var(--text3);font-size:13px;margin-top:10px;">Your guests love you! No new reviews to show.</div>
            </div>
        </div>
    </div>

    <div class="screen" id="profile-notifications">
        <div class="search-screen-header">
            <div class="search-top-row">
                <div class="back-btn" onclick="goBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                <div style="font-weight:800;font-size:18px;">Notifications</div>
            </div>
        </div>
        <div class="scroll-body" style="padding: 20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 0;border-bottom:1px solid var(--border);">
                <div><div style="font-weight:700;">Push Notifications</div><div style="font-size:11px;color:var(--text3);">Get alerts on your phone</div></div>
                <input type="checkbox" id="notif-push" style="width:20px;height:20px;" checked>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 0;border-bottom:1px solid var(--border);">
                <div><div style="font-weight:700;">Email Alerts</div><div style="font-size:11px;color:var(--text3);">Receive booking confirmations</div></div>
                <input type="checkbox" id="notif-email" style="width:20px;height:20px;" checked>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 0;border-bottom:1px solid var(--border);">
                <div><div style="font-weight:700;">SMS Notifications</div><div style="font-size:11px;color:var(--text3);">Get text messages for trips</div></div>
                <input type="checkbox" id="notif-sms" style="width:20px;height:20px;" checked>
            </div>
            <button onclick="saveNotifications()" class="btn-book" style="width:100%;margin-top:20px;">Save Preferences</button>
        </div>
    </div>
`;

html = html.replace('<!-- phone-screen -->', profileScreens + '\n  </div><!-- phone-screen -->');

// Also move the payment settings UI inside profile-payment and clean up the profile page
html = html.replace(
  /<div style="padding: 20px;">\s*<div class="sec-title2">Payment Settings<\/div>[\s\S]*?<\/div>\s*<div class="section-label">Account<\/div>/,
  '<div class="section-label">Account</div>'
);

// We add JS for handling these new features
const extraJs = `
function populateProfileForms() {
    if(!currentUser) return;
    document.getElementById('pi-name').value = currentUser.name || '';
    document.getElementById('pi-email').value = currentUser.email || '';
    document.getElementById('pi-phone').value = currentUser.phone || '';
    
    document.getElementById('notif-push').checked = currentUser.notif_push !== 0;
    document.getElementById('notif-email').checked = currentUser.notif_email !== 0;
    document.getElementById('notif-sms').checked = currentUser.notif_sms !== 0;
    
    // Inject payment settings into payment screen
    document.getElementById('payment-methods-container').innerHTML = \`
        <div class="sec-title2">Setup UPI & QR</div>
        <input type="text" id="profile-upi" placeholder="UPI ID" value="\${currentUser.upi_id || ''}" style="padding:10px;width:100%;margin-bottom:10px;border-radius:8px;border:1px solid var(--border);">
        <label style="font-size:12px;color:var(--text3);">Upload QR Code</label>
        <input type="file" id="profile-qr" accept="image/*" style="margin-bottom:20px;width:100%;">
        \${currentUser.qr_code ? '<div style="margin-bottom:10px;font-size:12px;color:green;">✅ QR code is uploaded</div>' : ''}
        <button onclick="updateProfile()" class="btn-book" style="width:100%;">Save Payment Methods</button>
    \`;
}

async function savePersonalInfo() {
    const name = document.getElementById('pi-name').value;
    const email = document.getElementById('pi-email').value;
    const phone = document.getElementById('pi-phone').value;
    const res = await fetch('/api/profile/personal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: currentUser.id, name, email, phone})
    });
    if(res.ok) {
        currentUser.name = name; currentUser.email = email; currentUser.phone = phone;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        initApp();
        alert('Personal Info saved!');
        goBack();
    }
}

async function saveVerification() {
    const idFile = document.getElementById('vf-id').files[0];
    const licenseFile = document.getElementById('vf-license').files[0];
    const fd = new FormData();
    fd.append('user_id', currentUser.id);
    if(idFile) fd.append('id_doc', idFile);
    if(licenseFile) fd.append('license_doc', licenseFile);
    
    const res = await fetch('/api/profile/verify', { method: 'POST', body: fd });
    if(res.ok) {
        const data = await res.json();
        if(data.id_url) currentUser.id_url = data.id_url;
        if(data.license_url) currentUser.license_url = data.license_url;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Documents uploaded successfully!');
        goBack();
    }
}

async function saveNotifications() {
    const push = document.getElementById('notif-push').checked ? 1 : 0;
    const email = document.getElementById('notif-email').checked ? 1 : 0;
    const sms = document.getElementById('notif-sms').checked ? 1 : 0;
    const res = await fetch('/api/profile/notifications', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: currentUser.id, notif_push: push, notif_email: email, notif_sms: sms})
    });
    if(res.ok) {
        currentUser.notif_push = push; currentUser.notif_email = email; currentUser.notif_sms = sms;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Notifications updated!');
        goBack();
    }
}

// Override initApp to populate profile forms
const origInitApp = initApp;
initApp = function() {
    origInitApp();
    populateProfileForms();
    renderMyListings();
};

async function renderMyListings() {
    const res = await fetch('/api/vehicles');
    if(!res.ok) return;
    const allVehicles = await res.json();
    const myVehicles = allVehicles.filter(v => v.user_id === currentUser.id);
    const container = document.getElementById('my-listings-container');
    
    if(myVehicles.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:30px;">No vehicles listed yet.</div>';
        return;
    }
    
    container.innerHTML = '';
    myVehicles.forEach(v => {
        container.innerHTML += \`
            <div style="display:flex;gap:12px;background:var(--surface);padding:10px;border-radius:12px;border:1px solid var(--border);">
                <img src="\${v.image_url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">
                <div style="flex:1;">
                    <div style="font-weight:800;font-size:15px;">\${v.name}</div>
                    <div style="font-size:11px;color:var(--text3);">\${v.brand}</div>
                    <div style="margin-top:10px;font-weight:700;color:var(--red);">₹\${v.price}/day</div>
                </div>
            </div>
        \`;
    });
}
`;

html = html.replace('// Auto-advance splash', extraJs + '\n// Auto-advance splash');

fs.writeFileSync('public/index.html', html);
console.log('Patch complete.');
