// NEC Chapter 9, Table 310.15(B)(16)
// Allowable ampacities of insulated conductors rated up to 2000 volts
// Ampacities are ordered by 60°C, 75°C, and 90°C.
const CABLE_AMPACITY_TABLE = {
  "18 AWG": { Copper: [null, null, 14], Aluminum: [null, null, null] },
  "16 AWG": { Copper: [null, null, 18], Aluminum: [null, null, null] },
  "14 AWG": { Copper: [15, 20, 25], Aluminum: [null, null, null] },
  "12 AWG": { Copper: [20, 25, 30], Aluminum: [15, 20, 25] },
  "10 AWG": { Copper: [30, 35, 40], Aluminum: [25, 30, 35] },
  "8 AWG": { Copper: [40, 50, 55], Aluminum: [35, 40, 45] },
  "6 AWG": { Copper: [55, 65, 75], Aluminum: [40, 50, 55] },
  "4 AWG": { Copper: [70, 85, 95], Aluminum: [55, 65, 75] },
  "3 AWG": { Copper: [85, 100, 115], Aluminum: [65, 75, 85] },
  "2 AWG": { Copper: [95, 115, 130], Aluminum: [75, 90, 100] },
  "1 AWG": { Copper: [110, 130, 145], Aluminum: [85, 100, 115] },
  "1/0 AWG": { Copper: [125, 150, 170], Aluminum: [100, 120, 135] },
  "2/0 AWG": { Copper: [145, 175, 195], Aluminum: [115, 135, 150] },
  "3/0 AWG": { Copper: [165, 200, 225], Aluminum: [130, 155, 175] },
  "4/0 AWG": { Copper: [195, 230, 260], Aluminum: [150, 180, 205] },
  "250 KCMIL": { Copper: [215, 255, 290], Aluminum: [170, 205, 230] },
  "300 KCMIL": { Copper: [240, 285, 320], Aluminum: [195, 230, 260] },
  "350 KCMIL": { Copper: [260, 310, 350], Aluminum: [210, 250, 280] },
  "400 KCMIL": { Copper: [280, 335, 380], Aluminum: [225, 270, 305] },
  "500 KCMIL": { Copper: [320, 380, 430], Aluminum: [260, 310, 350] },
  "600 KCMIL": { Copper: [350, 420, 475], Aluminum: [285, 340, 385] },
  "700 KCMIL": { Copper: [385, 460, 520], Aluminum: [315, 375, 425] },
  "750 KCMIL": { Copper: [400, 475, 535], Aluminum: [320, 385, 435] },
  "800 KCMIL": { Copper: [410, 490, 555], Aluminum: [330, 395, 445] },
  "900 KCMIL": { Copper: [435, 520, 585], Aluminum: [355, 425, 480] },
  "1000 KCMIL": { Copper: [455, 545, 615], Aluminum: [375, 445, 500] },
};

function lookupCableAmpacity(size, material, rating) {
  const ratingIndex = ["60", "75", "90"].indexOf(String(rating));
  if (ratingIndex < 0 || !["Copper", "Aluminum"].includes(material)) return null;
  const ampacity = CABLE_AMPACITY_TABLE[size]?.[material]?.[ratingIndex];
  return Number.isFinite(ampacity) ? ampacity : null;
}
