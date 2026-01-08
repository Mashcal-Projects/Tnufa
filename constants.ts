
import { Asset, BrownfieldAnalysis, BrownfieldMarker, FacilityStandard, SettlementType } from './types';

export const FACILITY_STANDARDS: FacilityStandard[] = [
  {
    id: 'daycare',
    name: 'מעון יום (0-3)',
    category: 'education',
    targetPopulationAge: [0, 3],
    participationRate: 50,
    classSize: 20,
    landAllocation: 1.5,
    builtArea: 440,
    minPopulationForFacility: 0,
    populationRatio: 0.07
  },
  {
    id: 'kindergarten',
    name: 'גן ילדים (3-6)',
    category: 'education',
    targetPopulationAge: [3, 6],
    participationRate: 100,
    classSize: 30,
    landAllocation: 0.5,
    builtArea: 130,
    minPopulationForFacility: 0,
    populationRatio: 0.06
  },
  {
    id: 'elementary',
    name: 'בית ספר יסודי (6-12)',
    category: 'education',
    targetPopulationAge: [6, 12],
    participationRate: 100,
    classSize: 27,
    landAllocation: 4.8,
    builtArea: 2100,
    minPopulationForFacility: 0,
    populationRatio: 0.12
  },
  {
    id: 'highschool',
    name: 'בית ספר על-יסודי (12-18)',
    category: 'education',
    targetPopulationAge: [12, 18],
    participationRate: 100,
    classSize: 27,
    landAllocation: 15.0,
    builtArea: 7400,
    minPopulationForFacility: 0,
    populationRatio: 0.10
  }
];

export const BROWNFIELD_ANALYSIS_DATA: BrownfieldAnalysis[] = [
  { 
      id: 1, 
      name: "מתחם התעשייה הישן", 
      size: "120 דונם",
      buildings: "מבני תעשייה קלה (x8), מחסן לוגיסטי (x2)",
      radar: [
          { subject: 'עלות שיקום', A: 140, B: 100, fullMark: 150 },
          { subject: 'קיבולת יח"ד', A: 135, B: 145, fullMark: 150 },
          { subject: 'זמן אישור', A: 50, B: 120, fullMark: 150 },
          { subject: 'נגישות', A: 130, B: 130, fullMark: 150 },
          { subject: 'פינוי מבנים', A: 105, B: 90, fullMark: 150 },
      ]
  }
];

export const ASSETS_DATA: Asset[] = [
  { id: 101, name: "בית ספר 'הגפן'", type: "חינוך יסודי", size: 3500, roi: 0, condition: "מתוחזק היטב", maintenance_due: "2026-09-01", risk: "נמוך" },
  { id: 102, name: "מרכז קהילתי דרום", type: "חברה וקהילה", size: 1200, roi: 0, condition: "ליקוי איטום", maintenance_due: "2025-01-20", risk: "בינוני" },
  { id: 103, name: "מקווה טהרה ב'", type: "דת", size: 150, roi: 0, condition: "דורש שיפוץ מיידי", maintenance_due: "2024-12-01", risk: "גבוה" }
];

export const BROWNFIELD_MARKERS: BrownfieldMarker[] = [
  { id: 1, lat: 31.8900, lng: 35.0500, name: "מתחם התעשייה הישן", risk: "גבוה", details: "זיהום קרקע חשוד" },
  { id: 2, lat: 31.8950, lng: 35.0050, name: "מגרש חניה נטוש", risk: "בינוני", details: "נדרש שיקום תשתיות" }
];

export const ISRAELI_SETTLEMENTS: { name: string; type: SettlementType }[] = [
    { name: "תל אביב - יפו", type: "urban_renewal" },
    { name: "ירושלים", type: "urban_renewal" },
    { name: "מודיעין מכבים רעות", type: "urban_new" },
    { name: "באר שבע", type: "urban_new" }
];

export const CHART_COLORS = {
  primary: '#06b6d4',
  secondary: '#f43f5e',
  yellow: '#fbbf24',
  grid: '#334155',
  text: '#94a3b8',
  lightGrid: '#e2e8f0',
  lightText: '#64748b'
};
