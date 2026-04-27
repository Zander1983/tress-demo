import { useMemo, useState } from "react";

const STANDARD_SCENARIOS = [
  "ROO1_Deep_ASHP",
  "ROO2_Medium_ASHP",
  "ROO3_Deep_ASHP_Biomass",
  "ROO4_Medium_Biomass",
];

type ScenarioMetrics = {
  upgradedEui: number;
  upgradedEmissionsTco2: number;
  upgradedEnergyCostEur: number;
  energyReductionPct: number;
  emissionReductionPct: number;
  energyCostReductionPct: number;
  capexEur: number;
  sppYears: number;
  irrPct: number;
  npvEur: number;
};

type BuildingRecord = {
  building: string;
  type: string;
  year: number;
  energyKwh: number;
  floorAreaM2: number;
  floors: number;
  currentEui: number;
  currentEmissionsTco2: number;
  currentEnergyCostEur: number;
  scenarios: Record<string, ScenarioMetrics>;
};

type StatSummary = {
  mean: number;
  std: number;
};

type BaselineNeighbour = BuildingRecord & {
  distance: number;
};

type BaselineResult = {
  nearest: BaselineNeighbour[];
  predictedCurrentEui: number;
  currentEnergy: number;
  emissionFactor: number;
  costPerKwh: number;
  currentEmissions: number;
  currentCost: number;
  chosen: BuildingRecord[];
};

type PredictionResult = {
  scenario: string;
  upgradedEui: number;
  upgradedEnergy: number;
  upgradedEmissions: number;
  upgradedCost: number;
  energyReductionPct: number;
  emissionReductionPct: number;
  energyCostReductionPct: number;
  capexPerM2: number;
  capexEur: number;
  sppYears: number | null;
  irrPct: number | null;
  npvEur: number;
  supportCount: number;
};

const dataset: BuildingRecord[] = [
  {
    building: "Killarney Sports & Leisure Centre",
    type: "Leisure centre",
    year: 2007,
    energyKwh: 1609796,
    floorAreaM2: 4374,
    floors: 2,
    currentEui: 368.0374943,
    currentEmissionsTco2: 357,
    currentEnergyCostEur: 230380,
    scenarios: {
      ROO1_Deep_ASHP: {
        upgradedEui: 112,
        upgradedEmissionsTco2: 68,
        upgradedEnergyCostEur: 81000,
        energyReductionPct: 70,
        emissionReductionPct: 80,
        energyCostReductionPct: 65,
        capexEur: 4230000,
        sppYears: 28,
        irrPct: 2.5,
        npvEur: -1200000,
      },
      ROO2_Medium_ASHP: {
        upgradedEui: 150,
        upgradedEmissionsTco2: 110,
        upgradedEnergyCostEur: 110000,
        energyReductionPct: 59,
        emissionReductionPct: 69,
        energyCostReductionPct: 52,
        capexEur: 3100000,
        sppYears: 23,
        irrPct: 3.2,
        npvEur: -650000,
      },
      ROO3_Deep_ASHP_Biomass: {
        upgradedEui: 118,
        upgradedEmissionsTco2: 60,
        upgradedEnergyCostEur: 78000,
        energyReductionPct: 68,
        emissionReductionPct: 83,
        energyCostReductionPct: 66,
        capexEur: 4450000,
        sppYears: 30,
        irrPct: 2.3,
        npvEur: -1500000,
      },
      ROO4_Medium_Biomass: {
        upgradedEui: 165,
        upgradedEmissionsTco2: 95,
        upgradedEnergyCostEur: 105000,
        energyReductionPct: 55,
        emissionReductionPct: 73,
        energyCostReductionPct: 54,
        capexEur: 3300000,
        sppYears: 24,
        irrPct: 3,
        npvEur: -800000,
      },
    },
  },
  {
    building: "Lissanalta House",
    type: "Office/Public_Admin",
    floorAreaM2: 4430,
    energyKwh: 737725,
    currentEui: 167,
    currentEmissionsTco2: 150.6,
    currentEnergyCostEur: 141563,
    year: 2007,

    floors: 2,
    
    scenarios: {
      ROO1_Deep_ASHP: {
        upgradedEui: 70,
        upgradedEmissionsTco2: 12,
        upgradedEnergyCostEur: 14500,
        energyReductionPct: 59,
        emissionReductionPct: 75,
        energyCostReductionPct: 62,
        capexEur: 610000,
        sppYears: 14,
        irrPct: 5.8,
        npvEur: 95000,
      },
      ROO2_Medium_ASHP: {
        upgradedEui: 95,
        upgradedEmissionsTco2: 20,
        upgradedEnergyCostEur: 19000,
        energyReductionPct: 44,
        emissionReductionPct: 57,
        energyCostReductionPct: 50,
        capexEur: 420000,
        sppYears: 11,
        irrPct: 7.2,
        npvEur: 120000,
      },
      ROO3_Deep_ASHP_Biomass: {
        upgradedEui: 72,
        upgradedEmissionsTco2: 10,
        upgradedEnergyCostEur: 13800,
        energyReductionPct: 58,
        emissionReductionPct: 78,
        energyCostReductionPct: 64,
        capexEur: 660000,
        sppYears: 16,
        irrPct: 5.2,
        npvEur: 60000,
      },
      ROO4_Medium_Biomass: {
        upgradedEui: 105,
        upgradedEmissionsTco2: 18,
        upgradedEnergyCostEur: 20000,
        energyReductionPct: 38,
        emissionReductionPct: 62,
        energyCostReductionPct: 48,
        capexEur: 450000,
        sppYears: 12,
        irrPct: 6.5,
        npvEur: 80000,
      },
    },
  },
  {
    building: "Merchants Quay",
    type: "Office/Public_Admin",

    floorAreaM2: 6960,
    energyKwh: 1198866,
    currentEui: 172,
    currentEmissionsTco2: 254.1,
    currentEnergyCostEur: 182371,
    year: 1990,
    floors: 3,

    scenarios: {
      ROO1_Deep_ASHP: {
        upgradedEui: 75,
        upgradedEmissionsTco2: 16,
        upgradedEnergyCostEur: 21000,
        energyReductionPct: 56,
        emissionReductionPct: 77,
        energyCostReductionPct: 66,
        capexEur: 890000,
        sppYears: 13,
        irrPct: 6.1,
        npvEur: 155000,
      },
      ROO2_Medium_ASHP: {
        upgradedEui: 105,
        upgradedEmissionsTco2: 26,
        upgradedEnergyCostEur: 27000,
        energyReductionPct: 39,
        emissionReductionPct: 62,
        energyCostReductionPct: 56,
        capexEur: 610000,
        sppYears: 10,
        irrPct: 7.5,
        npvEur: 210000,
      },
      ROO3_Deep_ASHP_Biomass: {
        upgradedEui: 78,
        upgradedEmissionsTco2: 14,
        upgradedEnergyCostEur: 20000,
        energyReductionPct: 54,
        emissionReductionPct: 80,
        energyCostReductionPct: 67,
        capexEur: 940000,
        sppYears: 14,
        irrPct: 5.8,
        npvEur: 120000,
      },
      ROO4_Medium_Biomass: {
        upgradedEui: 112,
        upgradedEmissionsTco2: 24,
        upgradedEnergyCostEur: 28500,
        energyReductionPct: 35,
        emissionReductionPct: 65,
        energyCostReductionPct: 53,
        capexEur: 650000,
        sppYears: 11,
        irrPct: 7,
        npvEur: 175000,
      },
    },
  },
  {
    building: "Áras Contae an Chláir",
    type: "Office/Public_Admin",
    year: 1981,
    energyKwh: 1187508,
    floorAreaM2: 8809,
    floors: 1,
    currentEui: 134.8062209,
    
    currentEmissionsTco2: 191.5,

    currentEnergyCostEur: 187456,
    scenarios: {
      Upgrade_Major_ASHP: {
        upgradedEui: 66,
        upgradedEmissionsTco2: 61,
        upgradedEnergyCostEur: 64995,
        energyReductionPct: 51,
        emissionReductionPct: 69,
        energyCostReductionPct: 65,
        capexEur: 1195620,
        sppYears: 9.8,
        irrPct: 9.4,
        npvEur: 331000,
      },
      Upgrade_Deep_ASHP_Fabric: {
        upgradedEui: 61,
        upgradedEmissionsTco2: 50,
        upgradedEnergyCostEur: 54439,
        energyReductionPct: 55,
        emissionReductionPct: 74,
        energyCostReductionPct: 71,
        capexEur: 8272974,
        sppYears: 62.2,
        irrPct: -1.6,
        npvEur: -6670000,
      },
    },
  },
  {
    building: "Tralee Sports Complex",
    type: "Leisure centre",
    year: 2000,
    energyKwh: 1750000,
    floorAreaM2: 7200,
    floors: 2,
    currentEui: 340.2777778,
    currentEmissionsTco2: 520,
    currentEnergyCostEur: 295000,
    scenarios: {
      Medium_ASHP_PV: {
        upgradedEui: 170,
        upgradedEmissionsTco2: 210,
        upgradedEnergyCostEur: 170000,
        energyReductionPct: 50,
        emissionReductionPct: 60,
        energyCostReductionPct: 42,
        capexEur: 4200000,
        sppYears: 22,
        irrPct: 3.6,
        npvEur: -520000,
      },
      Deep_ASHP_Fabric_PV: {
        upgradedEui: 115,
        upgradedEmissionsTco2: 120,
        upgradedEnergyCostEur: 120000,
        energyReductionPct: 66,
        emissionReductionPct: 77,
        energyCostReductionPct: 59,
        capexEur: 6900000,
        sppYears: 27,
        irrPct: 2.4,
        npvEur: -1750000,
      },
    },
  },
  {
    building: "Ennis Leisure Complex",
    type: "Leisure centre",
    year: 2005,
    floors: 2,
    floorAreaM2: 2222,
    energyKwh: 1916631,
    currentEui: 863,
    currentEmissionsTco2: 404.7,
    currentEnergyCostEur: 209428,

    scenarios: {
      ROO1_Deep_ASHP: {
        upgradedEui: 115,
        upgradedEmissionsTco2: 95,
        upgradedEnergyCostEur: 92000,
        energyReductionPct: 68,
        emissionReductionPct: 77,
        energyCostReductionPct: 64,
        capexEur: 4600000,
        sppYears: 29,
        irrPct: 2.6,
        npvEur: -1400000,
      },
      ROO2_Medium_ASHP: {
        upgradedEui: 155,
        upgradedEmissionsTco2: 140,
        upgradedEnergyCostEur: 130000,
        energyReductionPct: 56,
        emissionReductionPct: 66,
        energyCostReductionPct: 49,
        capexEur: 3350000,
        sppYears: 23,
        irrPct: 3.4,
        npvEur: -600000,
      },
      ROO3_Deep_ASHP_Biomass: {
        upgradedEui: 120,
        upgradedEmissionsTco2: 85,
        upgradedEnergyCostEur: 88000,
        energyReductionPct: 66,
        emissionReductionPct: 79,
        energyCostReductionPct: 65,
        capexEur: 4800000,
        sppYears: 31,
        irrPct: 2.4,
        npvEur: -1600000,
      },
      ROO4_Medium_Biomass: {
        upgradedEui: 170,
        upgradedEmissionsTco2: 120,
        upgradedEnergyCostEur: 135000,
        energyReductionPct: 52,
        emissionReductionPct: 71,
        energyCostReductionPct: 47,
        capexEur: 3500000,
        sppYears: 25,
        irrPct: 3.1,
        npvEur: -750000,
      },
    },
  },
];



function normaliseScenario(name: string): string | null {
  if (name.includes("Deep") && name.includes("ASHP") && !name.includes("Biomass")) {
    return "ROO1_Deep_ASHP";
  }
  if (name.includes("Medium") && name.includes("ASHP")) {
    return "ROO2_Medium_ASHP";
  }
  if (name.includes("Deep") && name.includes("Biomass")) {
    return "ROO3_Deep_ASHP_Biomass";
  }
  if (name.includes("Medium") && name.includes("Biomass")) {
    return "ROO4_Medium_Biomass";
  }
  if (name.includes("Major") && name.includes("ASHP")) {
    return "ROO1_Deep_ASHP"; // treat as deep
  }
  if (name.includes("Fabric")) {
    return "ROO1_Deep_ASHP"; // treat as deep fabric upgrade
  }
  return null;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length <= 1) return 1;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance) || 1;
}

function netPresentValue(rate: number, cashflows: number[]): number {
  return cashflows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
}

function internalRateOfReturn(cashflows: number[]): number | null {
  let low = -0.99;
  let high = 1.5;
  let npvLow = netPresentValue(low, cashflows);
  let npvHigh = netPresentValue(high, cashflows);
  if (npvLow * npvHigh > 0) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const npvMid = netPresentValue(mid, cashflows);
    if (Math.abs(npvMid) < 1e-7) return mid * 100;
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return ((low + high) / 2) * 100;
}

function formatScenarioName(name: string): string {
  return name.replaceAll("_", " ");
}

function SectionHeader({
  step,
  title,
  subtitle,
}: {
  step: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white shadow-sm">
        {step}
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
          {icon}
        </div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-emerald-700">
        {value}
      </div>
      {unit ? <div className="mt-1 text-sm text-slate-500">{unit}</div> : null}
    </div>
  );
}

function scenarioAccent(scenario: string): {
  border: string;
  text: string;
  bg: string;
  chip: string;
  icon: string;
} {
  const s = scenario.toLowerCase();
  if (s.includes("deep") && s.includes("biomass")) {
    return {
      border: "border-violet-200",
      text: "text-violet-700",
      bg: "bg-violet-50",
      chip: "bg-violet-100 text-violet-700",
      icon: "🔥",
    };
  }
  if (s.includes("medium") && s.includes("biomass")) {
    return {
      border: "border-amber-200",
      text: "text-amber-700",
      bg: "bg-amber-50",
      chip: "bg-amber-100 text-amber-700",
      icon: "🍂",
    };
  }
  if (s.includes("medium")) {
    return {
      border: "border-blue-200",
      text: "text-blue-700",
      bg: "bg-blue-50",
      chip: "bg-blue-100 text-blue-700",
      icon: "🛠️",
    };
  }
  return {
    border: "border-emerald-200",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    chip: "bg-emerald-100 text-emerald-700",
    icon: "🌿",
  };
}

export default function App() {
  const typeOptions = Array.from(new Set(dataset.map((d) => d.type)));

  const [buildingType, setBuildingType] =
    useState<string>("Office/Public_Admin");
  const [year, setYear] = useState<number>(2010);
  const [floorArea, setFloorArea] = useState<number>(6000);
  const [floors, setFloors] = useState<number>(3);
  const [energyProvided, setEnergyProvided] = useState<boolean>(false);
  const [energyKwh, setEnergyKwh] = useState<number>(1400000);
  const [k, setK] = useState<number>(2);

  const filtered = useMemo(
    () => dataset.filter((d) => d.type === buildingType),
    [buildingType]
  );

  const stats = useMemo(() => {
    const years = filtered.map((d) => d.year);
    const floorAreas = filtered.map((d) => d.floorAreaM2);
    const floorCounts = filtered.map((d) => d.floors);
    const currentEuis = filtered.map((d) => d.currentEui);

    return {
      year: { mean: mean(years), std: std(years) } as StatSummary,
      floorAreaM2: {
        mean: mean(floorAreas),
        std: std(floorAreas),
      } as StatSummary,
      floors: { mean: mean(floorCounts), std: std(floorCounts) } as StatSummary,
      currentEui: {
        mean: mean(currentEuis),
        std: std(currentEuis),
      } as StatSummary,
    };
  }, [filtered]);

  const baseline = useMemo<BaselineResult | null>(() => {
    if (!filtered.length) return null;

    const fallbackCurrentEui = mean(filtered.map((d) => d.currentEui));
    const testCurrentEui =
      energyProvided && floorArea > 0
        ? energyKwh / floorArea
        : fallbackCurrentEui;

    const zNew = {
      year: (year - stats.year.mean) / stats.year.std,
      floorAreaM2:
        (floorArea - stats.floorAreaM2.mean) / stats.floorAreaM2.std,
      floors: (floors - stats.floors.mean) / stats.floors.std,
      currentEui: (testCurrentEui - stats.currentEui.mean) / stats.currentEui.std,
    };

    const nearest = filtered
      .map((d) => {
        const zD = {
          year: (d.year - stats.year.mean) / stats.year.std,
          floorAreaM2:
            (d.floorAreaM2 - stats.floorAreaM2.mean) / stats.floorAreaM2.std,
          floors: (d.floors - stats.floors.mean) / stats.floors.std,
          currentEui:
            (d.currentEui - stats.currentEui.mean) / stats.currentEui.std,
        };

        const distance = Math.sqrt(
          (zNew.year - zD.year) ** 2 +
            (zNew.floorAreaM2 - zD.floorAreaM2) ** 2 +
            (zNew.floors - zD.floors) ** 2 +
            (zNew.currentEui - zD.currentEui) ** 2
        );

        return { ...d, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const chosen = nearest.slice(0, Math.min(k, nearest.length));
    console.log("Nearest neighbours used:", chosen);

    const avg = (fn: (n: BaselineNeighbour) => number): number =>
      chosen.reduce((sum, n) => sum + fn(n), 0) / chosen.length;

    const predictedCurrentEui =
      energyProvided && floorArea > 0
        ? energyKwh / floorArea
        : avg((n) => n.currentEui);
    const currentEnergy = energyProvided
      ? energyKwh
      : predictedCurrentEui * floorArea;
    const emissionFactor = avg((n) => n.currentEmissionsTco2 / n.energyKwh);
    const costPerKwh = avg((n) => n.currentEnergyCostEur / n.energyKwh);
    const currentEmissions = currentEnergy * emissionFactor;
    const currentCost = currentEnergy * costPerKwh;

    return {
      nearest,
      predictedCurrentEui,
      currentEnergy,
      emissionFactor,
      costPerKwh,
      currentEmissions,
      currentCost,
      chosen
    };
  }, [filtered, stats, year, floorArea, floors, energyProvided, energyKwh, k]);

  const allScenarioNames = STANDARD_SCENARIOS;

  const predictions = useMemo<PredictionResult[]>(() => {
    if (!baseline) return [];

    const chosen = baseline.nearest.slice(0, Math.min(k, baseline.nearest.length));
    const results: PredictionResult[] = [];

    for (const scenario of allScenarioNames) {
      const supports = chosen.filter((n) =>
        Object.keys(n.scenarios).some(
          (s) => normaliseScenario(s) === scenario
        )
      );
      if (!supports.length) continue;

      const getScenario = (n: BaselineNeighbour) => {
        const match = Object.entries(n.scenarios).find(
          ([key]) => normaliseScenario(key) === scenario
        );

        return match?.[1];
      };

      const avg = (fn: (n: BaselineNeighbour) => number): number =>
        supports.reduce((sum, n) => sum + fn(n), 0) / supports.length;

      const upgradedEui = avg((n) => getScenario(n)?.upgradedEui ?? 0);
      const capexPerM2 = avg((n) => {
        const s = getScenario(n);
        return s ? s.capexEur / n.floorAreaM2 : 0;
      });
      const upgradedEnergy = upgradedEui * floorArea;
      const upgradedEmissions = upgradedEnergy * baseline.emissionFactor;
      const upgradedCost = upgradedEnergy * baseline.costPerKwh;
      const energyReductionPct =
        baseline.currentEnergy > 0
          ? ((baseline.currentEnergy - upgradedEnergy) /
              baseline.currentEnergy) *
            100
          : 0;
      const emissionReductionPct =
        baseline.currentEmissions > 0
          ? ((baseline.currentEmissions - upgradedEmissions) /
              baseline.currentEmissions) *
            100
          : 0;
      const energyCostReductionPct =
        baseline.currentCost > 0
          ? ((baseline.currentCost - upgradedCost) / baseline.currentCost) * 100
          : 0;
      const capexEur = capexPerM2 * floorArea;
      const annualSaving = Math.max(0, baseline.currentCost - upgradedCost);
      const sppYears = annualSaving > 0 ? capexEur / annualSaving : null;
      const cashflows = [
        -capexEur,
        ...Array.from({ length: 20 }, () => annualSaving),
      ];
      const irrPct = internalRateOfReturn(cashflows);
      const npvEur = netPresentValue(0.05, cashflows);

      results.push({
        scenario,
        upgradedEui,
        upgradedEnergy,
        upgradedEmissions,
        upgradedCost,
        energyReductionPct,
        emissionReductionPct,
        energyCostReductionPct,
        capexPerM2,
        capexEur,
        sppYears,
        irrPct,
        npvEur,
        supportCount: supports.length,
      });
    }

    console.log("Scenario predictions:", results);
    return results;
  }, [baseline, allScenarioNames, floorArea, k]);

  const fmtInt = new Intl.NumberFormat("en-IE", {
    maximumFractionDigits: 0,
  });
  const fmt1 = new Intl.NumberFormat("en-IE", {
    maximumFractionDigits: 1,
  });
  const fmtCurrency = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const bestCapex = predictions.length
    ? Math.min(...predictions.map((p) => p.capexEur))
    : null;
  const bestRunningCost = predictions.length
    ? Math.min(...predictions.map((p) => p.upgradedCost))
    : null;
  const bestPayback = predictions.length
    ? Math.min(
        ...predictions.map((p) => p.sppYears ?? Number.POSITIVE_INFINITY)
      )
    : null;
  const bestEmissions = predictions.length
    ? Math.max(...predictions.map((p) => p.emissionReductionPct))
    : null;

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-emerald-600 text-xl font-bold text-white shadow-md">
                ◈
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">TRESS</div>
                <div className="text-sm text-slate-500">Pre-audit predictor</div>
              </div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Compare retrofit options quickly
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Scenario comparison
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Enter the basic building details, then compare capex, running cost,
              savings and payback across the available retrofit options.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label className="grid gap-2 xl:col-span-1">
                <span className="text-sm font-medium text-slate-700">
                  Building type
                </span>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500"
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Year</span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Floor area (m²)
                </span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500"
                  type="number"
                  value={floorArea}
                  onChange={(e) => setFloorArea(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Floors</span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500"
                  type="number"
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Annual energy (kWh)
                </span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500 disabled:bg-slate-100"
                  type="number"
                  disabled={!energyProvided}
                  placeholder="Optional"
                  value={energyKwh}
                  onChange={(e) => setEnergyKwh(Number(e.target.value))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  k neighbours
                </span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm outline-none transition focus:border-teal-500"
                  type="number"
                  min={1}
                  max={Math.max(1, filtered.length)}
                  value={k}
                  onChange={(e) =>
                    setK(
                      Math.max(
                        1,
                        Math.min(
                          Number(e.target.value),
                          Math.max(1, filtered.length)
                        )
                      )
                    )
                  }
                />
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <input
                id="energy-toggle"
                type="checkbox"
                checked={energyProvided}
                onChange={(e) => setEnergyProvided(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="energy-toggle" className="text-sm text-slate-700">
                I know the annual energy use and want to use it instead of estimating it
              </label>


            </div>


              <div>

                {baseline && (
                  <span className="text-sm text-slate-700">
                    Closest audited buildings: {baseline.chosen?.map(b => b.building).join(", ")}
                  </span>

                  )}

               </div>
          </div>
        </div>

        {baseline && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon="⚡"
                label="Current energy"
                value={fmtInt.format(baseline.currentEnergy)}
                unit="kWh / year"
              />
              <KpiCard
                icon="🌍"
                label="Current emissions"
                value={fmt1.format(baseline.currentEmissions)}
                unit="tCO₂ / year"
              />
              <KpiCard
                icon="€"
                label="Current running cost"
                value={fmtCurrency.format(baseline.currentCost)}
                unit="per year"
              />
              <KpiCard
                icon="📏"
                label="Current EUI"
                value={fmt1.format(baseline.predictedCurrentEui)}
                unit="kWh / m²"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader
                step="2"
                title="Scenario comparison"
                subtitle="The model details are hidden. Neighbours and distances are logged to the browser console."
              />

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-4 py-2">Scenario</th>
                      <th className="px-4 py-2">Capex</th>
                      <th className="px-4 py-2">Running cost</th>
                      <th className="px-4 py-2">Savings / year</th>
                      <th className="px-4 py-2">Energy ↓</th>
                      <th className="px-4 py-2">Emissions ↓</th>
                      <th className="px-4 py-2">Payback</th>
                      <th className="px-4 py-2">IRR</th>
                      <th className="px-4 py-2">NPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => {
                      const accent = scenarioAccent(p.scenario);
                      const annualSaving = Math.max(
                        0,
                        baseline.currentCost - p.upgradedCost
                      );
                      const isLowestCapex =
                        bestCapex !== null && p.capexEur === bestCapex;
                      const isLowestRunning =
                        bestRunningCost !== null &&
                        p.upgradedCost === bestRunningCost;
                      const isBestPayback =
                        bestPayback !== null &&
                        (p.sppYears ?? Number.POSITIVE_INFINITY) === bestPayback;
                      const isBestEmissions =
                        bestEmissions !== null &&
                        p.emissionReductionPct === bestEmissions;

                      return (
                        <tr
                          key={p.scenario}
                          className={`rounded-2xl border ${accent.border} bg-slate-50 shadow-sm`}
                        >
                          <td className="rounded-l-2xl px-4 py-4 align-top">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.bg} text-xl`}
                              >
                                {accent.icon}
                              </div>
                              <div>
                                <div className={`font-semibold ${accent.text}`}>
                                  {formatScenarioName(p.scenario)}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {isLowestCapex && (
                                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                                      Lowest capex
                                    </span>
                                  )}
                                  {isLowestRunning && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                      Lowest running cost
                                    </span>
                                  )}
                                  {isBestPayback && (
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                      Fastest payback
                                    </span>
                                  )}
                                  {isBestEmissions && (
                                    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                                      Best emissions cut
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {fmtCurrency.format(p.capexEur)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {fmtCurrency.format(p.upgradedCost)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-emerald-700">
                            {fmtCurrency.format(annualSaving)}
                          </td>
                          <td className="px-4 py-4">
                            {fmt1.format(p.energyReductionPct)}%
                          </td>
                          <td className="px-4 py-4">
                            {fmt1.format(p.emissionReductionPct)}%
                          </td>
                          <td className="px-4 py-4">
                            {p.sppYears !== null
                              ? `${fmt1.format(p.sppYears)} yrs`
                              : "—"}
                          </td>
                          <td className="px-4 py-4">
                            {p.irrPct !== null ? `${fmt1.format(p.irrPct)}%` : "—"}
                          </td>
                          <td className="rounded-r-2xl px-4 py-4">
                            {fmtCurrency.format(p.npvEur)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}