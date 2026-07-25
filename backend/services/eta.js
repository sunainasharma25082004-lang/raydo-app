const axios = require('axios');
const driverStore = require('../store/driverStore');

function envKey(name) {
  const v = process.env[name];
  if (!v) return null;
  return String(v).trim().replace(/^["']|["']$/g, '');
}

/**
 * Estimate minutes for driver to reach rider pickup.
 * Prefers Geoapify road routing; falls back to haversine + city speed.
 */
async function estimatePickupEtaMinutes({
  fromLat,
  fromLng,
  toLat,
  toLng,
  vehicleType,
}) {
  const aLat = Number(fromLat);
  const aLng = Number(fromLng);
  const bLat = Number(toLat);
  const bLng = Number(toLng);

  if (
    !Number.isFinite(aLat) ||
    !Number.isFinite(aLng) ||
    !Number.isFinite(bLat) ||
    !Number.isFinite(bLng)
  ) {
    return { etaMinutes: null, distanceKm: null, source: 'none' };
  }

  const distanceKm =
    Math.round(driverStore.haversineKm(aLat, aLng, bLat, bLng) * 100) / 100;

  // Try live road ETA
  const apiKey = envKey('GEOPIFY_ACCESS_TOKEN');
  if (apiKey && !apiKey.includes('your_')) {
    try {
      const mode =
        vehicleType === 'Bike' || vehicleType === 'Scooty' ? 'scooter' : 'drive';
      const waypoints = `${aLat},${aLng}|${bLat},${bLng}`;
      const response = await axios.get('https://api.geoapify.com/v1/routing', {
        params: { waypoints, mode, apiKey },
        timeout: 8000,
      });
      const feature = response.data?.features?.[0];
      const timeSec = feature?.properties?.time;
      const distM = feature?.properties?.distance;
      if (timeSec != null && Number.isFinite(Number(timeSec))) {
        const etaMinutes = Math.max(1, Math.ceil(Number(timeSec) / 60));
        const roadKm =
          distM != null
            ? Math.round((Number(distM) / 1000) * 100) / 100
            : distanceKm;
        return { etaMinutes, distanceKm: roadKm, source: 'geoapify' };
      }
    } catch (err) {
      console.warn('[ETA] Geoapify routing failed:', err.message);
    }
  }

  // Fallback: city average speeds (km/h)
  const speed = { Scooty: 22, Bike: 24, Auto: 18, Car: 20 }[vehicleType] || 20;
  const etaMinutes = Math.max(1, Math.ceil((distanceKm / speed) * 60));
  return { etaMinutes, distanceKm, source: 'haversine' };
}

module.exports = { estimatePickupEtaMinutes };
