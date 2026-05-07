const { Gift } = require('../models');
const { FIGURINES, FIGURINE_AMOUNT_OPTIONS } = require('../data/figurine-text');

async function seedFigurines() {
  const existingCount = await Gift.countDocuments({ type: 'figurine' });
  if (existingCount > 0) {
    return { inserted: 0, skipped: existingCount, total: FIGURINES.length };
  }

  let inserted = 0;
  for (const figurine of FIGURINES) {
    await Gift.create({
      type: 'figurine',
      figurineId: figurine.id,
      title: figurine.title,
      description: figurine.description,
      amountOptions: [...FIGURINE_AMOUNT_OPTIONS],
      available: 1,
      enabled: true,
    });
    inserted += 1;
  }

  return { inserted, skipped: 0, total: FIGURINES.length };
}

module.exports = { seedFigurines };
