// Resistance and reactance values are in ohms per 1,000 ft at 75°C.
const CABLE_AC_IMPEDANCE_TABLE = {
  "14 AWG": { reactance: { nm: 0.058, steel: 0.073 }, resistance: { Copper: { nm: 3.1, steel: 3.1 }, Aluminum: { nm: null, steel: null } } },
  "12 AWG": { reactance: { nm: 0.054, steel: 0.068 }, resistance: { Copper: { nm: 2.0, steel: 2.0 }, Aluminum: { nm: 3.2, steel: 3.2 } } },
  "10 AWG": { reactance: { nm: 0.050, steel: 0.063 }, resistance: { Copper: { nm: 1.2, steel: 1.2 }, Aluminum: { nm: 2.0, steel: 2.0 } } },
  "8 AWG": { reactance: { nm: 0.052, steel: 0.065 }, resistance: { Copper: { nm: 0.78, steel: 0.78 }, Aluminum: { nm: 1.3, steel: 1.3 } } },
  "6 AWG": { reactance: { nm: 0.051, steel: 0.064 }, resistance: { Copper: { nm: 0.49, steel: 0.49 }, Aluminum: { nm: 0.81, steel: 0.81 } } },
  "4 AWG": { reactance: { nm: 0.048, steel: 0.060 }, resistance: { Copper: { nm: 0.31, steel: 0.31 }, Aluminum: { nm: 0.51, steel: 0.51 } } },
  "3 AWG": { reactance: { nm: 0.047, steel: 0.059 }, resistance: { Copper: { nm: 0.25, steel: 0.25 }, Aluminum: { nm: 0.40, steel: 0.40 } } },
  "2 AWG": { reactance: { nm: 0.045, steel: 0.057 }, resistance: { Copper: { nm: 0.19, steel: 0.20 }, Aluminum: { nm: 0.32, steel: 0.32 } } },
  "1 AWG": { reactance: { nm: 0.046, steel: 0.057 }, resistance: { Copper: { nm: 0.15, steel: 0.16 }, Aluminum: { nm: 0.25, steel: 0.25 } } },
  "1/0 AWG": { reactance: { nm: 0.044, steel: 0.055 }, resistance: { Copper: { nm: 0.12, steel: 0.12 }, Aluminum: { nm: 0.20, steel: 0.20 } } },
  "2/0 AWG": { reactance: { nm: 0.043, steel: 0.054 }, resistance: { Copper: { nm: 0.10, steel: 0.10 }, Aluminum: { nm: 0.16, steel: 0.16 } } },
  "3/0 AWG": { reactance: { nm: 0.042, steel: 0.052 }, resistance: { Copper: { nm: 0.077, steel: 0.079 }, Aluminum: { nm: 0.13, steel: 0.13 } } },
  "4/0 AWG": { reactance: { nm: 0.041, steel: 0.051 }, resistance: { Copper: { nm: 0.062, steel: 0.063 }, Aluminum: { nm: 0.10, steel: 0.10 } } },
  "250 KCMIL": { reactance: { nm: 0.041, steel: 0.052 }, resistance: { Copper: { nm: 0.052, steel: 0.054 }, Aluminum: { nm: 0.085, steel: 0.086 } } },
  "300 KCMIL": { reactance: { nm: 0.041, steel: 0.051 }, resistance: { Copper: { nm: 0.044, steel: 0.045 }, Aluminum: { nm: 0.071, steel: 0.072 } } },
  "350 KCMIL": { reactance: { nm: 0.040, steel: 0.050 }, resistance: { Copper: { nm: 0.038, steel: 0.039 }, Aluminum: { nm: 0.061, steel: 0.063 } } },
  "400 KCMIL": { reactance: { nm: 0.040, steel: 0.049 }, resistance: { Copper: { nm: 0.033, steel: 0.035 }, Aluminum: { nm: 0.054, steel: 0.055 } } },
  "500 KCMIL": { reactance: { nm: 0.039, steel: 0.048 }, resistance: { Copper: { nm: 0.027, steel: 0.029 }, Aluminum: { nm: 0.043, steel: 0.045 } } },
  "600 KCMIL": { reactance: { nm: 0.039, steel: 0.048 }, resistance: { Copper: { nm: 0.023, steel: 0.025 }, Aluminum: { nm: 0.036, steel: 0.038 } } },
  "750 KCMIL": { reactance: { nm: 0.038, steel: 0.048 }, resistance: { Copper: { nm: 0.019, steel: 0.021 }, Aluminum: { nm: 0.029, steel: 0.031 } } },
  "1000 KCMIL": { reactance: { nm: 0.037, steel: 0.046 }, resistance: { Copper: { nm: 0.015, steel: 0.018 }, Aluminum: { nm: 0.023, steel: 0.025 } } },
};

function lookupCableACImpedance(size, material, racewayClass) {
  const row = CABLE_AC_IMPEDANCE_TABLE[size];
  const resistance = row?.resistance?.[material]?.[racewayClass];
  const reactance = row?.reactance?.[racewayClass];
  return Number.isFinite(resistance) && Number.isFinite(reactance)
    ? { resistance, reactance }
    : null;
}
