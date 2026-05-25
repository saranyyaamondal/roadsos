require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const nearbyRoute      = require('./routes/nearby');
const triageRoute      = require('./routes/triageAI');   // M6 AI version
const alertRoute       = require('./routes/alert');
const photoVerifyRoute = require('./routes/photoVerify'); // M6 Vision

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // needed for base64 images

// Routes
app.use('/api/nearby',        nearbyRoute);
app.use('/api/triage',        triageRoute);
app.use('/api/alert',         alertRoute);
app.use('/api/photo-verify',  photoVerifyRoute);

// Health check
app.get('/', (req, res) => res.json({
  status:   'SurakshaRoad backend running',
  version:  'M6',
  routes:   ['/api/nearby', '/api/triage', '/api/alert', '/api/photo-verify']
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));