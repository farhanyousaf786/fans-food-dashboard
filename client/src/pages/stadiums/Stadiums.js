import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
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
import './Stadiums.css';

const Stadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStadium, setNewStadium] = useState({
    name: '',
    address: '',
    capacity: '',
    description: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fileInputRef = useRef(null);
  const { user, logout } = useAuth();
  const { setSelectedStadium } = useStadium();
  const navigate = useNavigate();

  useEffect(() => {
    loadStadiums();
  }, [user]);

  const loadStadiums = async () => {
    try {
      const stadiumsQuery = query(
        collection(db, 'stadiums'),
        where('adminId', '==', user.uid)
      );
      const querySnapshot = await getDocs(stadiumsQuery);
      const stadiumsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStadiums(stadiumsList);
    } catch (error) {
      console.error('Error loading stadiums:', error);
      showSnackbar('Error loading stadiums', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('Image size should be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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

      const stadiumData = {
        ...newStadium,
        imageUrl,
        adminId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'stadiums'), stadiumData);
      showSnackbar('Stadium added successfully', 'success');
      setOpenDialog(false);
      resetForm();
      await loadStadiums();
    } catch (error) {
      console.error('Error adding stadium:', error);
      showSnackbar(error.message || 'Error adding stadium', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewStadium({
      name: '',
      address: '',
      capacity: '',
      description: '',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      showSnackbar('Error logging out', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ backgroundColor: '#15BE77' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stadium Management
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {stadiums.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 1
            }}
          >
            <Typography variant="h5" gutterBottom>
              Welcome to Stadium Management
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              You haven't added any stadiums yet. Click the button below to add your first stadium.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ mt: 2 }}
            >
              Add Your First Stadium
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                Your Stadiums
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Stadium
              </Button>
            </Box>

            <Grid container spacing={3}>
              {stadiums.map((stadium) => (
                <Grid item xs={12} sm={6} md={4} key={stadium.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        bgcolor: 'grey.200'
                      }}
                    >
                      {stadium.imageUrl ? (
                        <Box
                          component="img"
                          src={stadium.imageUrl}
                          alt={stadium.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography color="textSecondary">No Image</Typography>
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {stadium.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        📍 {stadium.address}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        👥 Capacity: {stadium.capacity}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {stadium.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => {
                          setSelectedStadium(stadium);
                          navigate('/dashboard');
                        }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Go to Dashboard
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <Dialog
        open={openDialog}
        onClose={() => !loading && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Stadium</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 2,
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Box
              onClick={() => !loading && fileInputRef.current?.click()}
              sx={{
                width: '100%',
                height: 200,
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'default' : 'pointer',
                backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '&:hover': {
                  borderColor: loading ? 'grey.300' : 'primary.main'
                }
              }}
            >
              {!imagePreview && (
                <Typography color="textSecondary">
                  {loading ? 'Uploading...' : 'Click to upload stadium image'}
                </Typography>
              )}
            </Box>
          </Box>

          <TextField
            label="Stadium Name"
            fullWidth
            required
            value={newStadium.name}
            onChange={(e) => setNewStadium(prev => ({ ...prev, name: e.target.value }))}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Address"
            fullWidth
            required
            value={newStadium.address}
            onChange={(e) => setNewStadium(prev => ({ ...prev, address: e.target.value }))}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Capacity"
            type="number"
            fullWidth
            required
            value={newStadium.capacity}
            onChange={(e) => setNewStadium(prev => ({ ...prev, capacity: e.target.value }))}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            required
            value={newStadium.description}
            onChange={(e) => setNewStadium(prev => ({ ...prev, description: e.target.value }))}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddStadium}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
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
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Stadiums;
