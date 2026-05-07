const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');
db.serialize(() => {
  db.get('SELECT COUNT(*) as count FROM vehicles', (err, row) => {
    if(!err && row.count === 0) {
      db.run("INSERT OR IGNORE INTO users (id, name, email, password) VALUES (999, 'Auto Host', 'auto@rideit.app', 'pass')", () => {
        const dummyVehicles = [
          [999, 'Mahindra Thar 4x4', 'Mahindra', 3500, 'Car', 19.1136, 72.8697, 'Andheri East, Mumbai', 'https://images.unsplash.com/photo-1629851610488-812eeb8d0966?auto=format&fit=crop&q=80&w=800'],
          [999, 'Royal Enfield Classic', 'Royal Enfield', 1200, 'Bike', 19.0596, 72.8295, 'Bandra West, Mumbai', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800'],
          [999, 'Tata Nexon EV', 'Tata', 2500, 'Electric', 19.0176, 72.8562, 'Dadar, Mumbai', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800'],
          [999, 'Porsche 911 Carrera', 'Porsche', 15000, 'Sports', 18.9220, 72.8347, 'Colaba, Mumbai', 'https://images.unsplash.com/photo-1503376712344-65f57f673551?auto=format&fit=crop&q=80&w=800']
        ];
        const stmt = db.prepare('INSERT INTO vehicles (user_id, name, brand, price, type, location_lat, location_lng, address, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        dummyVehicles.forEach(v => stmt.run(v));
        stmt.finalize(() => {
          console.log('Successfully seeded dummy vehicles!');
        });
      });
    } else {
      console.log('Vehicles already exist.');
    }
  });
});
