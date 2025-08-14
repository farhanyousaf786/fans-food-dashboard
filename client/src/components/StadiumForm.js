import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button,
  Typography,
  Box
} from '@mui/material';
import AddressInput from './AddressInput';
import './StadiumForm.css';

const StadiumForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  title = "Add Stadium",
  submitText = "Add Stadium",
  initialData = null,
  uploading = false 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    capacity: initialData?.capacity?.toString() || '',
    about: initialData?.about || '',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [locationSelected, setLocationSelected] = useState(false);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle location selection from Google Places
  const handleLocationSelect = (locationData) => {
    console.log('📍 Location selected:', locationData);
    setFormData(prev => ({
      ...prev,
      location: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    }));
    setLocationSelected(true);
  };

  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  };

  // Handle form submission
  const handleSubmit = () => {
    const submissionData = {
      ...formData,
      capacity: parseInt(formData.capacity),
      selectedImage
    };
    
    console.log('🏟️ Submitting stadium data:', submissionData);
    onSubmit(submissionData);
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      location: '',
      capacity: '',
      about: '',
      latitude: null,
      longitude: null
    });
    setSelectedImage(null);
    setLocationSelected(false);
    onClose();
  };

  // Form validation
  const isFormValid = () => {
    return formData.name && 
           formData.location && 
           formData.capacity && 
           formData.latitude && 
           formData.longitude;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Stadium Name"
          type="text"
          fullWidth
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!formData.name && formData.name !== ''}
          helperText={!formData.name && formData.name !== '' ? 'Stadium name is required' : ''}
        />

        <AddressInput
          label="Stadium Location"
          value={formData.location}
          onChange={(value) => handleChange('location', value)}
          onLocationSelect={handleLocationSelect}
          placeholder="Search for stadium location..."
          error={!formData.location && formData.location !== ''}
          helperText={!formData.location && formData.location !== '' ? 'Location is required' : 
                     locationSelected ? '✅ Location coordinates captured' : 'Select from suggestions to capture coordinates'}
        />

        {/* Show coordinates if available */}
        {formData.latitude && formData.longitude && (
          <Box className="coordinates-display">
            <Typography variant="caption" color="success.main">
              📍 Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Typography>
          </Box>
        )}

        <TextField
          margin="dense"
          label="Capacity"
          type="number"
          fullWidth
          value={formData.capacity}
          onChange={(e) => handleChange('capacity', e.target.value)}
          error={!formData.capacity && formData.capacity !== ''}
          helperText={!formData.capacity && formData.capacity !== '' ? 'Capacity is required' : ''}
        />

        <div className="image-upload-section">
          <label htmlFor="stadium-image" className="image-upload-label">
            Stadium Image (optional)
          </label>
          <input
            id="stadium-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="image-upload-input"
          />
        </div>

        {(selectedImage || initialData?.imageUrl) && (
          <div className="image-preview">
            <img
              src={selectedImage ? URL.createObjectURL(selectedImage) : initialData?.imageUrl}
              alt="Stadium preview"
              className="preview-image"
            />
          </div>
        )}

        <TextField
          margin="dense"
          label="About"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={formData.about}
          onChange={(e) => handleChange('about', e.target.value)}
          placeholder="Describe the stadium..."
        />
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={!isFormValid() || uploading}
          className="submit-button"
        >
          {uploading ? 'Processing...' : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StadiumForm;
