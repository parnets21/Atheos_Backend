const axios = require("axios")

class LocationProcessor {
  constructor(apiKey = "AIzaSyBL-9biM7jqKbWS4JOeaTCThDrNCtNQFh8") {
    this.apiKey = apiKey
  }

  // Process location data and fill null addresses
  async processLocationData(locationData) {
    if (!locationData) return null

    // If address is already present, return as is
    if (locationData.address && locationData.address !== null) {
      return locationData
    }

    // If we have coordinates but no address, perform reverse geocoding
    if (locationData.latitude && locationData.longitude) {
      try {
        const address = await this.reverseGeocode(locationData.latitude, locationData.longitude)
        return {
          ...locationData,
          address: address,
        }
      } catch (error) {
        console.error("Failed to process location:", error)
        return {
          ...locationData,
          address: `${locationData.latitude}, ${locationData.longitude}`,
        }
      }
    }

    return locationData
  }

  // Batch process multiple location objects
  async processLocationBatch(locationArray) {
    if (!Array.isArray(locationArray)) return []

    const processedLocations = await Promise.all(
      locationArray.map(async (item) => {
        if (item.location) {
          const processedLocation = await this.processLocationData(item.location)
          return {
            ...item,
            location: processedLocation,
          }
        }
        return item
      }),
    )

    return processedLocations
  }

  async reverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey,
        },
      })

      if (response.data.status === "OK" && response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address
      } else {
        return `${latitude}, ${longitude}`
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error.message)
      return `${latitude}, ${longitude}`
    }
  }
}

module.exports = LocationProcessor
