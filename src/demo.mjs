// Independently assembled small seed bank. Live reference snapshots are fetched
// into D1 at runtime, not distributed as part of the MIT code license.
const a = (answer, tier, aliases = []) => ({ answer, tier, aliases });
export const DEMO = {
  dayNumber: 1, source: 'OpenKrillion sample bank',
  prompts: [
    { id: 'p1', text: 'Name a way to prepare potatoes', answers: [a('Mashed potatoes', 'plankton', ['mashed', 'mash']), a('French fries', 'plankton', ['fries', 'chips']), a('Baked potato', 'schooler', ['baked']), a('Gnocchi', 'rare'), a('Aligot', 'deepcut'), a('Pommes soufflées', 'krillion', ['pommes souffle'])] },
    { id: 'p2', text: 'Name an animal whose name is exactly four letters long', answers: [a('Lion', 'plankton'), a('Bear', 'plankton'), a('Wolf', 'schooler'), a('Ibex', 'rare'), a('Tahr', 'deepcut'), a('Mara', 'krillion')] },
    { id: 'p3', text: 'Name someone who has won an NBA Most Valuable Player award', answers: [a('Michael Jordan', 'plankton', ['jordan']), a('LeBron James', 'plankton', ['lebron']), a('Stephen Curry', 'schooler', ['steph curry']), a('Dirk Nowitzki', 'rare'), a('Dave Cowens', 'deepcut'), a('Bob Pettit', 'krillion')] },
    { id: 'p4', text: 'Name a chemical element whose symbol is one letter', answers: [a('Hydrogen', 'plankton', ['H']), a('Carbon', 'plankton', ['C']), a('Oxygen', 'plankton', ['O']), a('Sulfur', 'schooler', ['S', 'sulphur']), a('Boron', 'rare', ['B']), a('Tungsten', 'deepcut', ['W']), a('Yttrium', 'krillion', ['Y'])] },
    { id: 'p5', text: 'Name a type of station', answers: [a('Train station', 'plankton', ['railway station']), a('Police station', 'schooler'), a('Weather station', 'rare'), a('Tracking station', 'deepcut'), a('Ghost station', 'krillion')] },
    { id: 'p6', text: 'Name a country whose English name ends in the letter E', answers: [a('France', 'plankton'), a('Greece', 'plankton'), a('Chile', 'schooler'), a('Singapore', 'rare'), a('Belize', 'deepcut'), a('São Tomé and Príncipe', 'krillion', ['sao tome and principe'])] },
    { id: 'p7', text: 'Name a superhero team', answers: [a('Avengers', 'plankton', ['the avengers']), a('Justice League', 'schooler'), a('Teen Titans', 'rare'), a('Alpha Flight', 'deepcut'), a('Great Lakes Avengers', 'krillion')] },
  ],
};
