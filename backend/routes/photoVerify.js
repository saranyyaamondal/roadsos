// routes/photoVerify.js — Claude Vision
// POST /api/photo-verify
// Body: { image: "data:image/png;base64,...", lat, lon, timestamp }

const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { image, lat, lon, timestamp } = req.body;

  if (!image) {
    return res.status(400).json({ verified: false, result: 'NO', reason: 'No image provided' });
  }

  const matches = image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ verified: false, result: 'NO', reason: 'Invalid image format' });
  }

  const mediaType  = matches[1];
  const base64Data = matches[2];

  // Validate media type — Claude only accepts these
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(mediaType)) {
    return res.status(400).json({ verified: false, result: 'NO', reason: 'Unsupported image type. Use JPG or PNG.' });
  }

  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-5',   // ← fixed: was claude-opus-4-5 (doesn't exist)
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data }
          },
          {
            type: 'text',
            text: 'Does this image show a real road accident scene with vehicles damaged, people injured, or a road collision? Reply with ONLY one word: YES or NO'
          }
        ]
      }]
    });

    const answer   = response.content[0].text.trim().toUpperCase();
    const verified = answer.startsWith('YES');

    console.log(`Photo verify — GPS: ${lat},${lon} — Result: ${answer}`);

    return res.json({
      verified,
      result:    verified ? 'YES' : 'NO',
      reason:    verified ? 'Accident scene confirmed by AI' : 'Image does not show a road accident scene',
      location:  { lat, lon },
      timestamp
    });

  } catch (err) {
    console.error('Claude Vision error:', err.message);
    // Return verified:true as fallback so bystanders aren't blocked by API issues
    return res.status(200).json({
      verified: true,
      result:   'FALLBACK',
      reason:   'AI unavailable — proceeding with manual verification',
      location: { lat, lon },
      timestamp
    });
  }
});

module.exports = router;