// Commons search queries for scheduled concert-photo sourcing (2026-10-06 widening).
export const ERAS_TOUR_CITIES = [
  'Glendale', 'Las Vegas', 'Arlington', 'Tampa', 'Houston', 'Atlanta', 'Nashville',
  'Philadelphia', 'Foxborough', 'Chicago', 'Detroit', 'Pittsburgh', 'Minneapolis',
  'Cincinnati', 'Kansas City', 'Denver', 'Seattle', 'Santa Clara', 'Inglewood',
  'Mexico City', 'Buenos Aires', 'Tokyo', 'Melbourne', 'Sydney', 'Singapore',
  'Paris', 'Stockholm', 'Lisbon', 'Madrid', 'Milan', 'Gelsenkirchen', 'Hamburg',
  'Warsaw', 'Vienna', 'Zurich', 'Amsterdam', 'Dublin', 'Edinburgh', 'Liverpool',
  'Cardiff', 'London', 'Toronto', 'Vancouver',
];

// Every query still passes the same free-license filter in buildCandidate.
export const DEFAULT_QUERIES = [
  'Taylor Swift Eras Tour debut',
  'Taylor Swift Eras Tour fearless',
  'Taylor Swift Eras Tour speak now',
  'Taylor Swift Eras Tour red',
  'Taylor Swift Eras Tour 1989',
  'Taylor Swift Eras Tour reputation',
  'Taylor Swift Eras Tour lover',
  'Taylor Swift Eras Tour folklore',
  'Taylor Swift Eras Tour evermore',
  'Taylor Swift Eras Tour midnights',
  'Taylor Swift Eras Tour tortured poets',
  'Taylor Swift concert',
  'Taylor Swift live',
  'Taylor Swift Reputation Stadium Tour',
  'Taylor Swift 1989 World Tour',
  'Taylor Swift Red Tour',
  'Taylor Swift Speak Now World Tour',
  'Taylor Swift Fearless Tour',
  'Taylor Swift Lover Fest',
  ...ERAS_TOUR_CITIES.map((city) => `The Eras Tour ${city}`),
];
