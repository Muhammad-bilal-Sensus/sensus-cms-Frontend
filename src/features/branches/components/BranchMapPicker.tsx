import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useDebounce } from "@/hooks/useDebounce";
import "leaflet/dist/leaflet.css";

const KUWAIT = { lat: 29.3759, lng: 47.9774 };

const pinIcon = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#0f766e;border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>`,
});

type LatLng = { lat: number; lng: number };

type BranchMapPickerProps = {
  query: string;
  canGeocode: boolean;
  latitude: string;
  longitude: string;
  disabled?: boolean;
  onPick: (latitude: string, longitude: string) => void;
};

type PhotonResponse = {
  features?: { geometry?: { coordinates?: number[] } }[];
};

function readCoordinate(latitude: string, longitude: string): LatLng | null {
  const latText = latitude.trim();
  const lngText = longitude.trim();
  if (!latText || !lngText) return null;
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function formatCoordinate(value: number) {
  return String(Math.round(value * 1e6) / 1e6);
}

async function lookupAddress(query: string, signal: AbortSignal): Promise<LatLng | null> {
  const response = await fetch(
    `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" }, signal },
  );
  if (!response.ok) return null;
  const body = await response.json() as PhotonResponse;
  const pair = body.features?.[0]?.geometry?.coordinates;
  const lng = pair?.[0];
  const lat = pair?.[1];
  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export default function BranchMapPicker({
  query, canGeocode, latitude, longitude, disabled = false, onPick,
}: BranchMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const disabledRef = useRef(disabled);
  const coordinatesRef = useRef({ latitude, longitude });
  const initialQuery = useRef(query.trim());
  const requestId = useRef(0);
  const [ready, setReady] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 700);

  onPickRef.current = onPick;
  disabledRef.current = disabled;
  coordinatesRef.current = { latitude, longitude };

  function moveMarker(map: L.Map, position: LatLng) {
    if (!markerRef.current) {
      const marker = L.marker(position, { icon: pinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        if (disabledRef.current) return;
        const point = marker.getLatLng();
        requestId.current += 1;
        setLookingUp(false);
        onPickRef.current(formatCoordinate(point.lat), formatCoordinate(point.lng));
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(position);
    }
    map.setView(position, 16);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const host = container as HTMLElement & { _leaflet_id?: number };
    if (host._leaflet_id) {
      host.replaceChildren();
      delete host._leaflet_id;
    }
    const current = readCoordinate(coordinatesRef.current.latitude, coordinatesRef.current.longitude);
    const map = L.map(host, {
      center: current ?? KUWAIT,
      zoom: current ? 16 : 11,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (event) => {
      if (disabledRef.current) return;
      requestId.current += 1;
      setLookingUp(false);
      moveMarker(map, event.latlng);
      onPickRef.current(formatCoordinate(event.latlng.lat), formatCoordinate(event.latlng.lng));
    });
    mapRef.current = map;
    if (current) moveMarker(map, current);
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 150);
    setReady(true);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const position = readCoordinate(latitude, longitude);
    if (!ready || !map || !position) return;
    moveMarker(map, position);
  }, [latitude, longitude, ready]);

  useEffect(() => {
    const lookup = debouncedQuery.trim();
    if (!canGeocode || lookup.length < 5) return;
    const savedCoordinates = readCoordinate(coordinatesRef.current.latitude, coordinatesRef.current.longitude);
    if (lookup === initialQuery.current && savedCoordinates) return;

    const controller = new AbortController();
    const id = ++requestId.current;
    setLookingUp(true);
    setError(null);
    lookupAddress(lookup, controller.signal)
      .then((position) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        setLookingUp(false);
        if (!position) {
          setError("That address was not found on the map.");
          return;
        }
        onPickRef.current(formatCoordinate(position.lat), formatCoordinate(position.lng));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLookingUp(false);
        setError("Could not look up that address.");
      });

    return () => {
      controller.abort();
      requestId.current += 1;
      setLookingUp(false);
    };
  }, [canGeocode, debouncedQuery]);

  return (
    <div className="grid gap-1">
      <p className="text-xs text-slate-400">Latitude and longitude fill in from the address and city. You can also click the map to move the pin.</p>
      <div className={`relative z-0 h-56 overflow-hidden rounded-xl border border-slate-200 [&_img]:max-w-none ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        <div ref={containerRef} className="isolate h-full w-full" />
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-xs text-slate-500">Loading map</div>
        ) : null}
      </div>
      {lookingUp ? <p className="text-xs text-slate-400">Finding that address on the map.</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
