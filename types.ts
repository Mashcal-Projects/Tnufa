
export type ViewState = 'dashboard' | 'analytics' | 'calculators' | 'assets' | 'planning' | 'settings' | 'geoai' | 'funding';

export interface Asset {
  id: number;
  name: string;
  type: string;
  size: number;
  roi: number;
  condition: string;
  maintenance_due: string;
  risk: 'נמוך' | 'בינוני' | 'גבוה';
}

export interface BrownfieldMarker {
  id: number;
  lat: number;
  lng: number;
  name: string;
  risk: 'נמוך' | 'בינוני' | 'גבוה';
  details: string;
}

export type SectorType = 'general' | 'haredi' | 'arab' | 'druze';
export type SettlementType = 'urban_new' | 'urban_renewal' | 'rural';

export interface ProgrammaticInputs {
  housingUnits: number;
  avgHouseholdSize: number;
  sector: SectorType;
  settlementType: SettlementType;
}

export interface FacilityStandard {
  id: string;
  name: string;
  category: 'education' | 'health' | 'religion' | 'culture' | 'open_space';
  targetPopulationAge: [number, number];
  participationRate: number;
  classSize: number;
  landAllocation: number;
  builtArea: number;
  minPopulationForFacility: number;
  populationRatio: number;
}

export interface RequirementResult {
  facilityName: string;
  requiredUnits: number;
  requiredInstitutions: number;
  totalLandArea: number;
  totalBuiltArea: number;
}

export interface BrownfieldAnalysis {
  id: number;
  name: string;
  size: string;
  buildings: string;
  radar: { subject: string; A: number; B: number; fullMark: number }[];
}

export interface DashboardItem {
  category: 'kpi' | 'progress';
  title: string;
  value: string;
  target: string;
  trend: string;
  trendValue?: string;
  subtext: string;
  icon: string;
}
