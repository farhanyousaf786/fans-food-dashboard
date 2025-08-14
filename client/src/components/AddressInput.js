import React, { useState, useEffect, useRef } from 'react';
import { TextField, List, ListItem, ListItemText, Paper, CircularProgress } from '@mui/material';
import { loadGooglePlacesAPI, searchPlaces, getPlaceDetails } from '../utils/googlePlaces';
import './AddressInput.css';

const AddressInput = ({ 
  label = "Location", 
  value = "", 
  onChange, 
  onLocationSelect,
  placeholder = "Enter stadium location...",
  error = false,
  helperText = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load Google Places API on component mount
  useEffect(() => {
    const initializeAPI = async () => {
      try {
        await loadGooglePlacesAPI();
        setApiLoaded(true);
        console.log('✅ Google Places API loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load Google Places API:', error);
      }
    };

    initializeAPI();
  }, []);

  // Handle input change with debounced search
  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    onChange(inputValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search for very short queries
    if (inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      if (apiLoaded) {
        await searchForPlaces(inputValue);
      }
    }, 300);
  };

  // Search for places using Google Places API
  const searchForPlaces = async (query) => {
    try {
      setLoading(true);
      const predictions = await searchPlaces(query);
      setSuggestions(predictions);
      setShowSuggestions(true);
      console.log(`🔍 Found ${predictions.length} suggestions for "${query}"`);
    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    try {
      setLoading(true);
      setShowSuggestions(false);
      
      // Update input value immediately
      onChange(suggestion.description);
      
      // Get detailed place information including coordinates
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      
      console.log('📍 Selected place details:', placeDetails);
      
      // Call the callback with location details
      if (onLocationSelect) {
        onLocationSelect({
          address: placeDetails.address,
          latitude: placeDetails.latitude,
          longitude: placeDetails.longitude,
          placeId: placeDetails.placeId,
          name: placeDetails.name
        });
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input blur to hide suggestions
  const handleBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle input focus to show suggestions if available
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="address-input-container">
      <TextField
        ref={inputRef}
        label={label}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        fullWidth
        margin="dense"
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: loading && <CircularProgress size={20} />
        }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Paper className="suggestions-paper" elevation={3}>
          <List className="suggestions-list">
            {suggestions.map((suggestion) => (
              <ListItem
                key={suggestion.place_id}
                button
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                <ListItemText
                  primary={suggestion.structured_formatting?.main_text || suggestion.description}
                  secondary={suggestion.structured_formatting?.secondary_text}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default AddressInput;
