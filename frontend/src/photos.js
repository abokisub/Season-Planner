// Photos from Wikimedia Commons (free licences). Shown through the green/white duotone filter.
const T = (path, file) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/960px-${file}`

export const PHOTOS = {
  farmer: {
    src: T('0/03', 'Corn_farm_weeding_work.jpg'),
    credit: 'Abdulmumin88, CC BY-SA 4.0',
  },
  maize: {
    src: T('c/cc', 'Maize_farm_in_akko%2C_Gombe_state%2C_Nigeria.jpg'),
    credit: 'Bembety, CC BY-SA 4.0 (Gombe State)',
  },
  sorghum: {
    src: T('9/91', 'Guinea_corn_cultivation_in_Jalingo.jpg'),
    credit: 'Gwanki, CC BY-SA 4.0 (Jalingo)',
  },
  millet: {
    src: T('1/18', 'Pearl_millet_in_summer.jpg'),
    credit: 'Herovaclicks, CC BY 4.0',
  },
  cowpea: {
    src: T('2/2c', 'Cowpea_flower_and_plant.jpg'),
    credit: 'Prahlad balaji, CC BY-SA 4.0',
  },
  groundnut: {
    src: T('7/73', 'A_groundnut_farm.jpg'),
    credit: 'Anniwinner, CC BY-SA 4.0',
  },
}
