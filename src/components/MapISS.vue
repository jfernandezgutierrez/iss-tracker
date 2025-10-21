<template>
  <div id="map">
    <button
      id="centerISS"
      class="map-btn"
      @click="centerOnISS"
      title="Centrar en la ISS"
    >
      📡
    </button>
    <button
      id="centerMe"
      class="map-btn"
      @click="centerOnMe"
      title="Centrar en mi ubicación"
    >
      📍
    </button>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue';
  import L from 'leaflet';
  import * as SunCalc from 'suncalc';
  import 'leaflet/dist/leaflet.css';
  import * as satellite from 'satellite.js';

  const map = ref(null);
  const issMarker = ref(null);
  const youMarker = ref(null);
  const pathCoords = ref([]);
  let pathLine = null;
  let movingLine = null;
  let nightLayer = null;
  let lastPos = null;
  let orbitLine = null;

  // 🛰️ Iconos
  const issIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });
  const youIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // === CARGA SATELLITE.JS DINÁMICA ===
  async function loadSatelliteJS() {
    if (window.satellite) return; // ya está cargado

    const urls = ['https://unpkg.com/satellite.js@5.0.2/dist/satellite.min.js', 'https://cdn.jsdelivr.net/npm/satellite.js@5.0.2/dist/satellite.min.js'];

    for (const src of urls) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => {
            console.log('✅ satellite.js cargado desde', src);
            resolve();
          };
          script.onerror = () => reject(new Error('❌ Error cargando satellite.js desde ' + src));
          document.head.appendChild(script);
        });
        if (window.satellite) return;
      } catch (err) {
        console.warn(err.message);
      }
    }

    // Si ninguno funciona, mostramos error en consola
    if (!window.satellite) {
      console.error('🚨 No se pudo cargar satellite.js desde ningún CDN disponible');
    }
  }

  // === MAPA PRINCIPAL ===
  onMounted(async () => {
    map.value = L.map('map', {
      worldCopyJump: true,
      zoomSnap: 0.5,
      minZoom: 2,
      maxZoom: 7
    }).setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 7,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.value);

    issMarker.value = L.marker([0, 0], { icon: issIcon }).addTo(map.value);
    pathLine = L.polyline([], { color: 'cyan', weight: 2 }).addTo(map.value);
    movingLine = L.polyline([], { color: '#00ffee', weight: 3, opacity: 0.6 }).addTo(map.value);

    drawDayNight();
    setInterval(drawDayNight, 60000);

    updateISS();
    setInterval(updateISS, 5000);

    getUserLocation();

    // 🛰️ Cargar satellite.js y trazar órbita
    await loadSatelliteJS();
    await drawOrbit();
  });

  // === ACTUALIZAR ISS ===
  async function updateISS() {
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const data = await res.json();
      const { latitude, longitude } = data;

      issMarker.value.setLatLng([latitude, longitude]);
      pathCoords.value.push([latitude, longitude]);
      if (pathCoords.value.length > 300) pathCoords.value.shift();
      pathLine.setLatLngs(pathCoords.value);

      // Trazo animado breve
      if (lastPos) {
        movingLine.setLatLngs([lastPos, [latitude, longitude]]);
        setTimeout(() => movingLine.setLatLngs([]), 1800);
      }
      lastPos = [latitude, longitude];

      if (!map.value._centeredOnce) {
        map.value.setView([latitude, longitude], 4);
        map.value._centeredOnce = true;
      }
    } catch {
      console.warn('⚠️ Error obteniendo datos ISS');
    }
  }

  // === DIBUJAR DÍA / NOCHE ===
  function drawDayNight() {
    const now = new Date();
    const sunPos = SunCalc.getPosition(now, 0, 0);
    const sunLng = (sunPos.azimuth * 180) / Math.PI + 180;
    const sunLat = (sunPos.altitude * 180) / Math.PI;
    const points = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      const lat = -Math.tan(sunPos.altitude) * Math.cos(((lon - sunLng) * Math.PI) / 180) * 90;
      points.push([lat, lon]);
    }
    if (nightLayer) nightLayer.remove();
    nightLayer = L.polygon([...points, [90, 180], [90, -180]], {
      color: 'none',
      fillColor: 'rgba(0,0,40,0.6)',
      fillOpacity: 0.6
    }).addTo(map.value);
  }

  // === DIBUJAR ÓRBITA REAL O ESTIMADA ===
  async function drawOrbit() {
    try {
      await loadSatelliteJS();

      // Obtener TLE desde el feed JSON (no bloqueado)
      const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json');
      if (!res.ok) throw new Error('Error al obtener TLE: ' + res.status);
      const data = await res.json();
      const iss = data.find((d) => d.OBJECT_NAME.includes('ISS'));
      if (!iss) throw new Error('No se encontró la ISS');

      const line1 = iss.TLE_LINE1;
      const line2 = iss.TLE_LINE2;
      const satrec = satellite.twoline2satrec(line1, line2);

      const now = new Date();
      const orbitPoints = [];

      for (let i = 0; i <= 90; i++) {
        const time = new Date(now.getTime() + i * 60000);
        const pv = satellite.propagate(satrec, time);
        if (!pv.position) continue;
        const gmst = satellite.gstime(time);
        const gd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(gd.latitude);
        const lon = satellite.degreesLong(gd.longitude);
        if (!isNaN(lat) && !isNaN(lon)) orbitPoints.push([lat, lon]);
      }

      // Dibuja órbita azul discontinua
      L.polyline(orbitPoints, {
        color: '#00ffee',
        weight: 2,
        opacity: 0.8,
        dashArray: '6,6'
      }).addTo(map.value);

      console.log('✅ Órbita trazada correctamente con', orbitPoints.length, 'puntos');
    } catch (err) {
      console.error('❌ Error al trazar la órbita:', err);
    }
  }

  // === GEOLOCALIZACIÓN USUARIO ===
  function getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!youMarker.value) {
          youMarker.value = L.marker([latitude, longitude], {
            icon: youIcon,
            title: 'Tu ubicación'
          }).addTo(map.value);
        } else {
          youMarker.value.setLatLng([latitude, longitude]);
        }
      },
      (err) => console.warn('⚠️ Error geolocalización:', err.message),
      { enableHighAccuracy: true }
    );
  }

  // === BOTONES ===
  function centerOnISS() {
    if (!issMarker.value) return;
    const { lat, lng } = issMarker.value.getLatLng();
    map.value.setView([lat, lng], 4, { animate: true });
  }
  function centerOnMe() {
    if (!youMarker.value) {
      getUserLocation();
      return;
    }
    const { lat, lng } = youMarker.value.getLatLng();
    map.value.setView([lat, lng], 6, { animate: true });
  }
</script>

<style scoped>
  #map {
    width: 100%;
    height: calc(100vh - 80px);
    margin-top: 80px;
    background: #000814;
    z-index: 1;
  }

  /* 🔘 Botones flotantes */
  .map-btn {
    position: absolute;
    z-index: 1000;
    right: 15px;
    background: rgba(0, 255, 255, 0.15);
    border: 1px solid #00ffee88;
    color: #00ffff;
    font-size: 24px;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 0 10px #00ffee55;
  }
  .map-btn:hover {
    background: rgba(0, 255, 255, 0.35);
    box-shadow: 0 0 15px #00ffee;
  }
  #centerISS {
    bottom: 80px;
  }
  #centerMe {
    bottom: 20px;
  }
</style>
