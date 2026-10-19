/* Per-type effect colours and Mega-capable Pokémon (copied from the game by sync_game.py). */
const MOVE_FX = {
  Fire: { col: '#ff7b2a', core: '#ffe36b', scar: 'scorch' }, Water: { col: '#4aa6ff', core: '#d9f1ff', scar: 'splat', sc: '#6d8fb0' },
  Grass: { col: '#58d65a', core: '#e2ffc4', scar: 'splat', sc: '#4f7a46' }, Electric: { col: '#ffe04a', core: '#ffffff', scar: 'scorch' },
  Ice: { col: '#a8efff', core: '#ffffff', scar: 'splat', sc: '#e9fbff' }, Fighting: { col: '#ff8a5b', core: '#fff1e6', scar: 'crack' },
  Poison: { col: '#b65cff', core: '#f2d9ff', scar: 'splat', sc: '#5d2d78' }, Ground: { col: '#c99a4d', core: '#fff0c9', scar: 'crack' },
  Flying: { col: '#d7e6ff', core: '#ffffff', scar: 'splat', sc: '#a8b8c8' }, Psychic: { col: '#ff6fc8', core: '#ffe2f4', scar: 'splat', sc: '#a86b95' },
  Bug: { col: '#b6d636', core: '#f4ffc8', scar: 'splat', sc: '#5b6b24' }, Rock: { col: '#b89f6a', core: '#f3e6c2', scar: 'crack' },
  Ghost: { col: '#8c6bff', core: '#e6dcff', scar: 'splat', sc: '#2d2348' }, Dragon: { col: '#7d6bff', core: '#e5e0ff', scar: 'crack' },
  Steel: { col: '#cad8e6', core: '#ffffff', scar: 'crack' }, Fairy: { col: '#ffb3e3', core: '#ffffff', scar: 'splat', sc: '#e7a7cf' },
  Normal: { col: '#ffffff', core: '#ffffff', scar: 'trail' }, Dark: { col: '#6a5a7a', core: '#d9cde8', scar: 'crack' }
};
const MEGA_ABLE = new Set(['Venusaur', 'Charizard', 'Blastoise', 'Beedrill', 'Pidgeot', 'Alakazam', 'Slowbro', 'Gengar', 'Kangaskhan', 'Pinsir', 'Gyarados', 'Aerodactyl', 'Mewtwo']);
