const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// All map endpoints using Geoapify
router.get('/health', mapController.mapHealth);
router.get('/routing', mapController.getRouting);
router.get('/geocode', mapController.getGeocoding);
router.get('/reverse-geocode', mapController.getReverseGeocoding);
router.get('/autocomplete', mapController.getAutocomplete);
router.get('/places', mapController.getPlaces);
router.get('/nearby-places', mapController.getNearbyPlaces);
router.get('/place-details', mapController.getPlaceDetails);
router.get('/isoline', mapController.getIsoline);
router.post('/route-matrix', mapController.getRouteMatrix);
router.get('/ipinfo', mapController.getIpInfo);

module.exports = router;
