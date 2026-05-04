const express = require('express');
const router = express.Router();

// Simple AI triage ranking function (M6 logic lives here)
function triageRank(hospitals, injuryDescription) {
  const desc = injuryDescription.toLowerCase();

  return hospitals
    .map(h => {
      let score = 0;

      // Prefer Level 1 Trauma for serious injuries
      if (h.level === 'Level 1 Trauma') score += 30;

      // Proximity is the strongest factor (closer = higher score)
      score += Math.max(0, 20 - h.distance_km * 4);

      // Keyword matching for injury type
      if (desc.includes('head') || desc.includes('brain')) {
        if (h.name.toLowerCase().includes('gleneagles')) score += 20;
      }
      if (desc.includes('burn')) {
        if (h.level === 'Level 1 Trauma') score += 15;
      }
      if (desc.includes('fracture') || desc.includes('bone')) {
        score += 5;
      }

      return { ...h, score };
    })
    .sort((a, b) => b.score - a.score);
}

// POST /api/triage
// Body: { hospitals: [...], injury: "head injury, unconscious" }
router.post('/', (req, res) => {
  const { hospitals, injury } = req.body;

  if (!hospitals || !Array.isArray(hospitals) || !injury) {
    return res.status(400).json({
      error: 'hospitals array and injury description are required'
    });
  }

  const ranked = triageRank(hospitals, injury);
  const top = ranked[0];

  res.json({
    recommended: top,
    all_ranked: ranked,
    reason: `${top.name} ranked first — nearest ${top.level || 'facility'} suitable for reported injury.`
  });
});

module.exports = router;