const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const Razorpay = require('razorpay');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const isVercel = process.env.VERCEL === '1';

app.use(express.static(path.join(__dirname, 'public')));
if (isVercel) {
    app.use('/uploads', express.static('/tmp'));
}

// Configure Multer for File Uploads
const uploadDir = isVercel ? '/tmp' : './public/uploads/';
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Initialize SQLite Database
const dbPath = isVercel ? '/tmp/database.db' : './database.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Setup Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        password TEXT,
        upi_id TEXT,
        qr_code TEXT,
        id_url TEXT,
        license_url TEXT,
        notif_push INTEGER DEFAULT 1,
        notif_email INTEGER DEFAULT 1,
        notif_sms INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        brand TEXT,
        price INTEGER,
        type TEXT,
        location_lat REAL,
        location_lng REAL,
        address TEXT,
        image_url TEXT,
        phone TEXT,
        owner_name TEXT,
        dob TEXT,
        aadhar_url TEXT,
        license_url TEXT,
        insurance_url TEXT,
        rc_url TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER,
        user_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        total_price INTEGER,
        payment_status TEXT,
        rzp_order_id TEXT,
        rzp_payment_id TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// User Registration
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, name, email });
    });
});

// User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
        if (err || !row) return res.status(401).json({ error: 'Invalid credentials' });
        res.json(row);
    });
});

// Update Profile (UPI ID / QR)
app.post('/api/profile/update', upload.single('qr_code'), (req, res) => {
    const { user_id, upi_id } = req.body;
    const qr_code = req.file ? `/uploads/${req.file.filename}` : null;
    let query, params;
    if (qr_code) {
        query = 'UPDATE users SET upi_id = ?, qr_code = ? WHERE id = ?';
        params = [upi_id, qr_code, user_id];
    } else {
        query = 'UPDATE users SET upi_id = ? WHERE id = ?';
        params = [upi_id, user_id];
    }
    db.run(query, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ success: true, qr_code });
    });
});

// Update Personal Info
app.post('/api/profile/personal', (req, res) => {
    const { user_id, name, email, phone } = req.body;
    db.run('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, user_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update Verification Docs
app.post('/api/profile/verify', upload.fields([{name:'id_doc', maxCount:1}, {name:'license_doc', maxCount:1}]), (req, res) => {
    const { user_id } = req.body;
    const id_url = req.files['id_doc'] ? `/uploads/${req.files['id_doc'][0].filename}` : null;
    const license_url = req.files['license_doc'] ? `/uploads/${req.files['license_doc'][0].filename}` : null;
    
    let updates = [];
    let params = [];
    if(id_url) { updates.push('id_url = ?'); params.push(id_url); }
    if(license_url) { updates.push('license_url = ?'); params.push(license_url); }
    
    if(updates.length === 0) return res.json({success: true});
    params.push(user_id);
    
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ success: true, id_url, license_url });
    });
});

// Update Notifications
app.post('/api/profile/notifications', (req, res) => {
    const { user_id, notif_push, notif_email, notif_sms } = req.body;
    db.run('UPDATE users SET notif_push = ?, notif_email = ?, notif_sms = ? WHERE id = ?', 
        [notif_push, notif_email, notif_sms, user_id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get User Profile Data
app.get('/api/users/:id', (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});


// List Vehicle
app.post('/api/vehicles', upload.fields([
    {name: 'image', maxCount: 1},
    {name: 'aadhar', maxCount: 1},
    {name: 'license', maxCount: 1},
    {name: 'insurance', maxCount: 1},
    {name: 'rc', maxCount: 1}
]), (req, res) => {
    const { user_id, name, brand, price, type, location_lat, location_lng, address, phone, owner_name, dob } = req.body;
    const image_url = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const aadhar_url = req.files['aadhar'] ? `/uploads/${req.files['aadhar'][0].filename}` : null;
    const license_url = req.files['license'] ? `/uploads/${req.files['license'][0].filename}` : null;
    const insurance_url = req.files['insurance'] ? `/uploads/${req.files['insurance'][0].filename}` : null;
    const rc_url = req.files['rc'] ? `/uploads/${req.files['rc'][0].filename}` : null;
    
    db.run(`INSERT INTO vehicles (user_id, name, brand, price, type, location_lat, location_lng, address, image_url, phone, owner_name, dob, aadhar_url, license_url, insurance_url, rc_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, name, brand, price, type, location_lat, location_lng, address, image_url, phone, owner_name, dob, aadhar_url, license_url, insurance_url, rc_url],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, image_url });
        }
    );
});

// Get Vehicles
app.get('/api/vehicles', (req, res) => {
    db.all(`SELECT vehicles.*, users.name as host_name, users.upi_id, users.qr_code 
            FROM vehicles JOIN users ON vehicles.user_id = users.id`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Razorpay Order
const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_123'
});

app.post('/api/create-order', async (req, res) => {
    const { amount } = req.body;
    try {
        const order = await rzp.orders.create({
            amount: amount * 100, // in paise
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Booking
app.post('/api/bookings', (req, res) => {
    const { vehicle_id, user_id, start_date, end_date, total_price, payment_status, rzp_order_id, rzp_payment_id } = req.body;
    db.run(`INSERT INTO bookings (vehicle_id, user_id, start_date, end_date, total_price, payment_status, rzp_order_id, rzp_payment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [vehicle_id, user_id, start_date, end_date, total_price, payment_status, rzp_order_id, rzp_payment_id],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.get('/api/bookings/:userId', (req, res) => {
    const userId = req.params.userId;
    db.all(`SELECT bookings.*, vehicles.name, vehicles.image_url 
            FROM bookings JOIN vehicles ON bookings.vehicle_id = vehicles.id 
            WHERE bookings.user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    db.run(`DELETE FROM bookings WHERE id = ?`, [bookingId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !isVercel) {
    app.listen(PORT, () => {
        console.log('Server is running on port ' + PORT);
    });
}

module.exports = app;
