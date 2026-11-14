// Plain-language helpers shared by the result tabs.

export const bagsPerYear = (o) =>
  Math.round((o.fertilizer.reduce((s, f) => s + f.total_bags_per_ha, 0) / o.fertilizer.length) * 2) / 2

// One sentence a farmer understands, built from the data behind the goal.
export function plainReason(plan) {
  const s = plan.soil
  if (plan.goal.priority === 'soil' && (s.nitrogen_level === 'low' || s.organic_matter_level === 'low'))
    return 'Your soil is tired. This plan puts nitrogen and organic matter back, with less fertilizer.'
  if (plan.goal.priority === 'soil') return 'Your field slopes, so rain can wash the soil away. This plan keeps it covered.'
  if (plan.goal.priority === 'water') return 'Rain here has become less reliable. These crops need less water.'
  return 'These crops fit your rain and your soil best.'
}
