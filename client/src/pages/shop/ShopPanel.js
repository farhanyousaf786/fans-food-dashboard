import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Shop from '../../models/Shop';
import '../admin/AdminPanel.css';

const ShopPanel = () => {
  const navigate = useNavigate();
  const [stadiums, setStadiums] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedStadiumId, setSelectedStadiumId] = useState(null);
  const [newShop, setNewShop] = useState({
    name: '',
    location: '',
    floor: '',
    gate: '',
    description: '',
    admins: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stadiumsCollection = collection(db, 'stadiums');
        const stadiumSnapshot = await getDocs(stadiumsCollection);
        const stadiumList = stadiumSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStadiums(stadiumList);

        const allShops = [];
        for (const stadium of stadiumList) {
          const shopsCollection = collection(db, 'stadiums', stadium.id, 'shops');
          const shopsSnapshot = await getDocs(shopsCollection);
          const stadiumShops = shopsSnapshot.docs.map(doc => ({
            id: doc.id,
            stadiumName: stadium.name,
            ...doc.data()
          }));
          allShops.push(...stadiumShops);
        }
        setShops(allShops);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddShop = (stadiumId) => {
    setSelectedStadiumId(stadiumId);
    setOpenAddDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setNewShop({ name: '', location: '', floor: '', gate: '', description: '', admins: [] });
  };

  const handleCreateShop = async () => {
    try {
      const shop = new Shop(
        newShop.name,
        newShop.location,
        newShop.floor,
        newShop.gate,
        newShop.description,
        [auth.currentUser.uid],
        selectedStadiumId
      );

      const stadiumRef = doc(db, 'stadiums', selectedStadiumId);
      const shopsCollection = collection(stadiumRef, 'shops');
      await addDoc(shopsCollection, shop.toFirestore());
      handleCloseDialog();

      const updatedShopsSnapshot = await getDocs(shopsCollection);
      const updatedShops = updatedShopsSnapshot.docs.map(doc => ({
        id: doc.id,
        stadiumName: stadiums.find(s => s.id === selectedStadiumId)?.name,
        ...doc.data()
      }));
      setShops(prev => [...prev, ...updatedShops]);
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  return (
    <div className="admin-container">
      <div className="header">
        <h1>Shop Panel</h1>
        <div className="header-buttons">
          <Button
            onClick={handleLogout}
            variant="contained"
            className="logout-button"
          >
            Logout
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Loading data...</p>
      ) : (
        <>
          <div className="section-header">
            <Typography variant="h5" sx={{ mb: 3 }}>My Shops</Typography>
          </div>
          {shops.length === 0 ? (
            <div className="empty-message">
              <Typography variant="h6">
                No shops yet. Add a shop to a stadium below.
              </Typography>
            </div>
          ) : (
            <div className="stadiums-grid">
              {shops.map((shop) => (
                <Card 
                  className="stadium-card" 
                  key={shop.id}
                  onClick={() => navigate('/dashboard', { state: { shopData: shop } })}
                  sx={{ cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', transition: 'transform 0.2s' } }}
                >
                  <CardContent className="stadium-content">
                    <div className="stadium-header">
                      <Typography variant="h6" className="stadium-title">{shop.name}</Typography>
                    </div>
                    <div className="stadium-info">
                      <Typography className="stadium-location"><span>🏟️</span>{shop.stadiumName}</Typography>
                      <Typography className="stadium-location"><span>📍</span>{shop.location}</Typography>
                      <Typography className="stadium-capacity"><span>🚪</span>Gate {shop.gate}, Floor {shop.floor}</Typography>
                    </div>
                    <Typography className="stadium-about">{shop.description}</Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="section-header">
            <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>Available Stadiums</Typography>
          </div>
          {stadiums.length === 0 ? (
            <div className="empty-message">
              <Typography variant="h6">No stadiums available.</Typography>
            </div>
          ) : (
            <div className="stadiums-grid">
              {stadiums.map((stadium) => (
                <Card className="stadium-card" key={stadium.id}>
                  <CardMedia
                    component="img"
                    className="stadium-image"
                    image={stadium.imageUrl || 'https://via.placeholder.com/300x200'}
                    alt={stadium.name}
                  />
                  <CardContent className="stadium-content">
                    <div className="stadium-header">
                      <Typography variant="h6" className="stadium-title">{stadium.name}</Typography>
                    </div>
                    <div className="stadium-info">
                      <Typography className="stadium-location"><span>📍</span>{stadium.location}</Typography>
                      <Typography className="stadium-capacity"><span>👥</span>{stadium.capacity.toLocaleString()} seats</Typography>
                    </div>
                    <Typography className="stadium-about">{stadium.about}</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddShop(stadium.id)}
                      className="add-button"
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Add Shop
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={openAddDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Shop</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Shop Name"
                fullWidth
                value={newShop.name}
                onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Location in Stadium"
                fullWidth
                value={newShop.location}
                onChange={(e) => setNewShop({ ...newShop, location: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Floor"
                fullWidth
                value={newShop.floor}
                onChange={(e) => setNewShop({ ...newShop, floor: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Gate Number"
                fullWidth
                value={newShop.gate}
                onChange={(e) => setNewShop({ ...newShop, gate: e.target.value })}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={newShop.description}
                onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleCreateShop} variant="contained" className="add-button">Create Shop</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ShopPanel;
