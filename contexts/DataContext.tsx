
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Asset, BrownfieldMarker, FacilityStandard, SettlementType, BrownfieldAnalysis, DashboardItem } from '../types';
import { useAuth } from './AuthContext';

// The single source of truth for all users
const SHARED_MASTER_ID = '1HnQhzoeuHUUF6uL9lFD6fEOmLxBNvjEIsmM7jpfTlms';

interface DataContextType {
  settlements: { name: string; type: SettlementType }[];
  assets: Asset[];
  standards: FacilityStandard[];
  markers: BrownfieldMarker[];
  analytics: BrownfieldAnalysis[];
  dashboard: DashboardItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType>({
  settlements: [],
  assets: [],
  standards: [],
  markers: [],
  analytics: [],
  dashboard: [],
  loading: false,
  error: null,
  refreshData: () => { },
});

export const useData = () => useContext(DataContext);

const parseCSV = (text: string) => {
  const cleanText = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_')
  );

  return lines.slice(1).map(line => {
    const row: any = {};
    let currentVal = '';
    let insideQuote = false;
    let colIndex = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') { currentVal += '"'; i++; }
        else insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        const header = headers[colIndex];
        if (header) row[header] = currentVal;
        currentVal = ''; colIndex++;
      } else currentVal += char;
    }
    const header = headers[colIndex];
    if (header) row[header] = currentVal;
    return row;
  });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>({ settlements: [], assets: [], standards: [], markers: [], analytics: [], dashboard: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);

    const fetchSheet = async (sheet: string) => {
      const url = `https://docs.google.com/spreadsheets/d/${SHARED_MASTER_ID}/gviz/tq?tqx=out:csv&sheet=${sheet}&t=${Date.now()}`;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);

        if (!res.ok) throw new Error(`Fetch failed for sheet: ${sheet}`);
        const text = await res.text();
        const rawRows = parseCSV(text);

        // MANDATORY USER ISOLATION:
        // Every row must have a user_id column.
        // We only show rows belonging to the user, or marked as 'public' for demo.
        const filtered = rawRows.filter(row => {
          const rowUid = (row.user_id || '').trim();
          // Allow matches to current user, specific tags, OR empty user_id (default data)
          return rowUid === user.uid || rowUid === 'public' || rowUid === 'master' || rowUid === '';
        });

        console.log(`Sheet ${sheet}: fetched ${rawRows.length} rows, kept ${filtered.length} rows for user ${user.uid}`);
        return filtered;
      } catch (e: any) {
        console.error(`Error fetching sheet ${sheet}:`, e.message || e);
        return [];
      }
    };

    try {
      const [sRaw, aRaw, stRaw, mRaw, anRaw, dRaw] = await Promise.all([
        fetchSheet('Settlements'), fetchSheet('Assets'), fetchSheet('Standards'),
        fetchSheet('MapMarkers'), fetchSheet('Analytics'), fetchSheet('Dashboard')
      ]);

      setData({
        settlements: sRaw.map(s => ({ name: (s.name || '').trim(), type: (s.type || 'urban_new').trim() })),
        assets: aRaw.map(a => ({
          id: Number(a.id) || Math.random(),
          name: (a.name || '').trim(),
          type: (a.type || 'כללי').trim(),
          size: Number(a.size) || 0,
          roi: Number(a.roi) || 0,
          condition: (a.condition || 'Unknown').trim(),
          maintenance_due: (a.maintenance_due || '').trim(),
          risk: (a.risk || 'נמוך').trim() as any
        })),
        standards: stRaw.map(s => ({
          id: s.id?.trim(), name: s.name?.trim(), category: (s.category || 'education').trim(),
          targetPopulationAge: [Number(s.min_age) || 0, Number(s.max_age) || 120],
          participationRate: Number(s.participation_rate) || 100,
          classSize: Number(s.class_size) || 30,
          landAllocation: Number(s.land_allocation) || 0,
          builtArea: Number(s.built_area) || 0,
          minPopulationForFacility: Number(s.threshold) || 0,
          populationRatio: Number(s.population_ratio) || 0.1
        })),
        markers: mRaw.map(m => ({
          id: Number(m.id) || Math.random(),
          lat: Number(m.lat),
          lng: Number(m.lng),
          name: (m.name || 'Marker').trim(),
          risk: (m.risk || 'נמוך').trim() as any,
          details: (m.details || '').trim()
        })),
        analytics: anRaw.map(a => ({
          id: Number(a.id) || Math.random(),
          name: (a.name || 'Site').trim(),
          size: (a.size || '0').trim(),
          buildings: (a.buildings || 'None').trim(),
          radar: [
            { subject: 'עלות שיקום', A: Number(a.cost_existing || 0), B: Number(a.cost_potential || 0), fullMark: 150 },
            { subject: 'קיבולת יח"ד', A: Number(a.capacity_existing || 0), B: Number(a.capacity_potential || 0), fullMark: 150 },
            { subject: 'זמן אישור', A: Number(a.time_existing || 0), B: Number(a.time_potential || 0), fullMark: 150 },
            { subject: 'נגישות', A: Number(a.access_existing || 0), B: Number(a.access_potential || 0), fullMark: 150 },
            { subject: 'פינוי מבנים', A: Number(a.clear_existing || 0), B: Number(a.clear_potential || 0), fullMark: 150 },
          ]
        })),
        dashboard: dRaw.map(d => ({
          ...d,
          category: d.category === 'kpi' ? 'kpi' : 'progress',
          value: String(d.value || '0').trim(),
          target: String(d.target || '0').trim(),
          title: (d.title || '').trim(),
          icon: (d.icon || '').trim(),
          trend: (d.trend || '').trim(),
          subtext: (d.subtext || '').trim()
        }))
      });
    } catch (err) {
      setError("שגיאה בסנכרון נתונים.");
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user && !authLoading) fetchData();
  }, [user, authLoading]);

  return (
    <DataContext.Provider value={{
      ...data,
      loading,
      error,
      refreshData: fetchData,
    }}>
      {children}
    </DataContext.Provider>
  );
};
