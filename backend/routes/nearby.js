const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Haversine formula — calculates distance in km between two GPS points
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/nearby?lat=12.92&lon=80.13&type=hospital
router.get('/', (req, res) => {
  const { lat, lon, type } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  // Load resources from JSON file
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../resources.json'), 'utf-8')
  );

  let results = data;

  // Filter by type if provided (hospital, police, ambulance)
  if (type) {
    results = results.filter(r => r.type === type);
  }

  // Calculate distance for each resource and filter within 10km
  results = results
    .map(r => ({
      ...r,
      distance_km: parseFloat(
        haversine(userLat, userLon, r.lat, r.lon).toFixed(2)
      )
    }))
    .filter(r => r.distance_km <= 10)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json({ count: results.length, results });
});

module.exports = router;