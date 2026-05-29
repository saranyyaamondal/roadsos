const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const toR  = d => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a    = Math.sin(dLat/2)**2 +
               Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /api/nearby?lat=&lon=&type=&radius=
router.get('/', (req, res) => {
  const { lat, lon, type } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);
  const radius  = parseFloat(req.query.radius) || 100; // default 100 km

  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../resources.json'), 'utf-8')
  );

  let results = type ? data.filter(r => r.type === type) : data;

  results = results
    .map(r => ({
      ...r,
      distance_km: parseFloat(haversine(userLat, userLon, r.lat, r.lon).toFixed(2))
    }))
    .filter(r => r.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km); // nearest first

  res.json({ count: results.length, results });
});

module.exports = router;