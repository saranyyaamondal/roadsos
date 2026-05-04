require('dotenv').config();
const express = require('express');
const cors = require('cors');

const nearbyRoute  = require('./routes/nearby');
const triageRoute  = require('./routes/triage');
const alertRoute   = require('./routes/alert');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/nearby',  nearbyRoute);
app.use('/api/triage',  triageRoute);
app.use('/api/alert',   alertRoute);

// Health check
app.get('/', (req, res) => res.json({ status: 'SurakshaRoad backend running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));