import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  Stack,
  Alert
} from '@mui/material';
import { Close, CloudUpload, Delete } from '@mui/icons-material';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../config/firebase';
import Promotion from '../../../../models/Promotion';

const AddPromotionDialog = ({ open, onClose, shopData }) => {
  const [formData, setFormData] = useState({
    name: '',
    nameMap: { en: '', he: '' },
    promoText: '',
    promoTextMap: { en: '', he: '' },
    details: '',
    detailsMap: { en: '', he: '' },
    images: [],
    active: true
  });
  const [languages, setLanguages] = useState(['en', 'he']);
  const [newLangCode, setNewLangCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    
    // Handle nested object updates (like nameMap.en)
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = formData.images[index];
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    const nameEn = formData.nameMap?.en?.trim() || formData.name?.trim();
    const promoTextEn = formData.promoTextMap?.en?.trim() || formData.promoText?.trim();
    
    if (!nameEn || !promoTextEn) {
      setError('Name and promo text are required (at least in English)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload images
      const imageUrls = [];
      if (formData.images.length > 0) {
        for (const image of formData.images) {
          if (image.file) {
            const storageRef = ref(storage, `promotions/${shopData.id}/${Date.now()}-${image.file.name}`);
            const snapshot = await uploadBytes(storageRef, image.file);
            const url = await getDownloadURL(snapshot.ref);
            imageUrls.push(url);
          }
        }
      }

      // Create promotion object
      const promotion = new Promotion(
        nameEn, // Use English as fallback for name
        formData.nameMap,
        promoTextEn, // Use English as fallback for promoText
        formData.promoTextMap,
        formData.detailsMap?.en || formData.details || '', // Use English as fallback for details
        formData.detailsMap,
        imageUrls,
        formData.active,
        shopData.id,
        shopData.stadiumId
      );

      // Save to Firebase
      await addDoc(collection(db, 'promotions'), promotion.toFirestore());

      setSuccess('Promotion created successfully!');
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating promotion:', error);
      setError('Failed to create promotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up image previews
    formData.images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    
    setFormData({
      name: '',
      nameMap: { en: '', he: '' },
      promoText: '',
      promoTextMap: { en: '', he: '' },
      details: '',
      detailsMap: { en: '', he: '' },
      images: [],
      active: true
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box>
          <Typography variant="h5" fontWeight="600" color="#FF6B35">
            🎯 Create Promotion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create engaging promotions to attract customers
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Stack spacing={3}>
          {/* Multilingual Promotion Names */}
          <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
            <Typography variant="subtitle1" fontWeight="500" gutterBottom>
              Promotion Names (Multilingual)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Provide the promotion name in one or more languages. English (en) and Hebrew (he) shown by default.
            </Typography>
            <Stack spacing={2}>
              {languages.map((code) => (
                <TextField
                  key={code}
                  name={`nameMap.${code}`}
                  label={`Name (${code.toUpperCase()})`}
                  value={formData.nameMap?.[code] || ''}
                  onChange={handleChange}
                  fullWidth
                  required={code === 'en'}
                  placeholder={code === 'en' ? "e.g., Summer Special Deal" : `Name in ${code.toUpperCase()}`}
                />
              ))}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Add language code (e.g., ar, fr)"
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value.toLowerCase())}
                  sx={{ maxWidth: 260 }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    const code = (newLangCode || '').trim().toLowerCase();
                    if (!code) return;
                    if (!/^[a-z]{2,5}(-[a-z]{2})?$/i.test(code)) return;
                    if (!languages.includes(code)) {
                      setLanguages((prev) => [...prev, code]);
                      setFormData(prev => ({
                        ...prev,
                        nameMap: { ...prev.nameMap, [code]: '' }
                      }));
                    }
                    setNewLangCode('');
                  }}
                >
                  Add Language
                </Button>
              </Box>
            </Stack>
          </Box>

          {/* Multilingual Promo Text */}
          <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
            <Typography variant="subtitle1" fontWeight="500" gutterBottom>
              Promo Text (Multilingual)
            </Typography>
            <Stack spacing={2}>
              {languages.map((code) => (
                <TextField
                  key={code}
                  name={`promoTextMap.${code}`}
                  label={`Promo Text (${code.toUpperCase()})`}
                  value={formData.promoTextMap?.[code] || ''}
                  onChange={handleChange}
                  fullWidth
                  required={code === 'en'}
                  placeholder={code === 'en' ? "e.g., Get 20% off on all combo meals!" : `Promo text in ${code.toUpperCase()}`}
                  multiline
                  rows={2}
                />
              ))}
            </Stack>
          </Box>

          {/* Multilingual Details */}
          <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
            <Typography variant="subtitle1" fontWeight="500" gutterBottom>
              Details (Multilingual)
            </Typography>
            <Stack spacing={2}>
              {languages.map((code) => (
                <TextField
                  key={code}
                  name={`detailsMap.${code}`}
                  label={`Details (${code.toUpperCase()})`}
                  value={formData.detailsMap?.[code] || ''}
                  onChange={handleChange}
                  fullWidth
                  placeholder={code === 'en' ? "Additional details about the promotion..." : `Details in ${code.toUpperCase()}`}
                  multiline
                  rows={3}
                />
              ))}
            </Stack>
          </Box>

          {/* Image Upload */}
          <Box>
            <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 2 }}>
              Promotion Images
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              Upload Images
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            
            {formData.images.length > 0 && (
              <Stack spacing={1}>
                {formData.images.map((img, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      bgcolor: '#f9f9f9'
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '4px',
                        backgroundImage: `url(${img.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        mr: 2,
                        flexShrink: 0
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {img.file?.name || `Image ${idx + 1}`}
                    </Typography>
                    <IconButton size="small" onClick={() => handleRemoveImage(idx)} sx={{ color: '#666' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Active Toggle */}
          <FormControlLabel
            control={
              <Switch
                name="active"
                checked={formData.active}
                onChange={handleChange}
                color="success"
              />
            }
            label="Active Promotion"
            sx={{ mt: 2 }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.nameMap?.en?.trim() || !formData.promoTextMap?.en?.trim()}
          sx={{
            bgcolor: '#FF6B35',
            '&:hover': { bgcolor: '#E55A2B' }
          }}
        >
          {loading ? 'Creating...' : 'Create Promotion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPromotionDialog;
