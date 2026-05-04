const express = require('express');
const router = express.Router();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// POST /api/alert
// Body: { lat, lon, medicalSummary, emergencyContact }
router.post('/', async (req, res) => {
  const { lat, lon, medicalSummary, emergencyContact } = req.body;

  if (!lat || !lon || !emergencyContact) {
    return res.status(400).json({ error: 'lat, lon, and emergencyContact are required' });
  }

  const mapsLink = `https://maps.google.com/?q=${lat},${lon}`;

  const smsBody =
    `🚨 EMERGENCY ALERT — SurakshaRoad\n` +
    `Location: ${mapsLink}\n` +
    `Medical info: ${medicalSummary || 'Not provided'}\n` +
    `Please call emergency services immediately.`;

  const whatsappBody =
    `🚨 *EMERGENCY ALERT — SurakshaRoad*\n\n` +
    `📍 Location: ${mapsLink}\n` +
    `🩺 Medical: ${medicalSummary || 'Not provided'}\n\n` +
    `Please call emergency services or go to the above location immediately.`;

  try {
    // Send SMS to emergency contact
    const sms = await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE,
      to: emergencyContact
    });

    // Send WhatsApp message (requires Twilio WhatsApp sandbox)
    const whatsapp = await client.messages.create({
      body: whatsappBody,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${emergencyContact}`
    });

    res.json({
      success: true,
      sms_sid: sms.sid,
      whatsapp_sid: whatsapp.sid
    });

  } catch (err) {
    console.error('Twilio error:', err.message);
    res.status(500).json({ error: 'Failed to send alert', detail: err.message });
  }
});

module.exports = router;