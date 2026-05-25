// ═══════════════════════════════════════════════════
// routes/triageAI.js — M6 Claude AI Hospital Ranking
// POST /api/triage
// Body: { hospitals: [...], injury: "head injury", language: "ta" }
// Response: { recommended, all_ranked, reason }
// ═══════════════════════════════════════════════════

const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Language names for Claude prompt
const LANG_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil',
  te: 'Telugu',  bn: 'Bengali', kn: 'Kannada',
  ml: 'Malayalam', mr: 'Marathi'
};

router.post('/', async (req, res) => {
  const { hospitals, injury, language } = req.body;

  if (!hospitals || !Array.isArray(hospitals) || hospitals.length === 0) {
    return res.status(400).json({ error: 'hospitals array is required' });
  }

  const injuryDesc = injury || 'general emergency road accident';
  const lang       = language || 'en';
  const langName   = LANG_NAMES[lang] || 'English';

  // ── Build hospital list for prompt ────────────────
  const hospitalList = hospitals.map((h, i) =>
    `${i + 1}. ${h.name} — ${h.distance_km || h.distance_km || '?'} km away` +
    (h.level ? ` — ${h.level}` : '') +
    (h.phone ? ` — Tel: ${h.phone}` : '')
  ).join('\n');

  const prompt = `
You are an emergency medical triage assistant in India.

A road accident has occurred. The injury description is: "${injuryDesc}"

Here are the nearby hospitals:
${hospitalList}

Rank these hospitals from best to worst for this specific emergency.
Consider: distance, trauma level, specialisation for the injury type.

Respond in ${langName} language.
Respond ONLY with valid JSON in this exact format, nothing else:
{
  "ranked": [1, 2, 3],
  "reason": "One sentence explaining why the top hospital is best for this injury"
}

The "ranked" array must contain the hospital numbers (1-based) in order from best to worst.
`.trim();

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }]
    });

    // ── Parse Claude's JSON response ──────────────────
    const raw  = response.content[0].text.trim();
    let parsed;

    try {
      // Strip markdown code fences if present
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      // Fallback — return hospitals in distance order
      console.warn('Claude triage JSON parse failed, using distance fallback');
      return res.json({
        recommended: hospitals[0],
        all_ranked:  hospitals,
        reason:      'Nearest hospital recommended (AI parse error)'
      });
    }

    // ── Build ranked list ─────────────────────────────
    const ranked = (parsed.ranked || [1]).map(n => hospitals[n - 1]).filter(Boolean);
    if (ranked.length === 0) ranked.push(...hospitals);

    console.log(`Triage — injury: "${injuryDesc}" — top: ${ranked[0]?.name}`);

    return res.json({
      recommended: ranked[0],
      all_ranked:  ranked,
      reason:      parsed.reason || `${ranked[0]?.name} recommended for ${injuryDesc}`
    });

  } catch (err) {
    console.error('Claude triage error:', err.message);

    // Graceful fallback — distance-based ranking
    return res.json({
      recommended: hospitals[0],
      all_ranked:  hospitals,
      reason:      'Nearest hospital recommended (AI unavailable)'
    });
  }
});

module.exports = router;