// A separate position is materialized for every portrait, outfit and silhouette.
// Fine adjustments belong to one combination, never to a shared outfit selector.
export const PORTRAIT_IDS = Object.freeze([
  'Abdouramane', 'Amandine', 'Anan', 'Antoine', 'Arnaud', 'Aurelien',
  'Bilal', 'Blandine', 'Boris', 'Capucine', 'Clemence', 'Cloe', 'Emilie',
  'Fanny', 'Florent', 'Jeanne', 'Kevin', 'Louis', 'Matthieu',
  'Maxime', 'Morad', 'Nabila', 'Nivine', 'Noe', 'Quentin',
  'Rehan', 'Remi', 'Romain', 'Sami', 'Saryana'
]);

export const OUTFIT_IDS = Object.freeze([
  'labcoat', 'starter', 'scout', 'scholar', 'ing-chimie',
  'research-engineer', 'business-manager', 'project-manager',
  'roi-pirates', 'mage-noir', 'directeur-adjoint', 'antistatique',
  'cryogenique', 'verrier', 'armored', 'chimie-renforcee',
  'procedes-renforcee', 'biotech-renforcee'
]);

const singleImages = new Set(['starter', 'scout', 'armored']);
const openCollars = new Set(['research-engineer', 'business-manager', 'project-manager', 'roi-pirates']);
const fittedOutfits = new Set([
  'scout', 'research-engineer', 'business-manager', 'project-manager',
  'armored', 'procedes-renforcee', 'biotech-renforcee'
]);

// Source dimensions, lower-neck point and opaque width of each transparent head.
// The lower-neck point is measured on the cutout; Clémence's long hair is excluded.
const headLandmarks = Object.freeze({
  Abdouramane: [1230, 1278, .518, .939, .611],
  Amandine: [1265, 1244, .527, .961, .672],
  Anan: [1309, 1201, .517, .966, .624],
  Antoine: [1312, 1199, .505, .966, .658],
  Arnaud: [1265, 1244, .501, .959, .645],
  Aurelien: [1274, 1235, .585, .964, .699],
  Bilal: [1293, 1217, .536, .981, .711],
  Blandine: [1312, 1199, .497, .907, .567],
  Boris: [1232, 1277, .495, .938, .640],
  Capucine: [1312, 1199, .504, .984, .761],
  Clemence: [1375, 1144, .530, .916, .886],
  Cloe: [1254, 1254, .527, .961, .672],
  Emilie: [1303, 1207, .541, .971, .583],
  Fanny: [1374, 1145, .532, .956, .632],
  Florent: [1222, 1287, .506, .936, .685],
  Jeanne: [1232, 1277, .533, .950, .662],
  Kevin: [1275, 1234, .520, .950, .624],
  Louis: [1317, 1194, .558, .983, .593],
  Matthieu: [1311, 1200, .527, .955, .706],
  Maxime: [1312, 1199, .545, .978, .670],
  Morad: [1312, 1199, .468, .954, .647],
  Nabila: [1296, 1213, .552, .965, .691],
  Nivine: [1266, 1242, .539, .980, .695],
  Noe: [1312, 1199, .495, .943, .621],
  Quentin: [1312, 1199, .450, .939, .633],
  Rehan: [1330, 1182, .551, .943, .565],
  Remi: [1297, 1212, .567, .943, .616],
  Romain: [1232, 1277, .487, .948, .751],
  Sami: [1312, 1199, .513, .961, .599],
  Saryana: [1312, 1199, .540, .913, .582]
});

const round = value => Math.round(value * 10) / 10;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

function neckInSquare(portraitId) {
  const [sourceWidth, sourceHeight, neckX, neckY, opaqueWidth] = headLandmarks[portraitId];
  const ratio = sourceWidth / sourceHeight;
  return {
    x: ratio < 1 ? (1 - ratio) / 2 + neckX * ratio : neckX,
    y: ratio > 1 ? (1 - 1 / ratio) / 2 + neckY / ratio : neckY,
    opaqueWidth
  };
}

function startingPose(outfitId, presentation) {
  const paired = !singleImages.has(outfitId);
  return {
    x: paired ? (presentation === 'feminine' ? 54 : 58) : 50,
    y: outfitId === 'labcoat' ? 3 : openCollars.has(outfitId) ? 4 : paired ? 1 : 5,
    width: 42
  };
}

// Keep the original fitted-outfit anchor stable when Fanny's own head is adjusted.
const fittedReferenceAdjustments = Object.freeze({
  masculine: {
    scout: { x: 54, y: 3 },
    'research-engineer': { x: 61 },
    'business-manager': { x: 61, y: 2 },
    'project-manager': { x: 61, y: 2 },
    armored: { y: 3 },
    'procedes-renforcee': { x: 66 },
    'biotech-renforcee': { x: 55 }
  },
  feminine: {
    scout: { x: 54, y: 3 },
    'research-engineer': { x: 57 },
    'business-manager': { x: 57, y: 2 },
    'project-manager': { x: 57, y: 2 },
    armored: { y: 3 },
    'procedes-renforcee': { x: 62 },
    'biotech-renforcee': { x: 51 }
  }
});

// These are the combinations checked in the gallery when the positional issue
// was reported. All other combinations retain their previous placement.
const fineAdjustments = Object.freeze({
  Abdouramane: {
    masculine: {
      scout: { x: 49.5, y: 4 }
    }
  },
  Amandine: {
    masculine: {
      scout: { x: 49.1, y: 4.7 }
    },
    feminine: {
      labcoat: { x: 48.8, y: 1.5 },
      starter: { x: 50.4, y: 2 },
      scout: { x: 49.1, y: 4.7 },
      scholar: { x: 42.2, y: 0.4 },
      'ing-chimie': { x: 44.9, y: 2 },
      'research-engineer': { x: 47.3, y: 2.5 },
      'business-manager': { x: 48.1, y: 0.5 },
      'project-manager': { x: 45.4, y: 1.8 },
      'roi-pirates': { x: 49.4, y: 1.7 },
      'mage-noir': { x: 49.9, y: 1 },
      'directeur-adjoint': { x: 50.6, y: 1 },
      antistatique: { x: 47.4, y: 0 },
      cryogenique: { x: 49.4, y: 0 },
      verrier: { x: 45.9, y: 2.1 },
      armored: { x: 50.7, y: 2.9 },
      'chimie-renforcee': { x: 45, y: 2 },
      'procedes-renforcee': { x: 46.6, y: 1.7 },
      'biotech-renforcee': { x: 48, y: 1.4 }
    }
  },
  Anan: {
    masculine: {
      scout: { x: 52.1, y: 2.7 },
      'business-manager': { x: 59.6, y: 0.8 }
    }
  },
  Antoine: {
    masculine: {
      scout: { y: 3.8 },
      'roi-pirates': { x: 60, y: 3 },
      'ing-chimie': { x: 60 },
      armored: { x: 53.1 }
    }
  },
  Arnaud: {
    masculine: {
      scout: { x: 52.3, y: 2.8 },
      'business-manager': { x: 60.3 }
    }
  },
  Aurelien: {
    masculine: {
      scout: { y: 3.5 }
    }
  },
  Bilal: {
    masculine: {
      scout: { y: 3.6 }
    }
  },
  Blandine: {
    feminine: {
      labcoat: { x: 50.1, y: 3.5 },
      starter: { x: 51.7, y: 4 },
      scout: { x: 50.3, y: 5.4 },
      scholar: { x: 43.5, y: 2.4 },
      'ing-chimie': { x: 46.2, y: 4 },
      'research-engineer': { x: 48.5, y: 3.2 },
      'business-manager': { x: 49.3, y: 1.2 },
      'project-manager': { x: 46.6, y: 2.5 },
      'roi-pirates': { x: 50.7, y: 3.7 },
      'mage-noir': { x: 51.2, y: 3 },
      'directeur-adjoint': { x: 51.9, y: 3 },
      antistatique: { x: 48.7, y: 2 },
      cryogenique: { x: 50.7, y: 2 },
      verrier: { x: 47.2, y: 4.1 },
      armored: { x: 51.9, y: 3.6 },
      'chimie-renforcee': { x: 46.3, y: 4 },
      'procedes-renforcee': { x: 47.8, y: 2.4 },
      'biotech-renforcee': { x: 49.2, y: 2.1 }
    }
  },
  Boris: {
    masculine: {
      scout: { x: 54.5, y: 2.8 },
      'business-manager': { x: 61.5 },
      'procedes-renforcee': { y: 2 }
    }
  },
  Capucine: {
    feminine: {
      labcoat: { x: 49.8, y: 1.8 },
      starter: { x: 51.4, y: 2.3 },
      scout: { x: 50, y: 5.9 },
      scholar: { x: 43.2, y: 0.7 },
      'ing-chimie': { x: 45.9, y: 2.3 },
      'research-engineer': { x: 48.2, y: 3.7 },
      'business-manager': { x: 49, y: 1.7 },
      'project-manager': { x: 46.3, y: 3 },
      'roi-pirates': { x: 50.4, y: 2 },
      'mage-noir': { x: 50.9, y: 1.3 },
      'directeur-adjoint': { x: 51.6, y: 1.3 },
      antistatique: { x: 48.4, y: 0.3 },
      cryogenique: { x: 50.4, y: 0.3 },
      verrier: { x: 46.9, y: 2.4 },
      armored: { x: 51.6, y: 4.1 },
      'chimie-renforcee': { x: 46, y: 2.3 },
      'procedes-renforcee': { x: 47.5, y: 2.9 },
      'biotech-renforcee': { x: 48.9, y: 2.6 }
    }
  },
  Cloe: {
    feminine: {
      labcoat: { x: 48.8, y: 1.5 },
      starter: { x: 50.4, y: 2 },
      scout: { x: 49.1, y: 4.7 },
      scholar: { x: 42.2, y: 0.4 },
      'ing-chimie': { x: 44.9, y: 2 },
      'research-engineer': { x: 48, y: 2.5 },
      'business-manager': { x: 48.1, y: 0.5 },
      'project-manager': { x: 45.4, y: 1.8 },
      'roi-pirates': { x: 49.4, y: 1.7 },
      'mage-noir': { x: 49.9, y: 1 },
      'directeur-adjoint': { x: 50.6, y: 1 },
      antistatique: { x: 47.4, y: 0.7 },
      cryogenique: { x: 49.4, y: 0 },
      verrier: { x: 45.9, y: 2.1 },
      armored: { x: 50.7, y: 2.9 },
      'chimie-renforcee': { x: 45, y: 2 },
      'procedes-renforcee': { x: 46.6, y: 1.7 },
      'biotech-renforcee': { x: 48, y: 1.4 }
    }
  },
  Fanny: {
    masculine: fittedReferenceAdjustments.masculine,
    feminine: {
      labcoat: { x: 48.6, y: 3.3 },
      starter: { x: 50.2, y: 3.8 },
      scout: { x: 48.9, y: 5.8 },
      scholar: { x: 42, y: 2.2 },
      'ing-chimie': { x: 44.7, y: 3.8 },
      'research-engineer': { x: 47.1, y: 3.6 },
      'business-manager': { x: 47.9, y: 1.6 },
      'project-manager': { x: 45.2, y: 2.9 },
      'roi-pirates': { x: 49.2, y: 3.5 },
      'mage-noir': { x: 49.7, y: 2.8 },
      'directeur-adjoint': { x: 50.4, y: 2.8 },
      antistatique: { x: 47.2, y: 1.8 },
      cryogenique: { x: 49.2, y: 1.8 },
      verrier: { x: 45.7, y: 3.9 },
      armored: { x: 50.5, y: 4 },
      'chimie-renforcee': { x: 44.8, y: 3.8 },
      'procedes-renforcee': { x: 46.4, y: 2.8 },
      'biotech-renforcee': { x: 47.8, y: 2.5 }
    }
  },
  Nivine: {
    feminine: {
      labcoat: { x: 48.3, y: 1.8 },
      starter: { x: 49.9, y: 2.3 },
      scout: { x: 47.9, y: 3.6 },
      scholar: { x: 41.7, y: 0.7 },
      'ing-chimie': { x: 44.4, y: 2.3 },
      'research-engineer': { x: 46.1, y: 2.2 },
      'business-manager': { x: 46.9, y: 0.2 },
      'project-manager': { x: 44.2, y: 1.5 },
      'roi-pirates': { x: 48.9, y: 2 },
      'mage-noir': { x: 49.4, y: 1.3 },
      'directeur-adjoint': { x: 50.1, y: 0.5 },
      antistatique: { x: 46.9, y: 0.3 },
      cryogenique: { x: 48.9, y: 0.3 },
      verrier: { x: 45.4, y: 2.4 },
      armored: { x: 49.5, y: 2.6 },
      'chimie-renforcee': { x: 44.5, y: 2.3 },
      'procedes-renforcee': { x: 45.4, y: 1.4 },
      'biotech-renforcee': { x: 46.8, y: 1.1 }
    }
  },
  Noe: {
    masculine: {
      scout: { x: 54.2, y: 3 },
      'ing-chimie': { x: 58.7 },
      'business-manager': { x: 61.7, y: 0.7 },
      'roi-pirates': { x: 58.8, y: 3.3 },
      'mage-noir': { x: 58.6 },
      'chimie-renforcee': { x: 58.6 },
      'procedes-renforcee': { x: 68.3 }
    }
  },
  Quentin: {
    masculine: {
      labcoat: { y: 3.4 },
      starter: { x: 50.7, y: 6 },
      scout: { x: 55.8, y: 3.9 },
      scholar: { x: 58.8, y: 1.8 },
      'ing-chimie': { x: 59.5, y: 1.8 },
      'business-manager': { x: 62.9, y: 0.9 },
      'project-manager': { x: 63.3, y: 1 },
      'roi-pirates': { x: 59.5, y: 3.4 },
      'mage-noir': { x: 59.5, y: 1.2 },
      'directeur-adjoint': { x: 58.8, y: 1.2 },
      antistatique: { x: 59.5, y: 1.6 },
      cryogenique: { x: 58.8, y: 1.2 },
      verrier: { x: 59.5, y: 1.2 },
      armored: { x: 52.8, y: 2.8 },
      'chimie-renforcee': { x: 59.5, y: 1.2 },
      'procedes-renforcee': { x: 68.7, y: 1.7 },
      'biotech-renforcee': { x: 59, y: 1.8 }
    }
  },
  Rehan: {
    masculine: {
      labcoat: { x: 57.2 },
      starter: { y: 5.6 },
      scout: { x: 52.2, y: 3 },
      scholar: { x: 57.2 },
      'research-engineer': { y: 2.6 },
      'business-manager': { x: 59.4, y: 0.6 },
      antistatique: { y: 1.7 }
    }
  },
  Remi: {
    masculine: {
      starter: { y: 5.7 },
      scout: { y: 2.6 },
      'procedes-renforcee': { x: 65.2 }
    }
  },
  Romain: {
    masculine: {
      starter: { y: 5.7 },
      scout: { y: 3.7 },
      'procedes-renforcee': { x: 68.5 }
    }
  },
  Sami: {
    masculine: {
      scout: { x: 53.8, y: 2.3 },
      'business-manager': { x: 60.3, y: 0.4 }
    }
  },
  Saryana: {
    feminine: {
      labcoat: { x: 48.3, y: 3.4 },
      starter: { x: 49.9, y: 3.9 },
      scout: { x: 48.5, y: 5.3 },
      scholar: { x: 41.7, y: 2.3 },
      'ing-chimie': { x: 44.4, y: 3.9 },
      'research-engineer': { x: 46.7, y: 3.1 },
      'business-manager': { x: 47.5, y: 1.1 },
      'project-manager': { x: 44.8, y: 2.4 },
      'roi-pirates': { x: 48.9, y: 3.6 },
      'mage-noir': { x: 49.4, y: 2.9 },
      'directeur-adjoint': { x: 50.1, y: 2.9 },
      antistatique: { x: 46.9, y: 1.9 },
      cryogenique: { x: 48.9, y: 1.9 },
      verrier: { x: 45.4, y: 4 },
      armored: { x: 50.1, y: 3.5 },
      'chimie-renforcee': { x: 44.5, y: 3.9 },
      'procedes-renforcee': { x: 46, y: 2.3 },
      'biotech-renforcee': { x: 47.4, y: 2 }
    }
  },
  Clemence: {
    feminine: {
      labcoat: { x: 48.7, y: 4.1 },
      starter: { x: 50.3, y: 4.6 },
      scout: { x: 49, y: 8 },
      scholar: { x: 42.1, y: 3 },
      'ing-chimie': { x: 44.8, y: 4.6 },
      'research-engineer': { x: 47.2, y: 5.8 },
      'business-manager': { x: 48, y: 3.8 },
      'project-manager': { x: 45.3, y: 5.1 },
      'roi-pirates': { x: 49.3, y: 4.3 },
      'mage-noir': { x: 49.8, y: 3.6 },
      'directeur-adjoint': { x: 50.5, y: 3.6 },
      antistatique: { x: 47.3, y: 2.6 },
      cryogenique: { x: 49.3, y: 2.6 },
      verrier: { x: 45.8, y: 4.7 },
      armored: { x: 50.6, y: 6.2 },
      'chimie-renforcee': { x: 44.9, y: 4.6 },
      'procedes-renforcee': { x: 46.5, y: 5 },
      'biotech-renforcee': { x: 47.9, y: 4.7 }
    }
  },
  Emilie: {
    feminine: {
      labcoat: { x: 48.2, y: 1.9 },
      starter: { x: 49.8, y: 2.4 },
      scout: { x: 48.4, y: 3.9 },
      scholar: { x: 41.6, y: 0.8 },
      'ing-chimie': { x: 44.3, y: 2.4 },
      'research-engineer': { x: 46.6, y: 1.7 },
      'business-manager': { x: 47.4, y: -0.3 },
      'project-manager': { x: 44.7, y: 1 },
      'roi-pirates': { x: 48.8, y: 2.1 },
      'mage-noir': { x: 49.3, y: 1.4 },
      'directeur-adjoint': { x: 50, y: 1.4 },
      antistatique: { x: 46.8, y: 0.4 },
      cryogenique: { x: 48.8, y: 0.4 },
      verrier: { x: 45.3, y: 2.5 },
      armored: { x: 50, y: 2.1 },
      'chimie-renforcee': { x: 44.4, y: 2.4 },
      'procedes-renforcee': { x: 45.9, y: 0.9 },
      'biotech-renforcee': { x: 47.3, y: 0.6 }
    }
  },
  Florent: {
    masculine: {
      scout: { x: 54.1, y: 3.7 }
    }
  },
  Jeanne: {
    feminine: {
      labcoat: { x: 48.6, y: 1.6 },
      starter: { x: 50.2, y: 2.1 },
      scout: { x: 48.9, y: 4.6 },
      scholar: { x: 42, y: 0.5 },
      'ing-chimie': { x: 44.7, y: 2.1 },
      'research-engineer': { x: 47.1, y: 2.4 },
      'business-manager': { x: 47.9, y: 0.4 },
      'project-manager': { x: 45.2, y: 1.7 },
      'roi-pirates': { x: 49.2, y: 1.8 },
      'mage-noir': { x: 49.7, y: 1.1 },
      'directeur-adjoint': { x: 50.4, y: 1.1 },
      antistatique: { x: 47.2, y: 0.1 },
      cryogenique: { x: 49.2, y: 0.1 },
      verrier: { x: 45.7, y: 2.2 },
      armored: { x: 50.5, y: 2.8 },
      'chimie-renforcee': { x: 44.8, y: 2.1 },
      'procedes-renforcee': { x: 46.4, y: 1.6 },
      'biotech-renforcee': { x: 47.8, y: 1.3 }
    }
  },
  Kevin: {
    masculine: {
      scout: { x: 51.2, y: 2.5 },
      'business-manager': { x: 59, y: 0.5 },
      'roi-pirates': { y: 3.3 },
      cryogenique: { x: 56, y: 0.6 }
    }
  },
  Louis: {
    masculine: {
      scout: { x: 51.9, y: 1.8 },
      'business-manager': { x: 58.9, y: 0.5 },
      cryogenique: { x: 57, y: 0.5 }
    }
  },
  Matthieu: {
    masculine: {
      scout: { x: 53.3, y: 4.1 },
      'procedes-renforcee': { x: 67.1, y: 2 }
    }
  },
  Maxime: {
    masculine: {
      scout: { x: 52.5, y: 2.9 },
      'business-manager': { x: 59.5, y: 0.7 },
      'roi-pirates': { y: 3.2 },
      cryogenique: { x: 57.4, y: 0.5 },
      'procedes-renforcee': { x: 66.4 }
    }
  },
  Morad: {
    masculine: {
      scout: { x: 55.1, y: 3.1 },
      'ing-chimie': { x: 58.8 },
      'business-manager': { x: 62.7, y: 0.9 },
      'roi-pirates': { x: 58.7, y: 3.3 },
      antistatique: { x: 58.8, y: 1.5 },
      'chimie-renforcee': { x: 58.8 }
    }
  },
  Nabila: {
    feminine: {
      labcoat: { x: 47.8, y: 1.9 },
      starter: { x: 49.4, y: 2.4 },
      scout: { x: 48.1, y: 5.1 },
      scholar: { x: 41.6, y: 0.8 },
      'ing-chimie': { x: 43.9, y: 2.4 },
      'research-engineer': { x: 46.7, y: 2.9 },
      'business-manager': { x: 47.1, y: 1.3 },
      'project-manager': { x: 44.4, y: 2.2 },
      'roi-pirates': { x: 48.4, y: 2.1 },
      'mage-noir': { x: 48.9, y: 1.4 },
      'directeur-adjoint': { x: 49.6, y: 1.4 },
      antistatique: { x: 46.8, y: 0.9 },
      cryogenique: { x: 48.4, y: 0.4 },
      verrier: { x: 45.3, y: 2.5 },
      armored: { x: 49.7, y: 3.3 },
      'chimie-renforcee': { x: 44, y: 2.4 },
      'procedes-renforcee': { x: 45.6, y: 2.1 },
      'biotech-renforcee': { x: 47, y: 1.8 }
    }
  }
});

function fittedPose(portraitId, outfitId, presentation) {
  const referencePose = {
    ...startingPose(outfitId, presentation),
    ...fittedReferenceAdjustments[presentation][outfitId]
  };
  if (portraitId === 'Fanny') return referencePose;
  const reference = neckInSquare('Fanny');
  const head = neckInSquare(portraitId);
  // The veil is wider than the face itself; scaling from its opaque width
  // would make this portrait too small and lift its neck off the collar.
  const width = portraitId === 'Nivine' ? 42
    : round(clamp(42 * Math.sqrt(reference.opaqueWidth / head.opaqueWidth), 39, 43));
  const headHeightRatio = 315 / 550;
  const collarX = referencePose.x + (reference.x - .5) * referencePose.width;
  const collarY = referencePose.y + reference.y * referencePose.width * headHeightRatio;
  return {
    x: round(collarX - (head.x - .5) * width),
    y: round(clamp(collarY - head.y * width * headHeightRatio, singleImages.has(outfitId) ? 0 : 1, 8)),
    width
  };
}

export const PORTRAIT_POSES = Object.freeze(Object.fromEntries(PORTRAIT_IDS.map(portraitId => [
  portraitId,
  Object.freeze(Object.fromEntries(['masculine', 'feminine'].map(presentation => [
    presentation,
    Object.freeze(Object.fromEntries(OUTFIT_IDS.map(outfitId => [
      outfitId,
      Object.freeze({
        ...(fittedOutfits.has(outfitId)
          ? fittedPose(portraitId, outfitId, presentation)
          : startingPose(outfitId, presentation)),
        ...fineAdjustments[portraitId]?.[presentation]?.[outfitId]
      })
    ])))
  ])))
])));

export function portraitPose(portraitId, outfitId, presentation) {
  return PORTRAIT_POSES[portraitId]?.[presentation]?.[outfitId] || null;
}

export function portraitIdFromUrl(url) {
  return /(?:^\/api\/portraits\/|\/tb2026-heads\/)([A-Za-z]+)\.png(?:\?|$)/.exec(url || '')?.[1] || null;
}

export function portraitPoseStyle(portraitId, outfitId, presentation) {
  const pose = portraitPose(portraitId, outfitId, presentation);
  return pose ? `left:${pose.x}%;top:${pose.y}%;width:${pose.width}%` : '';
}
