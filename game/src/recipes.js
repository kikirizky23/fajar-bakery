// Menu and recipes for Fajar Bakery. A dish is a list of build steps; the
// player applies them to a plate in order. "oven" means the plate must bake
// before the steps after it can be added.
export const STEPS = {
  dough: { label: 'Dough', key: '1', color: '#f2d8a7', dark: '#c9a86a' },
  choco: { label: 'Choco', key: '2', color: '#7a4a2b', dark: '#4e2c17' },
  berry: { label: 'Berry', key: '3', color: '#d94f6a', dark: '#a32c46' },
  oven: { label: 'Oven', key: '4', color: '#e8823a', dark: '#b4531d' },
  frost: { label: 'Frost', key: '5', color: '#fff3f6', dark: '#e8b7c4' },
};

export const RECIPES = [
  {
    id: 'croissant',
    name: 'Butter Croissant',
    price: 5,
    steps: ['dough', 'oven'],
    blurb: 'Flaky, golden, gone in seconds.',
  },
  {
    id: 'choco-swirl',
    name: 'Choco Swirl Bun',
    price: 8,
    steps: ['dough', 'choco', 'oven', 'frost'],
    blurb: 'Dark chocolate ribbon, sugar snow on top.',
  },
  {
    id: 'berry-cake',
    name: 'Berry Cloud Cake',
    price: 11,
    steps: ['dough', 'berry', 'oven', 'frost'],
    blurb: 'Strawberry cream over a sunrise sponge.',
  },
];

// Shift tuning: later shifts pay more but patience runs shorter.
export const SHIFTS = [
  { name: 'Shift 1 · Sunrise', target: 40, duration: 150, patience: 38, spawnEvery: 9, dishes: ['croissant', 'choco-swirl'] },
  { name: 'Shift 2 · Morning Rush', target: 65, duration: 150, patience: 32, spawnEvery: 7.5, dishes: ['croissant', 'choco-swirl', 'berry-cake'] },
  { name: 'Shift 3 · Festival Day', target: 90, duration: 165, patience: 27, spawnEvery: 6.5, dishes: ['croissant', 'choco-swirl', 'berry-cake'] },
];

export const BAKE_SECONDS = 4;
export const MAX_STRIKES = 3;

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function recipeMatches(steps, recipe) {
  if (steps.length !== recipe.steps.length) return false;
  return steps.every((s, i) => s === recipe.steps[i]);
}

// A plate's applied steps match the start of exactly one recipe.
export function recipePrefix(steps) {
  return RECIPES.find((r) => steps.length <= r.steps.length
    && steps.every((s, i) => s === r.steps[i]));
}

export function tipFor(patienceLeft, patienceMax) {
  const frac = Math.max(0, patienceLeft / patienceMax);
  if (frac > 0.66) return 3;
  if (frac > 0.33) return 2;
  return 1;
}
