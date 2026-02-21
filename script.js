const elements = {
  modelYear: document.getElementById('modelYear'),
  travelStyle: document.getElementById('travelStyle'),
  sleepers: document.getElementById('sleepers'),
  sleepersValue: document.getElementById('sleepersValue'),
  powerTier: document.getElementById('powerTier'),
  waterLiters: document.getElementById('waterLiters'),
  waterValue: document.getElementById('waterValue'),
  checks: {
    kitchen: document.getElementById('kitchen'),
    fridge: document.getElementById('fridge'),
    awning: document.getElementById('awning'),
    heater: document.getElementById('heater'),
    offroad: document.getElementById('offroad'),
    storage: document.getElementById('storage')
  },
  budget: document.getElementById('budget'),
  complexity: document.getElementById('complexity'),
  timeline: document.getElementById('timeline'),
  priorities: document.getElementById('priorities')
};

const costs = {
  base: 4500,
  powerTier: { basic: 1400, plus: 2900, pro: 4800 },
  addOns: { kitchen: 1800, fridge: 750, awning: 620, heater: 1100, offroad: 2200, storage: 900 }
};

function recalc() {
  let total = costs.base;
  total += costs.powerTier[elements.powerTier.value];
  total += Number(elements.waterLiters.value) * 22;
  total += Number(elements.sleepers.value) * 650;

  Object.entries(elements.checks).forEach(([name, checkbox]) => {
    if (checkbox.checked) {
      total += costs.addOns[name];
    }
  });

  const agePenalty = Math.max(0, 2016 - Number(elements.modelYear.value)) * 120;
  total += agePenalty;

  const styleMultiplier = {
    weekend: 0.95,
    balanced: 1,
    expedition: 1.18
  }[elements.travelStyle.value];

  total = Math.round(total * styleMultiplier);

  const complexityPoints = [
    elements.powerTier.value === 'pro' ? 2 : elements.powerTier.value === 'plus' ? 1 : 0,
    elements.checks.offroad.checked ? 2 : 0,
    elements.checks.heater.checked ? 1 : 0,
    Number(elements.waterLiters.value) >= 40 ? 1 : 0,
    Number(elements.sleepers.value) === 3 ? 1 : 0
  ].reduce((sum, points) => sum + points, 0);

  const complexityLabel = complexityPoints >= 5 ? 'High' : complexityPoints >= 3 ? 'Medium' : 'Low';
  const timeline = complexityPoints >= 5 ? '12-18 weeks' : complexityPoints >= 3 ? '8-12 weeks' : '4-7 weeks';

  const priorities = [];
  if (!elements.checks.heater.checked) priorities.push('Confirm 4-season usage before skipping a heater.');
  if (elements.travelStyle.value === 'expedition') priorities.push('Add remote-repair kit and full-size spare strategy.');
  if (Number(elements.waterLiters.value) < 20) priorities.push('Consider additional water storage for multi-day autonomy.');
  if (!elements.checks.storage.checked) priorities.push('Plan interior tie-down points for safety and organization.');
  if (priorities.length === 0) priorities.push('Great baseline. Next step: refine materials and weight distribution.');

  elements.sleepersValue.textContent = elements.sleepers.value;
  elements.waterValue.textContent = elements.waterLiters.value;
  elements.budget.textContent = `€${total.toLocaleString()}`;
  elements.complexity.textContent = complexityLabel;
  elements.timeline.textContent = timeline;
  elements.priorities.innerHTML = priorities.map((item) => `<li>${item}</li>`).join('');
}

Object.values(elements).forEach((value) => {
  if (value instanceof HTMLElement && ['INPUT', 'SELECT'].includes(value.tagName)) {
    value.addEventListener('input', recalc);
  }
});

Object.values(elements.checks).forEach((checkbox) => checkbox.addEventListener('change', recalc));

recalc();
