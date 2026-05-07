const { Gift } = require('../models');
const { loadCubes, computeAmountOptions } = require('../data/cubes-loader');
const { CUBE_TITLE, CUBE_DESCRIPTION, CUBE_DESCRIPTIONS_BY_ID } = require('../data/cube-text');

function descriptionForCube(cubeId) {
  return CUBE_DESCRIPTIONS_BY_ID[cubeId] || CUBE_DESCRIPTION;
}

async function seedCubes() {
  const cubes = loadCubes();
  if (cubes.length !== 38) {
    throw new Error(`expected 38 cubes in cubes.json, got ${cubes.length}`);
  }

  const existingCount = await Gift.countDocuments({ type: 'cube' });
  if (existingCount > 0) {
    return { inserted: 0, skipped: existingCount, total: cubes.length };
  }

  let inserted = 0;
  for (const cube of cubes) {
    await Gift.create({
      type: 'cube',
      cubeId: cube.id,
      title: CUBE_TITLE,
      description: descriptionForCube(cube.id),
      amountOptions: computeAmountOptions(cube),
      available: 1,
      enabled: true,
    });
    inserted += 1;
  }

  return { inserted, skipped: 0, total: cubes.length };
}

module.exports = { seedCubes };
