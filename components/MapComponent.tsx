
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Polyline, CircleMarker, Pane } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import * as turf from '@turf/turf';
import { GoogleGenAI } from "@google/genai";
import { Brain, Sparkles, X, AreaChart, Loader2, Info, Building2, Map as MapIcon, UserCheck, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface MapComponentProps {
    isDarkMode: boolean;
    activeLayers: {
        brownfields: boolean;
        zoning: boolean;
        infrastructure: boolean;
        schools: boolean;
        gov_planning: boolean;
    };
    activeSubLayers: number[];
}

const GeomanControl = ({ onShapeCreated, onShapeDeleted }: {
    onShapeCreated: (area: number, bounds: L.LatLngBounds) => void,
    onShapeDeleted: () => void
}) => {
    const map = useMap();

    useEffect(() => {
        if (!map.pm) return;

        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawPolyline: false,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: false,
            drawCircleMarker: false,
            cutLayer: false,
            rotateMode: false,
            dragMode: true,
            editMode: true,
            removalMode: true,
        });

        map.pm.setLang('he');

        map.on('pm:create', (e) => {
            const layer = e.layer as L.Polygon;
            const geojson = layer.toGeoJSON();
            const areaInSqM = turf.area(geojson);
            const dunams = areaInSqM / 1000;

            // Mock planning data for the popup
            const mockParcel = Math.floor(Math.random() * 9000) + 1000;
            const mockSubParcel = Math.floor(Math.random() * 100) + 1;
            const mockOwners = ["רמ\"י (רשות מקרקעי ישראל)", "עיריית מודיעין", "פרטי - מושע", "קק\"ל"];
            const owner = mockOwners[Math.floor(Math.random() * mockOwners.length)];
            const zoning = dunams > 5 ? "מגורים ג' - בנייה רוויה" : "מגורים א' - חד משפחתי";

            // Create popup content with mock data
            const popupContent = L.DomUtil.create('div', 'p-1 text-right font-sans min-w-[220px]');
            popupContent.dir = "rtl";
            popupContent.innerHTML = `
                <div class="border-b border-slate-100 pb-2 mb-2">
                    <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span class="w-2 h-2 bg-cyan-500 rounded-full"></span>
                        מידע תכנוני - שטח חדש
                    </h4>
                </div>
                <div class="space-y-2 mb-3">
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">גוש/חלקה:</span>
                        <span class="font-bold text-slate-700">${mockParcel}/${mockSubParcel}</span>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">בעלות:</span>
                        <span class="font-bold text-slate-700">${owner}</span>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">ייעוד (משוער):</span>
                        <span class="font-bold text-cyan-600">${zoning}</span>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">שטח:</span>
                        <span class="font-bold text-slate-900">${dunams.toFixed(2)} דונם</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="analyze-ai-btn" class="flex-1 bg-cyan-600 text-white text-[10px] py-1.5 rounded font-bold hover:bg-cyan-500 transition">ניתוח AI מלא</button>
                    <button id="delete-shape-btn" class="bg-slate-100 text-slate-500 p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 transition" title="סגור ומחק שטח">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;

            layer.bindPopup(popupContent, { maxWidth: 300 }).openPopup();

            // Set up interaction for the popup buttons
            layer.on('popupopen', () => {
                const aiBtn = document.getElementById('analyze-ai-btn');
                const deleteBtn = document.getElementById('delete-shape-btn');

                if (aiBtn) {
                    aiBtn.onclick = () => {
                        onShapeCreated(areaInSqM, layer.getBounds());
                        layer.closePopup();
                    };
                }

                if (deleteBtn) {
                    deleteBtn.onclick = () => {
                        map.removeLayer(layer);
                        onShapeDeleted();
                    };
                }
            });

            onShapeCreated(areaInSqM, layer.getBounds());
        });

        map.on('pm:remove', () => {
            onShapeDeleted();
        });

        return () => {
            map.pm.removeControls();
        };
    }, [map]);

    return null;
};

const MapController = ({ center, zoom, shouldFly }: { center: [number, number], zoom: number, shouldFly: boolean }) => {
    const map = useMap();
    useEffect(() => {
        if (shouldFly) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, shouldFly, map]);
    return null;
};

const GenericPolygonLayer: React.FC<{ url: string, label: string, style: any, fallbackData?: any }> = ({ url, label, style, fallbackData }) => {
    const map = useMap();
    const layerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchLayer = async () => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const geojson = await res.json();
                if (!mounted) return;
                renderData(geojson);
            } catch (err) {
                if (mounted && fallbackData) renderData(fallbackData);
            }
        };

        const renderData = (geojson: any) => {
            if (layerRef.current) map.removeLayer(layerRef.current);
            const layer = L.geoJSON(geojson, {
                style,
                onEachFeature: (feature, layer) => {
                    const title = feature.properties?.שם || feature.properties?.PLAN_NAME || label;
                    layer.bindPopup(`<div class="text-right font-sans p-1" dir="rtl"><strong>${title}</strong></div>`);
                }
            });
            layer.addTo(map);
            layerRef.current = layer;
        };

        fetchLayer();
        return () => {
            mounted = false;
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [map, url, label, style, fallbackData]);
    return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ activeLayers, activeSubLayers }) => {
    const { markers, standards } = useData();
    const [targetView, setTargetView] = useState<{ center: [number, number], zoom: number, shouldFly: boolean }>({
        center: [31.900, 35.015],
        zoom: 13,
        shouldFly: false
    });

    // Spatial Analysis State
    const [analysisArea, setAnalysisArea] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    useEffect(() => {
        if (activeLayers.gov_planning) {
            setTargetView({ center: [32.930, 35.300], zoom: 10, shouldFly: true });
        } else if (markers.length > 0 && activeLayers.brownfields) {
            setTargetView({ center: [markers[0].lat, markers[0].lng], zoom: 13, shouldFly: true });
        }
    }, [activeLayers.gov_planning, activeLayers.brownfields, markers]);

    const handleShapeCreated = (areaInSqM: number) => {
        setAnalysisArea(areaInSqM / 1000); // Convert to Dunams
        setAiInsight(null);
    };

    const generateInsight = async () => {
        if (!analysisArea) return;
        setIsAnalyzing(true);
        try {
            const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });

            const standardsContext = standards.map(s =>
                `${s.name}: דורש ${s.landAllocation} דונם קרקע לכל ${s.classSize} תושבים.`
            ).join('\n');

            const prompt = `
            ניתוח שטח מרחבי:
            המשתמש סימן שטח בגודל של ${analysisArea.toFixed(2)} דונם במפה.
            
            תקני התכנון הקיימים במערכת:
            ${standardsContext}
            
            בהתבסס על הגודל שסומן, אנא בצע:
            1. הערכה מה ניתן לבנות בשטח זה לפי התקנים (כמה כיתות, גנים או מוסדות אחרים).
            2. הצעה לשילוב (עירוב שימושים) חכם.
            3. מגבלות פוטנציאליות.
            
            ענה בעברית, בצורה מקצועית ותמציתית (בולטים).
        `;

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: prompt,
                config: {
                    systemInstruction: "You are an expert Israeli urban planner assisting with spatial analysis.",
                }
            });

            setAiInsight(response.text || "לא התקבל מענה מה-AI.");
        } catch (err) {
            setAiInsight("חלה שגיאה בייצור התובנות. אנא וודא שמפתח ה-API מוגדר כראוי.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Memoized Icons for markers to prevent re-creation and interaction lag
    const createMarkerIcon = (risk: string) => {
        const color = risk === 'גבוה' ? '#f43f5e' : '#fbbf24';
        return L.divIcon({
            className: 'custom-map-icon',
            html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1))">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="#0f172a" stroke-width="1" style="pointer-events: none">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3" fill="#0f172a"/>
                  </svg>
                </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32] // CRITICAL: This ensures the popup appears ABOVE the marker icon.
        });
    };

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
            <MapContainer
                center={targetView.center}
                zoom={targetView.zoom}
                style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            >
                <MapController center={targetView.center} zoom={targetView.zoom} shouldFly={targetView.shouldFly} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                <GeomanControl
                    onShapeCreated={handleShapeCreated}
                    onShapeDeleted={() => setAnalysisArea(null)}
                />

                {/* Spatial Analysis Result Panel */}
                {analysisArea !== null && (
                    <div className="absolute top-4 right-4 z-[500] w-80 max-h-[80%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col fade-in">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-cyan-600 text-white shadow-lg">
                            <div className="flex items-center gap-2">
                                <AreaChart className="w-5 h-5" />
                                <h3 className="font-bold text-sm">ניתוח שטח מרחבי</h3>
                            </div>
                            <button onClick={() => setAnalysisArea(null)} className="hover:bg-white/20 p-1 rounded transition" title="סגור חלונית">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">גודל השטח שסומן</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">
                                    {analysisArea.toFixed(2)} <span className="text-sm font-normal">דונם</span>
                                </div>
                            </div>

                            {!aiInsight && !isAnalyzing && (
                                <button
                                    onClick={generateInsight}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 group"
                                >
                                    <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    בקש תובנות AI
                                </button>
                            )}

                            {isAnalyzing && (
                                <div className="py-8 flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                                    <span className="text-sm text-slate-500 animate-pulse">מנתח תקנים וזכויות...</span>
                                </div>
                            )}

                            {aiInsight && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" />
                                        תובנות מתכנן חכם
                                    </div>
                                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner whitespace-pre-line">
                                        {aiInsight}
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-700 dark:text-amber-300">המידע מבוסס על תקני המערכת ואינו מחליף בדיקת תב"ע.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeLayers.gov_planning && (
                    <>
                        {activeSubLayers.includes(1) && <GenericPolygonLayer label="יישובים" url="https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/compilation_hanhayot_sviva_tmm_tzafonn/MapServer/1/query?where=1%3D1&outFields=*&outSR=4326&f=geojson" style={{ color: "#06b6d4" }} />}
                        {activeSubLayers.includes(2) && <GenericPolygonLayer label="גבול התכנית" url="https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/compilation_hanhayot_sviva_tmm_tzafonn/MapServer/2/query?where=1%3D1&outFields=*&outSR=4326&f=geojson" style={{ color: "#e63946", weight: 2, fill: false }} />}
                    </>
                )}

                {activeLayers.zoning && <GeoJSON data={{ type: "FeatureCollection", features: [] }} style={{ color: '#10b981', weight: 1, fillColor: '#10b981', fillOpacity: 0.4 }} />}

                {activeLayers.schools && markers.map((m, idx) => <CircleMarker key={idx} center={[m.lat, m.lng]} radius={8} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 1 }}><Popup>{m.name}</Popup></CircleMarker>)}

                {activeLayers.brownfields && markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.lat, marker.lng]}
                        icon={createMarkerIcon(marker.risk)}
                    >
                        <Popup>
                            <div className="text-right font-sans p-2 min-w-[150px]" dir="rtl">
                                <h3 className="font-bold text-slate-900 border-b border-slate-100 mb-2 pb-1">{marker.name}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">{marker.details}</p>
                                <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] py-1.5 rounded font-bold transition">צפייה בתיק נכס</button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;