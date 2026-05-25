// ═══════════════════════════════════════════════════
// routes/photoVerify.js — M6 Claude Vision
// POST /api/photo-verify
// Body: { image: "data:image/png;base64,...", lat, lon, timestamp }
// Response: { verified: true/false, result: "YES"/"NO", reason: "..." }
// ═══════════════════════════════════════════════════

const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { image, lat, lon, timestamp } = req.body;

  // ── Validate ──────────────────────────────────────
  if (!image) {
    return res.status(400).json({
      verified: false,
      result: 'NO',
      reason: 'No image provided'
    });
  }

  // ── Strip base64 header ───────────────────────────
  // image comes as "data:image/png;base64,XXXX..."
  const matches    = image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({
      verified: false,
      result:   'NO',
      reason:   'Invalid image format'
    });
  }
  const mediaType  = matches[1]; // e.g. "image/png"
  const base64Data = matches[2]; // raw base64

  try {
    // ── Call Claude Vision ────────────────────────────
    const response = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: [
            {
              type:  'image',
              source: {
                type:       'base64',
                media_type: mediaType,
                data:       base64Data
              }
            },
            {
              type: 'text',
              text: 'Does this image show a real road accident scene with vehicles damaged, people injured, or a road collision? Reply with ONLY one word: YES or NO'
            }
          ]
        }
      ]
    });

    // ── Parse response ────────────────────────────────
    const answer   = response.content[0].text.trim().toUpperCase();
    const verified = answer === 'YES';

    console.log(`Photo verify — GPS: ${lat},${lon} — Result: ${answer}`);

    return res.json({
      verified,
      result: answer,
      reason: verified
        ? 'Accident scene confirmed by AI'
        : 'Image does not show a road accident scene',
      location: { lat, lon },
      timestamp
    });

  } catch (err) {
    console.error('Claude Vision error:', err.message);
    return res.status(500).json({
      verified: false,
      result:   'ERROR',
      reason:   'AI verification failed — ' + err.message
    });
  }
});

module.exports = router;