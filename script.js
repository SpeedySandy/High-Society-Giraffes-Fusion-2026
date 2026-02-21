const modules = [
  { id: 'bed', label: 'Modular bed platform', category: 'Interior', cost: 1500, weight: 38, default: true },
  { id: 'kitchen', label: 'Slide-out kitchen', category: 'Galley', cost: 1900, weight: 28, default: true },
  { id: 'fridge', label: '12V fridge', category: 'Galley', cost: 840, weight: 17, default: true },
  { id: 'solar', label: 'Roof solar array', category: 'Electrical', cost: 1400, weight: 18, default: false },
  { id: 'heater', label: 'Parking heater', category: 'Climate', cost: 1100, weight: 9, default: false },
  { id: 'awning', label: 'Side awning', category: 'Exterior', cost: 620, weight: 16, default: false },
  { id: 'offroad', label: 'AT tires + mild lift', category: 'Suspension', cost: 2300, weight: 34, default: false },
  { id: 'storage', label: 'Roof storage box', category: 'Storage', cost: 960, weight: 22, default: true }
];

const el = {
  modelYear: document.getElementById('modelYear'),
  generation: document.getElementById('generation'),
  travelStyle: document.getElementById('travelStyle'),
  climate: document.getElementById('climate'),
  sleepers: document.getElementById('sleepers'),
  sleepersValue: document.getElementById('sleepersValue'),
  waterLiters: document.getElementById('waterLiters'),
  waterValue: document.getElementById('waterValue'),
  powerTier: document.getElementById('powerTier'),
  moduleGrid: document.getElementById('moduleGrid'),
  budget: document.getElementById('budget'),
  payload: document.getElementById('payload'),
  autonomy: document.getElementById('autonomy'),
  complexity: document.getElementById('complexity'),
  timeline: document.getElementById('timeline'),
  priorities: document.getElementById('priorities'),
  phasePlan: document.getElementById('phasePlan'),
  partsTable: document.getElementById('partsTable'),
  status: document.getElementById('status'),
  saveBuild: document.getElementById('saveBuild'),
  loadBuild: document.getElementById('loadBuild'),
  exportBuild: document.getElementById('exportBuild'),
  presetWeekend: document.getElementById('presetWeekend'),
  presetExpedition: document.getElementById('presetExpedition')
};

function renderModuleChecks() {
  el.moduleGrid.innerHTML = modules.map((m) => `
    <label><input type="checkbox" data-module="${m.id}" ${m.default ? 'checked' : ''}> ${m.label}</label>
  `).join('');
}

function selectedModuleIds() {
  return Array.from(el.moduleGrid.querySelectorAll('input[data-module]:checked')).map((i) => i.dataset.module);
}

function getState() {
  return {
    modelYear: Number(el.modelYear.value),
    generation: el.generation.value,
    travelStyle: el.travelStyle.value,
    climate: el.climate.value,
    sleepers: Number(el.sleepers.value),
    waterLiters: Number(el.waterLiters.value),
    powerTier: el.powerTier.value,
    modules: selectedModuleIds()
  };
}

function setState(state) {
  el.modelYear.value = state.modelYear;
  el.generation.value = state.generation;
  el.travelStyle.value = state.travelStyle;
  el.climate.value = state.climate;
  el.sleepers.value = state.sleepers;
  el.waterLiters.value = state.waterLiters;
  el.powerTier.value = state.powerTier;
  Array.from(el.moduleGrid.querySelectorAll('input[data-module]')).forEach((input) => {
    input.checked = state.modules.includes(input.dataset.module);
  });
  recalc();
}

function recalc() {
  const state = getState();
  const powerCost = { basic: 1400, plus: 2800, pro: 4700 }[state.powerTier];
  const styleMultiplier = { weekend: 0.92, balanced: 1, expedition: 1.16 }[state.travelStyle];
  const climateCost = { mild: 0, cold: 700, hot: 500 }[state.climate];
  const generationFactor = { '955': 1.1, '958': 1, '9ya': 1.08 }[state.generation];

  const chosenModules = modules.filter((m) => state.modules.includes(m.id));
  const modulesCost = chosenModules.reduce((sum, m) => sum + m.cost, 0);
  const modulesWeight = chosenModules.reduce((sum, m) => sum + m.weight, 0);

  const base = 4200 + powerCost + climateCost + state.waterLiters * 24 + state.sleepers * 700;
  const agePenalty = Math.max(0, 2016 - state.modelYear) * 100;
  const budget = Math.round((base + modulesCost + agePenalty) * styleMultiplier * generationFactor);
  const payload = modulesWeight + state.waterLiters + state.sleepers * 14;
  const autonomyDays = Math.max(1, Math.round(state.waterLiters / (state.sleepers * 8)));

  const complexityPoints =
    (state.powerTier === 'pro' ? 2 : state.powerTier === 'plus' ? 1 : 0) +
    (state.modules.includes('offroad') ? 2 : 0) +
    (state.modules.includes('heater') ? 1 : 0) +
    (state.modules.includes('solar') ? 1 : 0) +
    (state.sleepers === 3 ? 1 : 0);

  const complexity = complexityPoints >= 5 ? 'High' : complexityPoints >= 3 ? 'Medium' : 'Low';
  const timeline = complexityPoints >= 5 ? '12-18 weeks' : complexityPoints >= 3 ? '8-12 weeks' : '4-7 weeks';

  const priorities = [];
  if (!state.modules.includes('heater') && state.climate === 'cold') priorities.push('Add a heater for cold-climate overnight comfort.');
  if (!state.modules.includes('solar') && state.travelStyle === 'expedition') priorities.push('Solar is recommended for expedition autonomy.');
  if (payload > 290) priorities.push('Payload is getting high—verify axle and tire ratings.');
  if (!state.modules.includes('storage')) priorities.push('Plan tie-down points and cabin organization.');
  if (priorities.length === 0) priorities.push('Build is balanced—next step is supplier-specific parts matching.');

  const phasePlan = [
    'Phase 1: Measure interior envelope and finalize layout dimensions.',
    'Phase 2: Install electrical backbone (battery, fuse panel, wiring).',
    'Phase 3: Fit sleeping/storage modules and secure mounting points.',
    'Phase 4: Add climate/water systems and validate leak + thermal tests.',
    'Phase 5: Load test, shakedown trip, then refine ergonomics.'
  ];

  el.sleepersValue.textContent = state.sleepers;
  el.waterValue.textContent = state.waterLiters;
  el.budget.textContent = `€${budget.toLocaleString()}`;
  el.payload.textContent = `${payload} kg`;
  el.autonomy.textContent = `${autonomyDays} day${autonomyDays > 1 ? 's' : ''}`;
  el.complexity.textContent = complexity;
  el.timeline.textContent = timeline;
  el.priorities.innerHTML = priorities.map((p) => `<li>${p}</li>`).join('');
  el.phasePlan.innerHTML = phasePlan.map((p) => `<li>${p}</li>`).join('');
  el.partsTable.innerHTML = chosenModules.map((m) => `<tr><td>${m.label}</td><td>${m.category}</td><td>€${m.cost}</td><td>${m.weight} kg</td></tr>`).join('');
}

function bind() {
  ['modelYear', 'generation', 'travelStyle', 'climate', 'sleepers', 'waterLiters', 'powerTier'].forEach((id) => {
    el[id].addEventListener('input', recalc);
  });
  el.moduleGrid.addEventListener('change', recalc);

  el.saveBuild.addEventListener('click', () => {
    localStorage.setItem('cayenneBuild', JSON.stringify(getState()));
    el.status.textContent = 'Build saved locally.';
  });

  el.loadBuild.addEventListener('click', () => {
    const saved = localStorage.getItem('cayenneBuild');
    if (!saved) {
      el.status.textContent = 'No saved build found.';
      return;
    }
    setState(JSON.parse(saved));
    el.status.textContent = 'Saved build loaded.';
  });

  el.exportBuild.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cayenne-camper-build.json';
    link.click();
    URL.revokeObjectURL(link.href);
    el.status.textContent = 'JSON export downloaded.';
  });

  el.presetWeekend.addEventListener('click', () => {
    setState({ modelYear: 2019, generation: '958', travelStyle: 'weekend', climate: 'mild', sleepers: 2, waterLiters: 20, powerTier: 'basic', modules: ['bed', 'kitchen', 'fridge'] });
    el.status.textContent = 'Weekend preset applied.';
  });

  el.presetExpedition.addEventListener('click', () => {
    setState({ modelYear: 2018, generation: '958', travelStyle: 'expedition', climate: 'cold', sleepers: 2, waterLiters: 55, powerTier: 'pro', modules: ['bed', 'kitchen', 'fridge', 'solar', 'heater', 'offroad', 'storage', 'awning'] });
    el.status.textContent = 'Expedition preset applied.';
  });
}

renderModuleChecks();
bind();
recalc();
