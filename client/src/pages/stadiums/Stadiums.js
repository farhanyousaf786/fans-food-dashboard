// Final fixed React component using MUI Grid + Card layout for Stadiums
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useStadium } from '../../context/StadiumContext';
import { useNavigate } from 'react-router-dom';

const Stadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStadium, setNewStadium] = useState({ name: '', address: '', capacity: '', description: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fileInputRef = useRef(null);
  const { user, logout } = useAuth();
  const { setSelectedStadium } = useStadium();
  const navigate = useNavigate();

  useEffect(() => { loadStadiums(); }, [user]);

  const loadStadiums = async () => {
    try {
      const stadiumsQuery = query(collection(db, 'stadiums'), where('adminId', '==', user.uid));
      const querySnapshot = await getDocs(stadiumsQuery);
      const stadiumsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStadiums(stadiumsList);
    } catch (error) {
      showSnackbar('Error loading stadiums', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 5 * 1024 * 1024) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      showSnackbar('Image size should be less than 5MB', 'error');
    }
  };

  const handleAddStadium = async () => {
    if (!newStadium.name || !newStadium.address || !newStadium.capacity || !newStadium.description) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    try {
      setLoading(true);
      let imageUrl = '';
      if (imageFile) {
        const imageRef = ref(storage, `stadiums/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(db, 'stadiums'), { ...newStadium, imageUrl, adminId: user.uid, createdAt: new Date().toISOString() });
      showSnackbar('Stadium added successfully', 'success');
      setOpenDialog(false);
      resetForm();
      await loadStadiums();
    } catch (error) {
      showSnackbar('Error adding stadium', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewStadium({ name: '', address: '', capacity: '', description: '', imageUrl: '' });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      showSnackbar('Error logging out', 'error');
    }
  };

  const handleInputChange = (e) => {
    setNewStadium(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFFFF', color: '#fff' }}>
      <AppBar position="static" sx={{ backgroundColor: '#15BE77' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Stadium Management</Typography>
          <IconButton color="inherit" onClick={handleLogout}><ExitToAppIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Your Stadiums</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>Add Stadium</Button>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {stadiums.map(stadium => (
            <Box
              key={stadium.id}
              sx={{
                background: '#FEFEFEFF',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: '180px',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5'
                }}
              >
                {stadium.imageUrl ? (
                  <Box
                    component="img"
                    src={stadium.imageUrl}
                    alt={stadium.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.9)'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}
                  >
                    <Typography>No Image</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="#2D2D2D" gutterBottom>{stadium.name}</Typography>
                <Typography variant="body2" color="gray" gutterBottom>
                  📍 {stadium.address}
                </Typography>
                <Typography variant="body2" color="gray" gutterBottom>
                  👥 Capacity: {stadium.capacity}
                </Typography>
                <Typography variant="body2" color="#aaa">
                  {stadium.description?.substring(0, 120)}
                </Typography>
              </Box>
              <Box sx={{ px: 3, pb: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    backgroundColor: '#15BE77',
                    '&:hover': { backgroundColor: '#13a86b' },
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => {
                    setSelectedStadium(stadium);
                    navigate('/dashboard');
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Stadium</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Stadium Name"
              name="name"
              value={newStadium.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Address"
              name="address"
              value={newStadium.address}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Capacity"
              name="capacity"
              type="number"
              value={newStadium.capacity}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              label="Description"
              name="description"
              value={newStadium.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
            />
            <Box>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
              >
                Add Stadium Image
              </Button>
              {imagePreview && (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Stadium preview"
                  sx={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddStadium}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Adding...' : 'Add Stadium'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Stadiums;
