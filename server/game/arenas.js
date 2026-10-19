/* Arena geometry for the server: walkable areas, entry points and trainer spots (exported from the game). */
const STAGES = {
 "plaza": {
  "name": "Metro Plaza",
  "walk": [
   [
    74,
    38,
    926,
    540
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 300
   },
   "B": {
    "x": 800,
    "y": 280
   }
  },
  "trainers": {
   "A": {
    "x": 18,
    "y": 300
   },
   "B": {
    "x": 982,
    "y": 300
   }
  }
 },
 "skyfort": {
  "name": "Stratos Fortress",
  "walk": [
   [
    75,
    152,
    925,
    430
   ],
   [
    180,
    58,
    820,
    524
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 296
   },
   "B": {
    "x": 800,
    "y": 296
   }
  },
  "trainers": {
   "A": {
    "x": -36,
    "y": 296
   },
   "B": {
    "x": 1030,
    "y": 296
   }
  }
 },
 "grotto": {
  "name": "Prism Grotto",
  "walk": [
   [
    74,
    73,
    926,
    510
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 296
   },
   "B": {
    "x": 800,
    "y": 290
   }
  },
  "trainers": {
   "A": {
    "x": 40,
    "y": 296
   },
   "B": {
    "x": 960,
    "y": 296
   }
  }
 },
 "oasis": {
  "name": "Mirage Oasis",
  "walk": [
   [
    75,
    73,
    927,
    507
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 290
   },
   "B": {
    "x": 800,
    "y": 290
   }
  },
  "trainers": {
   "A": {
    "x": 24,
    "y": 276
   },
   "B": {
    "x": 967,
    "y": 276
   }
  }
 },
 "ruins": {
  "name": "Verdant Ruins",
  "walk": [
   [
    74,
    79,
    926,
    501
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 290
   },
   "B": {
    "x": 800,
    "y": 290
   }
  },
  "trainers": {
   "A": {
    "x": 36,
    "y": 278
   },
   "B": {
    "x": 966,
    "y": 278
   }
  }
 },
 "glacier": {
  "name": "Ice Island",
  "walk": [
   [
    74,
    83,
    926,
    497
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 290
   },
   "B": {
    "x": 800,
    "y": 290
   }
  },
  "trainers": {
   "A": {
    "x": 36,
    "y": 288
   },
   "B": {
    "x": 966,
    "y": 288
   }
  }
 },
 "cyber": {
  "name": "Cyberpoke Future",
  "walk": [
   [
    74,
    82,
    926,
    498
   ]
  ],
  "entry": {
   "A": {
    "x": 200,
    "y": 290
   },
   "B": {
    "x": 800,
    "y": 290
   }
  },
  "trainers": {
   "A": {
    "x": 11,
    "y": 276
   },
   "B": {
    "x": 976,
    "y": 276
   }
  }
 }
};
const STAGE_ORDER = ["plaza", "skyfort", "grotto", "oasis", "ruins", "glacier", "cyber"];
let STAGE = STAGES[STAGE_ORDER[0]], STAGE_ID = STAGE_ORDER[0];
const BOUND = { x0: 90, x1: 910, y0: 70, y1: 520 };
const ENTRY = { A: { x: 200, y: 300 }, B: { x: 800, y: 280 } };
const TRAINER_POS = { A: { x: 46, y: 300 }, B: { x: 954, y: 280 } };
function setArena(id) {
  STAGE_ID = STAGES[id] ? id : STAGE_ORDER[Math.floor(Math.random() * STAGE_ORDER.length)]; STAGE = STAGES[STAGE_ID];
  const w = STAGE.walk; BOUND.x0 = Math.min(...w.map(r => r[0])); BOUND.y0 = Math.min(...w.map(r => r[1])); BOUND.x1 = Math.max(...w.map(r => r[2])); BOUND.y1 = Math.max(...w.map(r => r[3]));
  Object.assign(ENTRY.A, STAGE.entry.A); Object.assign(ENTRY.B, STAGE.entry.B); Object.assign(TRAINER_POS.A, STAGE.trainers.A); Object.assign(TRAINER_POS.B, STAGE.trainers.B);
  return STAGE_ID;
}
function inWalk(x, y) { return STAGE.walk.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]); }
function clampWalk(x, y) {
  if (inWalk(x, y)) return [x, y];
  let best = null, bd = Infinity;
  for (const r of STAGE.walk) { const cx = clamp(x, r[0], r[2]), cy = clamp(y, r[1], r[3]), d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = [cx, cy]; } }
  return best;
}
