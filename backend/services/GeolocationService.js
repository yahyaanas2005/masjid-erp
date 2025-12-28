const { googleMapsClient, GOOGLE_MAPS_API_KEY } = require('../config/googleMaps');
const { getDistance } = require('geolib');

class GeolocationService {
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {Object} point1 - {latitude, longitude}
     * @param {Object} point2 - {latitude, longitude}
     * @returns {number} Distance in meters
     */
    calculateDistance(point1, point2) {
        return getDistance(
            { latitude: point1.latitude, longitude: point1.longitude },
            { latitude: point2.latitude, longitude: point2.longitude }
        );
    }

    /**
     * Verify if user is within masjid's geo-fence radius
     * @param {Object} userLocation - {latitude, longitude}
     * @param {Object} masjidLocation - {latitude, longitude}
     * @param {number} radius - Verification radius in meters
     * @returns {Object} {isWithinRadius: boolean, distance: number}
     */
    verifyUserInMasjidRadius(userLocation, masjidLocation, radius = 500) {
        const distance = this.calculateDistance(userLocation, masjidLocation);
        return {
            isWithinRadius: distance <= radius,
            distance: Math.round(distance)
        };
    }

    /**
     * Find nearby masajid using Google Places API
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} radiusKm - Search radius in kilometers
     * @returns {Promise<Array>} Array of nearby mosques
     */
    async findNearbyMasajid(latitude, longitude, radiusKm = 10) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }

        try {
            const response = await googleMapsClient.placesNearby({
                params: {
                    location: { lat: latitude, lng: longitude },
                    radius: radiusKm * 1000, // Convert to meters
                    type: 'mosque',
                    key: GOOGLE_MAPS_API_KEY
                }
            });

            return response.data.results.map(place => ({
                googlePlaceId: place.place_id,
                name: place.name,
                address: place.vicinity,
                location: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng
                },
                rating: place.rating,
                isOpen: place.opening_hours?.open_now
            }));
        } catch (error) {
            console.error('Error finding nearby masajid:', error);
            throw error;
        }
    }

    /**
     * Get detailed place information from Google Places
     * @param {string} placeId - Google Place ID
     * @returns {Promise<Object>} Place details
     */
    async getPlaceDetails(placeId) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }

        try {
            const response = await googleMapsClient.placeDetails({
                params: {
                    place_id: placeId,
                    key: GOOGLE_MAPS_API_KEY
                }
            });

            const place = response.data.result;
            return {
                name: place.name,
                address: place.formatted_address,
                phone: place.formatted_phone_number,
                website: place.website,
                location: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng
                },
                photos: place.photos?.map(photo => photo.photo_reference) || []
            };
        } catch (error) {
            console.error('Error getting place details:', error);
            throw error;
        }
    }

    /**
     * Geocode an address to get coordinates
     * @param {string} address
     * @returns {Promise<Object>} {latitude, longitude, formattedAddress}
     */
    async geocodeAddress(address) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }

        try {
            const response = await googleMapsClient.geocode({
                params: {
                    address: address,
                    key: GOOGLE_MAPS_API_KEY
                }
            });

            if (response.data.results.length === 0) {
                throw new Error('Address not found');
            }

            const result = response.data.results[0];
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                formattedAddress: result.formatted_address
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            throw error;
        }
    }

    /**
     * Reverse geocode coordinates to get address
     * @param {number} latitude
     * @param {number} longitude
     * @returns {Promise<string>} Formatted address
     */
    async reverseGeocode(latitude, longitude) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }

        try {
            const response = await googleMapsClient.reverseGeocode({
                params: {
                    latlng: { lat: latitude, lng: longitude },
                    key: GOOGLE_MAPS_API_KEY
                }
            });

            if (response.data.results.length === 0) {
                throw new Error('Location not found');
            }

            return response.data.results[0].formatted_address;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            throw error;
        }
    }

    /**
     * Calculate travel distance and time between two locations
     * @param {Object} origin - {latitude, longitude}
     * @param {Object} destination - {latitude, longitude}
     * @returns {Promise<Object>} {distance: string, duration: string}
     */
    async calculateTravelInfo(origin, destination) {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API key not configured');
        }

        try {
            const response = await googleMapsClient.distancematrix({
                params: {
                    origins: [`${origin.latitude},${origin.longitude}`],
                    destinations: [`${destination.latitude},${destination.longitude}`],
                    mode: 'walking', // Most appropriate for masjid visits
                    key: GOOGLE_MAPS_API_KEY
                }
            });

            const element = response.data.rows[0].elements[0];

            if (element.status !== 'OK') {
                throw new Error('Unable to calculate travel info');
            }

            return {
                distance: element.distance.text,
                distanceMeters: element.distance.value,
                duration: element.duration.text,
                durationSeconds: element.duration.value
            };
        } catch (error) {
            console.error('Error calculating travel info:', error);
            throw error;
        }
    }

    /**
     * Verify neighborhood proximity for Tier 1 verification
     * Two users must be within 2km to vouch for each other
     * @param {Object} userLocation - {latitude, longitude}
     * @param {Object} voucherLocation - {latitude, longitude}
     * @returns {Object} {isNeighbor: boolean, distance: number}
     */
    verifyNeighborhoodProximity(userLocation, voucherLocation) {
        const distance = this.calculateDistance(userLocation, voucherLocation);
        const maxNeighborhoodDistance = 2000; // 2km in meters

        return {
            isNeighbor: distance <= maxNeighborhoodDistance,
            distance: Math.round(distance)
        };
    }

    /**
     * Generate community heatmap data (anonymized)
     * Clusters user locations by neighborhood for privacy
     * @param {Array} userLocations - Array of {latitude, longitude}
     * @returns {Array} Heatmap points with intensity
     */
    generateCommunityHeatmap(userLocations) {
        // Simple clustering algorithm - group locations within 500m
        const clusters = [];
        const clusterRadius = 500; // meters

        userLocations.forEach(location => {
            let addedToCluster = false;

            for (let cluster of clusters) {
                const distance = this.calculateDistance(location, cluster.center);
                if (distance <= clusterRadius) {
                    // Add to existing cluster
                    cluster.count++;
                    // Update cluster center (weighted average)
                    cluster.center.latitude =
                        (cluster.center.latitude * (cluster.count - 1) + location.latitude) / cluster.count;
                    cluster.center.longitude =
                        (cluster.center.longitude * (cluster.count - 1) + location.longitude) / cluster.count;
                    addedToCluster = true;
                    break;
                }
            }

            if (!addedToCluster) {
                // Create new cluster
                clusters.push({
                    center: { ...location },
                    count: 1
                });
            }
        });

        // Convert clusters to heatmap format
        return clusters.map(cluster => ({
            latitude: cluster.center.latitude,
            longitude: cluster.center.longitude,
            intensity: cluster.count
        }));
    }
}

module.exports = new GeolocationService();
