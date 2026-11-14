export const CROPS = {
  maize: { name: 'Maize' },
  sorghum: { name: 'Sorghum' },
  millet: { name: 'Millet' },
  cowpea: { name: 'Cowpea' },
  groundnut: { name: 'Groundnut' },
}

export const PRIORITIES = {
  balanced: { name: 'A bit of everything' },
  water: { name: 'Save water' },
  income: { name: 'More income' },
  soil: { name: 'Better soil' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

// "7 Jul" -> day of year (non-leap)
export function dayOfYear(label) {
  const [d, m] = label.split(' ')
  return DAYS_BEFORE[MONTHS.indexOf(m)] + Number(d)
}

export { MONTHS }
