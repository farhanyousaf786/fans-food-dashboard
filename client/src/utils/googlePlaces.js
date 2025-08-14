// Google Places API utility functions
const GOOGLE_API_KEY = 'AIzaSyBt3QGbHpET_X0squlsIcC-2-5A4FTJ6QM';

// Load Google Places API script
export const loadGooglePlacesAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Places API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve(window.google);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkGoogle);
          resolve(window.google);
        }
      }, 100);
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve(window.google);
      } else {
        reject(new Error('Google Places API failed to load'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Places API script'));
    };
    
    document.head.appendChild(script);
  });
};

// Get place details including coordinates
export const getPlaceDetails = (placeId) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      reject(new Error('Google Places API not loaded'));
      return;
    }

    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    service.getDetails(
      {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry.location', 'place_id']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve({
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            placeId: place.place_id
          });
        } else {
          reject(new Error(`Places service failed: ${status}`));
        }
      }
    );
  });
};

// Search for places with autocomplete
export const searchPlaces = (query) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      reject(new Error('Google Places API not loaded'));
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    
    service.getPlacePredictions(
      {
        input: query,
        types: ['establishment', 'geocode']
        // No country restrictions - worldwide search including Israel
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(predictions || []);
        } else {
          reject(new Error(`Autocomplete service failed: ${status}`));
        }
      }
    );
  });
};
