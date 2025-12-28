const { Client } = require('@googlemaps/google-maps-services-js');

const googleMapsClient = new Client({});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  Google Maps API key not found. Location features will be disabled.');
}

module.exports = {
    googleMapsClient,
    GOOGLE_MAPS_API_KEY
};
