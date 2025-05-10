import React, { useState, useEffect } from 'react';
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
  Paper,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useStadium } from '../../context/StadiumContext';

const Stadiums = () => {
  const [stadiums, setStadiums] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStadium, setNewStadium] = useState({
    name: '',
    address: '',
    capacity: '',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { setSelectedStadium } = useStadium();

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

  const handleAddStadium = async () => {
    try {
      const stadiumData = {
        ...newStadium,
        adminId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'stadiums'), stadiumData);
      showSnackbar('Stadium added successfully', 'success');
      setOpenDialog(false);
      setNewStadium({
        name: '',
        address: '',
        capacity: '',
        description: ''
      });
      loadStadiums();
    } catch (error) {
      console.error('Error adding stadium:', error);
      showSnackbar('Error adding stadium', 'error');
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
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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

      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {stadiums.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
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
          </Paper>
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
                <Grid item xs={12} md={6} key={stadium.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2">
                        {stadium.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {stadium.address}
                      </Typography>
                      <Typography variant="body2">
                        Capacity: {stadium.capacity}
                      </Typography>
                      <Typography variant="body2">
                        {stadium.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                          setSelectedStadium(stadium);
                          navigate('/dashboard');
                        }}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Stadium</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Stadium Name"
            fullWidth
            value={newStadium.name}
            onChange={(e) => setNewStadium(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={newStadium.address}
            onChange={(e) => setNewStadium(prev => ({ ...prev, address: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            value={newStadium.capacity}
            onChange={(e) => setNewStadium(prev => ({ ...prev, capacity: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newStadium.description}
            onChange={(e) => setNewStadium(prev => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddStadium} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Stadiums;
