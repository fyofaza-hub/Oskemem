import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Bits";

export interface MapMarker {
  id: string;
  name: string;
  coords: [number, number];
  category?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  route?: [number, number][];
  routeStops?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  fitToMarkers?: boolean;
  showLocate?: boolean;
  interactive?: boolean;
  onReady?: (map: L.Map) => void;
  onMapClick?: (coords: [number, number]) => void;
  pickMarker?: { coords: [number, number]; label?: string } | null;
}

const CITY_CENTER: [number, number] = [49.9481, 82.6286];

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const markerIcon = (
  index: number | null,
  active: boolean,
  name: string,
  options: { category?: string; position: "single" | "first" | "middle" | "last" } = { position: "single" },
) => {
  if (index !== null) {
    const extra =
      options.position === "first" ? " is-start" : options.position === "last" ? " is-end" : "";
    return {
      html: `<div class="oc-stop${extra}${active ? " is-active" : ""}">${index + 1}</div>`,
      size: [30, 30] as [number, number],
      anchor: [15, 15] as [number, number],
    };
  }
  const pinColor = options.category ? categoryColor(options.category) : null;
  const style = pinColor ? ` style="--pin-accent: ${pinColor}"` : "";
  return {
    html: `<div class="oc-pin${active ? " is-active" : ""}" title="${escapeHtml(name)}"${style}></div>`,
    size: [20, 20] as [number, number],
    anchor: [10, 10] as [number, number],
  };
};

/** Цвет маркера по категории города — приглушённые, но различимые оттенки. */
const categoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    food: "#F59E0B",
    nature: "#10B981",
    leisure: "#0EA5E9",
    culture: "#8B5CF6",
    entertainment: "#EC4899",
    sport: "#14B8A6",
    landmark: "#64748B",
  };
  return category ? colors[category] ?? null : null;
};

const keyOf = (items?: MapMarker[]) =>
  items?.map((m) => `${m.id}@${m.name}@${m.coords[0]},${m.coords[1]}@${m.category ?? ""}`).join(";") ?? "";

/**
 * Карта Leaflet с маркерами, маршрутом и выбором точки.
 * Слои пересоздаются только при изменении данных, а не при каждом рендере.
 */
export function MapView({
  markers,
  activeId,
  onMarkerClick,
  route,
  routeStops,
  center = CITY_CENTER,
  zoom = 13,
  className,
  fitToMarkers = true,
  showLocate = true,
  interactive = true,
  onReady,
  onMapClick,
  pickMarker,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const pickLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef(markers);
  const routeStopsRef = useRef(routeStops);
  const routeRef = useRef(route);
  const pickRef = useRef(pickMarker);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMapClickRef = useRef(onMapClick);
  const onReadyRef = useRef(onReady);
  const [error, setError] = useState(false);
  const [locating, setLocating] = useState(false);

  const markerKey = keyOf(markers);
  const routeStopKey = keyOf(routeStops);
  const routeKey = route?.map((point) => `${point[0]},${point[1]}`).join(";") ?? "";
  const pickKey = pickMarker ? `${pickMarker.coords[0]},${pickMarker.coords[1]},${pickMarker.label ?? ""}` : "";

  useEffect(() => {
    markersRef.current = markers;
    routeStopsRef.current = routeStops;
    routeRef.current = route;
    pickRef.current = pickMarker;
    onMarkerClickRef.current = onMarkerClick;
    onMapClickRef.current = onMapClick;
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    try {
      const map = L.map(container, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: true,
        // Один мир вместо бесконечных копий: карта ограничена Өскеменом и окрестностями.
        minZoom: 11,
        maxBounds: L.latLngBounds([49.6, 82.2], [50.25, 83.1]),
        maxBoundsViscosity: 0.9,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        touchZoom: interactive,
      });
      mapRef.current = map;
      // Стандартные тайлы OpenStreetMap: maps.wikimedia.org больше не разрешает
      // подключение со сторонних сайтов (403), из-за чего подложка не грузилась.
      // Стабильность на любом устройстве: если основной провайдер недоступен
      // (блокировка сети, лимиты, 403) — тайлы автоматически переключаются
      // на запасной провайдер CARTO, который отдаёт те же данные OSM.
      const baseAttribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
      const fallbackAttribution = `${baseAttribution} · &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>`;
      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: baseAttribution,
        maxZoom: 18,
        noWrap: true,
        bounds: L.latLngBounds([49.6, 82.2], [50.25, 83.1]),
      }).addTo(map);
      let loadedTiles = 0;
      let errorTiles = 0;
      let fallbackActive = false;
      tileLayer.on("tileload", () => {
        loadedTiles += 1;
      });
      tileLayer.on("tileerror", () => {
        errorTiles += 1;
        // Подложка даже один раз не загрузилась — маршрут данных умер целиком.
        if (!fallbackActive && loadedTiles === 0 && errorTiles >= 5) {
          fallbackActive = true;
          tileLayer.setUrl("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", true);
          map.attributionControl.removeAttribution(baseAttribution);
          map.attributionControl.addAttribution(fallbackAttribution);
        }
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);

      routeLayerRef.current = L.layerGroup().addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      pickLayerRef.current = L.layerGroup().addTo(map);
      onReadyRef.current?.(map);

      map.on("click", (event: L.LeafletMouseEvent) => {
        onMapClickRef.current?.([event.latlng.lat, event.latlng.lng]);
      });

      const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
      observer.observe(container);
      const timeout = window.setTimeout(() => map.invalidateSize({ animate: false }), 250);

      return () => {
        window.clearTimeout(timeout);
        observer.disconnect();
        map.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
        routeLayerRef.current = null;
        pickLayerRef.current = null;
        markerRefs.current = {};
      };
    } catch {
      setError(true);
    }
    // Карта создаётся один раз; последующие изменения обрабатываются эффектами ниже.
  }, []);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markerRefs.current = {};

    const stops = routeStopsRef.current;
    const isRouteMode = Boolean(stops && stops.length);
    const items = isRouteMode ? (stops as MapMarker[]) : markersRef.current;

    items.forEach((marker, index) => {
      const position =
        !isRouteMode || items.length < 2 || index === 0
          ? "single"
          : index === items.length - 1
            ? "last"
            : "middle";
      const icon = markerIcon(isRouteMode ? index : null, activeId === marker.id, marker.name, {
        category: marker.category,
        position: isRouteMode && index === 0 && items.length >= 2 ? "first" : position,
      });
      const instance = L.marker(marker.coords, {
        icon: L.divIcon({
          className: "",
          html: icon.html,
          iconSize: icon.size,
          iconAnchor: icon.anchor,
        }),
        zIndexOffset: activeId === marker.id ? 1000 : isRouteMode ? 500 : 0,
      })
        .addTo(layer)
        .bindTooltip(escapeHtml(marker.name), {
          direction: "top",
          offset: [0, -icon.anchor[1] - 2],
          className: "map-tooltip",
        });
      instance.on("click", () => onMarkerClickRef.current?.(marker.id));
      markerRefs.current[marker.id] = instance;
    });
    // markerKey и routeStopKey описывают содержимое списков, поэтому эффект не зависит от ссылок.
  }, [markerKey, routeStopKey, activeId]);

  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const points = routeRef.current;
    if (points && points.length > 1) {
      const dark = document.documentElement.dataset.theme === "dark";
      // Тёмная тема: линия читается светлым графитом; светлая — чернильно-синий.
      L.polyline(points, {
        color: dark ? "#050810" : "#0F172A",
        weight: 6,
        opacity: 0.2,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
      L.polyline(points, {
        color: dark ? "#FF8C61" : "#FF6B35",
        weight: 3,
        opacity: 0.95,
        dashArray: "2 8",
        lineCap: "round",
        lineJoin: "round",
        className: "route-dots",
      }).addTo(layer);
    }
  }, [routeKey]);

  useEffect(() => {
    const layer = pickLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const pick = pickRef.current;
    if (!pick) return;
    L.marker(pick.coords, {
      icon: L.divIcon({
        className: "",
        html: '<div class="oc-pick"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
      zIndexOffset: 1200,
    })
      .addTo(layer)
      .bindTooltip(escapeHtml(pick.label ?? tr("Ваше место")), {
        direction: "top",
        offset: [0, -18],
        className: "map-tooltip",
      });
  }, [pickKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitToMarkers) return;
    const stops = routeStopsRef.current;
    const items = stops?.length ? stops : markersRef.current;
    const points = items.map((marker) => marker.coords);
    if (!points.length) return;
    if (points.length === 1) {
      map.flyTo(points[0], Math.max(14, zoom), { duration: 0.6 });
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15, animate: true, duration: 0.6 });
    // Подгонка области нужна только при смене набора точек, а не при выборе маркера.
  }, [markerKey, routeStopKey, fitToMarkers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeId) return;
    const map = mapRef.current;
    const marker = markerRefs.current[activeId];
    if (map && marker) {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.5 });
    }
  }, [activeId]);

  const locate = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(coords);
        } else {
          userMarkerRef.current = L.marker(coords, {
            icon: L.divIcon({
              className: "",
              html: '<div class="oc-you"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
          })
            .addTo(map)
            .bindTooltip(tr("Вы здесь"), { className: "map-tooltip" });
        }
        map.flyTo(coords, 14, { duration: 0.6 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (error) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl border border-line bg-surface p-4", className)}>
        <EmptyState
          tone="danger"
          icon="warning"
          title={tr("Карта недоступна")}
          description={tr("Не удалось загрузить карту. Проверьте соединение и обновите страницу — остальные разделы продолжают работать.")}
          className="border-0 bg-transparent py-6"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-sunken", className)}>
      <div ref={containerRef} className="absolute inset-0 z-0" role="region" aria-label={tr("Интерактивная карта")} />
      {showLocate ? (
        <IconButton
          icon="crosshair"
          label={tr("Показать моё местоположение")}
          variant="media"
          onClick={locate}
          disabled={locating}
          className="absolute right-3 top-3 z-[65]"
        />
      ) : null}
    </div>
  );
}
