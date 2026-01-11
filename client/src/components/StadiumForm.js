import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  FormGroup,
  IconButton,
  Avatar
} from '@mui/material';
import { Edit as EditIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
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
    longitude: initialData?.longitude || null,
    availableRooms: initialData?.availableRooms || false,
    availableSections: initialData?.availableSections || false,
    availablePickupPoints: initialData?.availablePickupPoints || false,
    availableShops: initialData?.availableShops || false,
    availableStands: initialData?.availableStands || false,
    availableFloors: initialData?.availableFloors || false,
    availableSeats: initialData?.availableSeats || false,
    availableTickets: initialData?.availableTickets || false
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [locationSelected, setLocationSelected] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        location: initialData.location || '',
        capacity: initialData.capacity?.toString() || '',
        about: initialData.about || '',
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
        availableRooms: initialData.availableRooms || false,
        availableSections: initialData.availableSections || false,
        availablePickupPoints: initialData.availablePickupPoints || false,
        availableShops: initialData.availableShops || false,
        availableStands: initialData.availableStands || false,
        availableFloors: initialData.availableFloors || false,
        availableSeats: initialData.availableSeats || false,
        availableTickets: initialData.availableTickets || false
      });
      setLocationSelected(!!(initialData.latitude && initialData.longitude));
    } else {
      // Reset form when no initialData
      setFormData({
        name: '',
        location: '',
        capacity: '',
        about: '',
        latitude: null,
        longitude: null,
        availableRooms: false,
        availableSections: false,
        availablePickupPoints: false,
        availableShops: false,
        availableStands: false,
        availableFloors: false,
        availableSeats: false,
        availableTickets: false
      });
      setLocationSelected(false);
    }
  }, [initialData]);

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
      longitude: null,
      availableRooms: false,
      availableSections: false,
      availablePickupPoints: false,
      availableShops: false,
      availableStands: false,
      availableFloors: false,
      availableSeats: false,
      availableTickets: false
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 600,
        py: 2
      }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Stadium Profile Section - WhatsApp Style - AT TOP */}
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Profile Image Section */}
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={selectedImage ? URL.createObjectURL(selectedImage) : initialData?.imageUrl}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    bgcolor: 'grey.200',
                    border: '3px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {!selectedImage && !initialData?.imageUrl && (
                    <CameraIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                  )}
                </Avatar>
                
                {/* Edit Icon Overlay */}
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    right: -5,
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                  <input
                    id="stadium-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </IconButton>
              </Box>

              {/* Stadium Info Section */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  mb: 0.5,
                  lineHeight: 1.2
                }}>
                  {formData.name || 'Stadium Name'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body1" sx={{ 
                    color: 'text.secondary',
                    fontSize: '1.1rem'
                  }}>
                    👥 Capacity: {formData.capacity || '0'}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  📍 {formData.location || 'Location not set'}
                </Typography>

                {formData.latitude && formData.longitude && (
                  <Typography variant="caption" sx={{ 
                    color: 'success.main',
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.75rem'
                  }}>
                    📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Upload Hint */}
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraIcon sx={{ fontSize: 16 }} />
                Click the edit icon to change stadium image
              </Typography>
            </Box>
          </Box>

          {/* Basic Information Section */}
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Basic Information
            </Typography>
            
            <TextField
              autoFocus
              label="Stadium Name"
              fullWidth
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!formData.name && formData.name !== ''}
              helperText={!formData.name && formData.name !== '' ? 'Stadium name is required' : ''}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
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
              sx={{ mb: 2 }}
            />

            {/* Show coordinates if available */}
            {formData.latitude && formData.longitude && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'success.light', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'success.main'
              }}>
                <Typography variant="body2" color="success.dark" sx={{ fontWeight: 500 }}>
                  📍 Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Typography>
              </Box>
            )}

            <TextField
              label="Capacity"
              type="number"
              fullWidth
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              error={!formData.capacity && formData.capacity !== ''}
              helperText={!formData.capacity && formData.capacity !== '' ? 'Capacity is required' : ''}
              sx={{ mt: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
          </Box>

          {/* Description Section */}
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              About Stadium
            </Typography>
            
            <TextField
              multiline
              rows={4}
              fullWidth
              label="Description"
              value={formData.about}
              onChange={(e) => handleChange('about', e.target.value)}
              placeholder="Describe the stadium, its history, facilities, etc..."
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
          </Box>

          {/* Features Section */}
          <Box sx={{ 
            bgcolor: 'white', 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              Stadium Features
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableRooms}
                    onChange={(e) => handleChange('availableRooms', e.target.checked)}
                    color="primary"
                  />
                }
                label="Rooms"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableSections}
                    onChange={(e) => handleChange('availableSections', e.target.checked)}
                    color="primary"
                  />
                }
                label="Sections"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availablePickupPoints}
                    onChange={(e) => handleChange('availablePickupPoints', e.target.checked)}
                    color="primary"
                  />
                }
                label="Pick-up Points"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableShops}
                    onChange={(e) => handleChange('availableShops', e.target.checked)}
                    color="primary"
                  />
                }
                label="Shops"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableStands}
                    onChange={(e) => handleChange('availableStands', e.target.checked)}
                    color="primary"
                  />
                }
                label="Stands"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableFloors}
                    onChange={(e) => handleChange('availableFloors', e.target.checked)}
                    color="primary"
                  />
                }
                label="Floors"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableSeats}
                    onChange={(e) => handleChange('availableSeats', e.target.checked)}
                    color="primary"
                  />
                }
                label="Seats"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.availableTickets}
                    onChange={(e) => handleChange('availableTickets', e.target.checked)}
                    color="primary"
                  />
                }
                label="Tickets"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem' } }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, bgcolor: '#fafafa' }}>
        <Button 
          onClick={handleClose} 
          size="large"
          sx={{ 
            borderRadius: 2,
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={!isFormValid() || uploading}
          sx={{ 
            borderRadius: 2,
            px: 4,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }}
        >
          {uploading ? 'Processing...' : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StadiumForm;
