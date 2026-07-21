const axios = require('axios');

// Get API Key from Environment
const API_KEY = process.env.GEOPIFY_ACCESS_TOKEN;
const BASE_URL = 'https://api.geoapify.com';

// 1. Routing API
exports.getRouting = async (req, res) => {
  try {
    const { waypoints, mode } = req.query; // waypoints e.g., "lat1,lon1|lat2,lon2"
    if (!waypoints) return res.status(400).json({ message: 'Waypoints are required' });
    
    const response = await axios.get(`${BASE_URL}/v1/routing`, {
      params: {
        waypoints,
        mode: mode || 'drive',
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Routing API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching routing data' });
  }
};

// 2. Geocoding API
exports.getGeocoding = async (req, res) => {
  try {
    const { text } = req.query; // e.g., address string
    if (!text) return res.status(400).json({ message: 'Search text is required' });

    const response = await axios.get(`${BASE_URL}/v1/geocode/search`, {
      params: {
        text,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Geocoding API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching geocoding data' });
  }
};

// 3. Reverse Geocoding API
exports.getReverseGeocoding = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: 'Latitude and longitude are required' });

    const response = await axios.get(`${BASE_URL}/v1/geocode/reverse`, {
      params: {
        lat,
        lon,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Reverse Geocoding API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching reverse geocoding data' });
  }
};

// 4. Autocomplete API
exports.getAutocomplete = async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) return res.status(400).json({ message: 'Search text is required' });

    const response = await axios.get(`${BASE_URL}/v1/geocode/autocomplete`, {
      params: {
        text,
        apiKey: API_KEY
      }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Autocomplete API:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Error fetching autocomplete data' });
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
