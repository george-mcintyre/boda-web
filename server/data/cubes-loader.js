const fs = require('fs');
const path = require('path');

const CUBE_IMAGE_BASE_URL = '/assets/images/cubes';
const DISPLAYED_FACES = ['front', 'top', 'left', 'right'];
const SPECIAL_FACE_VALUES = new Set(['white', 'mirror']);

const PRICE_TIERS = {
  3: [200, 500],
  2: [100, 200, 500],
  1: [50, 100, 200, 500],
};

let cachedCubes = null;

function loadCubes() {
  if (cachedCubes) return cachedCubes;
  const jsonPath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'assets',
    'images',
    'cubes',
    'cubes.json'
  );
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.cubes)) {
    throw new Error('cubes.json is malformed: missing `cubes` array');
  }
  cachedCubes = parsed.cubes;
  return cachedCubes;
}

function isImageRef(value) {
  return typeof value === 'string' && value.length > 0 && !SPECIAL_FACE_VALUES.has(value);
}

function computeImageCount(cube) {
  return DISPLAYED_FACES.reduce(
    (count, face) => (isImageRef(cube[face]) ? count + 1 : count),
    0
  );
}

function computeAmountOptions(cube) {
  const count = computeImageCount(cube);
  const options = PRICE_TIERS[count];
  if (!options) {
    throw new Error(
      `cube ${cube.id} has ${count} displayed image faces; expected 1, 2, or 3`
    );
  }
  return [...options];
}

function resolveFaceValue(value) {
  if (SPECIAL_FACE_VALUES.has(value)) return value;
  if (!value) return 'white';
  return `${CUBE_IMAGE_BASE_URL}/${value}.jpg`;
}

function resolveCubeFaces(cube) {
  return {
    front: resolveFaceValue(cube.front),
    back: resolveFaceValue(cube.back),
    top: resolveFaceValue(cube.top),
    bottom: resolveFaceValue(cube.bottom),
    left: resolveFaceValue(cube.left),
    right: resolveFaceValue(cube.right),
  };
}

module.exports = {
  loadCubes,
  computeImageCount,
  computeAmountOptions,
  resolveFaceValue,
  resolveCubeFaces,
  isImageRef,
  CUBE_IMAGE_BASE_URL,
  DISPLAYED_FACES,
};
