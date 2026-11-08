import type { Source } from './types'

export type Dataset = {
  id: string
  title: string
  unit: string
  note: string
  points: { x: number; y: number }[]
  source: Source
  decimals: number
}

/** Moyennes annuelles de CO₂ mesurées à Mauna Loa (NOAA GML), en ppm. Sélection d'années. */
export const CO2: Dataset = {
  id: 'co2',
  title: 'CO₂ dans l’atmosphère, Mauna Loa',
  unit: 'ppm',
  note: 'Moyennes annuelles, parties par million. Valeurs arrondies au dixième.',
  decimals: 1,
  points: [
    { x: 1959, y: 316.0 }, { x: 1965, y: 320.0 }, { x: 1970, y: 325.7 }, { x: 1975, y: 331.1 },
    { x: 1980, y: 338.8 }, { x: 1985, y: 346.4 }, { x: 1990, y: 354.4 }, { x: 1995, y: 360.8 },
    { x: 2000, y: 369.7 }, { x: 2005, y: 380.0 }, { x: 2010, y: 389.9 }, { x: 2015, y: 401.0 },
    { x: 2020, y: 414.2 }, { x: 2023, y: 421.1 },
  ],
  source: { label: 'NOAA Global Monitoring Laboratory — Mauna Loa, moyennes annuelles', url: 'https://gml.noaa.gov/ccgg/trends/data.html' },
}

/** Population mondiale estimée (Nations unies, World Population Prospects), en milliards, arrondie. */
export const POPULATION: Dataset = {
  id: 'population',
  title: 'Population mondiale',
  unit: 'milliards',
  note: 'Estimations des Nations unies, arrondies au dixième de milliard.',
  decimals: 1,
  points: [
    { x: 1950, y: 2.5 }, { x: 1960, y: 3.0 }, { x: 1970, y: 3.7 }, { x: 1980, y: 4.4 },
    { x: 1990, y: 5.3 }, { x: 2000, y: 6.1 }, { x: 2010, y: 7.0 }, { x: 2020, y: 7.8 }, { x: 2022, y: 8.0 },
  ],
  source: { label: 'Nations unies — World Population Prospects', url: 'https://population.un.org/wpp/' },
}
