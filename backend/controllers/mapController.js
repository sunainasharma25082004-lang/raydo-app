const axios = require('axios');

// Strip accidental quotes from .env values
function envKey(name) {
  const v = process.env[name];
  if (!v) return null;
  return String(v).trim().replace(/^["']|["']$/g, '');
}

const API_KEY = envKey('GEOPIFY_ACCESS_TOKEN');
const BASE_URL = 'https://api.geoapify.com';

function ensureKey(res) {
  if (!API_KEY || API_KEY.includes('your_') || API_KEY.length < 10) {
    res.status(500).json({
      message: 'Geoapify API key missing. Set GEOPIFY_ACCESS_TOKEN in backend/.env',
      configured: false,
    });
    return false;
  }
  return true;
}

/** Health check — is live map API working? */
exports.mapHealth = async (req, res) => {
  if (!ensureKey(res)) return;
  try {
    const response = await axios.get(`${BASE_URL}/v1/geocode/reverse`, {
      params: { lat: 12.9716, lon: 77.5946, apiKey: API_KEY },
      timeout: 8000,
    });
    const place = response.data?.features?.[0]?.properties?.formatted || null;
    res.json({
      ok: true,
      provider: 'geoapify',
      configured: true,
      sample: place,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      configured: true,
      message: 'Geoapify request failed',
      detail: error?.response?.data || error.message,
    });
  }
};

// 1. Routing API
exports.getRouting = async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { waypoints, mode } = req.query; // waypoints e.g., "lat1,lon1|lat2,lon2"
    if (!waypoints) return res.status(400).json({ message: 'Waypoints are required' });

    const response = await axios.get(`${BASE_URL}/v1/routing`, {
      params: {
        waypoints,
        mode: mode || 'drive',
        apiKey: API_KEY,
      },
      timeout: 12000,
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Routing API:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Error fetching routing data',
      detail: error?.response?.data || error.message,
    });
  }
};

// 2. Geocoding API
exports.getGeocoding = async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { text, bias } = req.query; // e.g., address string; bias=proximity:lng,lat
    if (!text) return res.status(400).json({ message: 'Search text is required' });

    const params = {
      text,
      apiKey: API_KEY,
      limit: 8,
      filter: 'countrycode:in',
    };
    if (bias) params.bias = bias;

    const response = await axios.get(`${BASE_URL}/v1/geocode/search`, {
      params,
      timeout: 10000,
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Geocoding API:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Error fetching geocoding data',
      detail: error?.response?.data || error.message,
    });
  }
};

// 3. Reverse Geocoding API
exports.getReverseGeocoding = async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { lat, lon, lng } = req.query;
    const longitude = lon || lng;
    if (!lat || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const response = await axios.get(`${BASE_URL}/v1/geocode/reverse`, {
      params: {
        lat,
        lon: longitude,
        apiKey: API_KEY,
      },
      timeout: 10000,
    });

    // Convenience fields for mobile apps
    const props = response.data?.features?.[0]?.properties || {};
    res.status(200).json({
      ...response.data,
      formatted: props.formatted || props.address_line1 || null,
      lat: Number(lat),
      lng: Number(longitude),
    });
  } catch (error) {
    console.error('Error in Reverse Geocoding API:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Error fetching reverse geocoding data',
      detail: error?.response?.data || error.message,
    });
  }
};

// 4. Autocomplete API
exports.getAutocomplete = async (req, res) => {
  try {
    if (!ensureKey(res)) return;
    const { text, bias } = req.query;
    if (!text) return res.status(400).json({ message: 'Search text is required' });

    const params = {
      text,
      apiKey: API_KEY,
      limit: 8,
      filter: 'countrycode:in',
    };
    if (bias) params.bias = bias;

    const response = await axios.get(`${BASE_URL}/v1/geocode/autocomplete`, {
      params,
      timeout: 10000,
    });

    // Flatten for easy mobile consumption
    const suggestions = (response.data?.features || []).map((f) => ({
      id: f.properties?.place_id || f.properties?.osm_id || String(Math.random()),
      label: f.properties?.formatted || f.properties?.address_line1 || text,
      name: f.properties?.name || f.properties?.address_line1 || '',
      city: f.properties?.city || f.properties?.county || '',
      lat: f.properties?.lat ?? f.geometry?.coordinates?.[1],
      lng: f.properties?.lon ?? f.geometry?.coordinates?.[0],
    }));

    res.status(200).json({ ...response.data, suggestions });
  } catch (error) {
    console.error('Error in Autocomplete API:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Error fetching autocomplete data',
      detail: error?.response?.data || error.message,
    });
  }
};

// 5. Places API
exports.getPlaces = async (req, res) => {
  try {
    const { categories, filter, limit } = req.query; // e.g., categories=commercial.supermarket, filter=rect:...
    if (!categories || !filter) return res.status(400).json({ message: 'Categories and filter are required' });

    const response = await axios.get(`${BASE_URL}/v2/places`, {
      params: {
        categories,
        filter,
        limit: limit || 20,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Places API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching places data' });
  }
};

// 6. Places Details API
exports.getPlaceDetails = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Place ID is required' });

    const response = await axios.get(`${BASE_URL}/v2/place-details`, {
      params: {
        id,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Places Details API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching place details' });
  }
};

// 7. Isoline API
exports.getIsoline = async (req, res) => {
  try {
    const { lat, lon, type, mode, range } = req.query; // type=time, mode=drive, range=900
    if (!lat || !lon || !type || !mode || !range) {
      return res.status(400).json({ message: 'Missing required parameters: lat, lon, type, mode, or range' });
    }

    const response = await axios.get(`${BASE_URL}/v1/isoline`, {
      params: {
        lat,
        lon,
        type,
        mode,
        range,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Isoline API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching isoline data' });
  }
};

// 8. Route Matrix API
exports.getRouteMatrix = async (req, res) => {
  try {
    const body = req.body; // Expecting { mode, sources: [], targets: [] }
    if (!body.mode || !body.sources || !body.targets) {
      return res.status(400).json({ message: 'mode, sources, and targets are required in the request body' });
    }

    const response = await axios.post(`${BASE_URL}/v1/routematrix?apiKey=${API_KEY}`, body);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Route Matrix API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching route matrix data' });
  }
};

// 9. IP Geolocation API
exports.getIpInfo = async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/v1/ipinfo`, {
      params: {
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in IP Geolocation API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching IP geolocation data' });
  }
};
