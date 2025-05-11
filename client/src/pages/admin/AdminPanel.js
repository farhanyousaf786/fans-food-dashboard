import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Stadium from '../../models/Stadium';
import { Grid, Card, CardContent, CardMedia, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import './AdminPanel.css';
const AdminPanel = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('user');
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const [stadiums, setStadiums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newStadium, setNewStadium] = useState({
        name: '',
        location: '',
        capacity: '',
        imageUrl: '',
        about: ''
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchStadiums = async () => {
            try {
                const stadiumsCollection = collection(db, 'stadiums');
                const stadiumsSnapshot = await getDocs(stadiumsCollection);
                const stadiumsList = stadiumsSnapshot.docs.map(doc => 
                    Stadium.fromFirestore(doc, doc.id)
                );
                setStadiums(stadiumsList);
            } catch (error) {
                console.error('Error fetching stadiums:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStadiums();
    }, []);

    return (
        <div className="admin-container">
            <div className="header">
                <h1>Stadium Management</h1>
                <div className="header-buttons">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAddDialog(true)}
                        className="add-button"
                    >
                        Add Stadium
                    </Button>
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
                <p className="loading-message">Loading stadiums...</p>
            ) : stadiums.length === 0 ? (
                <div className="empty-message">
                    <Typography variant="h6">
                        No stadiums found. Add your first stadium!
                    </Typography>
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
                                    <Typography 
                                        variant="h6" 
                                        component="h2"
                                        className="stadium-title"
                                    >
                                        {stadium.name}
                                    </Typography>
                                    <div className="stadium-actions">
                                        <IconButton 
                                            size="small" 
                                            className="edit-button"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            className="delete-button"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="stadium-info">
                                    <Typography className="stadium-location">
                                        <span>📍</span>
                                        {stadium.location}
                                    </Typography>
                                    <Typography className="stadium-capacity">
                                        <span>👥</span>
                                        {stadium.capacity.toLocaleString()} seats
                                    </Typography>
                                </div>
                                <Typography className="stadium-about">
                                    {stadium.about}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Stadium Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Stadium</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Stadium Name"
                        type="text"
                        fullWidth
                        value={newStadium.name}
                        onChange={(e) => setNewStadium({ ...newStadium, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Location"
                        type="text"
                        fullWidth
                        value={newStadium.location}
                        onChange={(e) => setNewStadium({ ...newStadium, location: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Capacity"
                        type="number"
                        fullWidth
                        value={newStadium.capacity}
                        onChange={(e) => setNewStadium({ ...newStadium, capacity: e.target.value })}
                    />
                    <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="stadium-image-upload"
                            type="file"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    setSelectedImage(e.target.files[0]);
                                }
                            }}
                        />
                        <label htmlFor="stadium-image-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                                style={{ height: '56px' }}
                            >
                                {selectedImage ? selectedImage.name : 'Upload Stadium Image'}
                            </Button>
                        </label>
                    </div>
                    {selectedImage && (
                        <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                            <img
                                src={URL.createObjectURL(selectedImage)}
                                alt="Stadium preview"
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }}
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
                        value={newStadium.about}
                        onChange={(e) => setNewStadium({ ...newStadium, about: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button 
                        onClick={async () => {
                            try {
                                setUploading(true);
                                let imageUrl = '';
                                
                                if (selectedImage) {
                                    // Upload image to Firebase Storage
                                    const storageRef = ref(storage, `stadiums/${Date.now()}_${selectedImage.name}`);
                                    await uploadBytes(storageRef, selectedImage);
                                    imageUrl = await getDownloadURL(storageRef);
                                }

                                const stadiumsRef = collection(db, 'stadiums');
                                const newStadiumObj = new Stadium(
                                    newStadium.name,
                                    newStadium.location,
                                    parseInt(newStadium.capacity),
                                    imageUrl,
                                    newStadium.about
                                );
                                await addDoc(stadiumsRef, newStadiumObj.toFirestore());
                                
                                // Reset form and close dialog
                                setNewStadium({
                                    name: '',
                                    location: '',
                                    capacity: '',
                                    imageUrl: '',
                                    about: ''
                                });
                                setSelectedImage(null);
                                setUploading(false);
                                setOpenAddDialog(false);
                                
                                // Refresh stadiums list
                                const stadiumsSnapshot = await getDocs(stadiumsRef);
                                const stadiumsList = stadiumsSnapshot.docs.map(doc => 
                                    Stadium.fromFirestore(doc, doc.id)
                                );
                                setStadiums(stadiumsList);
                            } catch (error) {
                                console.error('Error adding stadium:', error);
                            }
                        }} 
                        color="primary"
                        variant="contained"
                        disabled={!newStadium.name || !newStadium.location || !newStadium.capacity || uploading}
                        style={{ backgroundColor: uploading ? '#ccc' : '#15BE77' }}
                    >
                        Add Stadium
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminPanel;
