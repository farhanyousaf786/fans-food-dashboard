import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Stadium from '../../models/Stadium';
import { Grid, Card, CardContent, CardMedia, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Box } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import StadiumForm from '../../components/StadiumForm';
import DeliveryUsers from './components/DeliveryUsers';
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
    const [uploading, setUploading] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [editingStadium, setEditingStadium] = useState(null);
    const [stadiumToDelete, setStadiumToDelete] = useState(null);

    const fetchStadiums = async () => {
        try {
            setLoading(true);
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

    useEffect(() => {
        fetchStadiums();
    }, []);



    const handleEditStadium = (stadium) => {
        setEditingStadium(stadium);
        setOpenEditDialog(true);
    };

    const handleUpdateStadium = async (formData) => {
        if (!editingStadium) return;
        
        try {
            setUploading(true);
            let imageUrl = editingStadium.imageUrl;
            
            if (formData.selectedImage) {
                // Upload new image to Firebase Storage
                const storageRef = ref(storage, `stadiums/${Date.now()}_${formData.selectedImage.name}`);
                await uploadBytes(storageRef, formData.selectedImage);
                imageUrl = await getDownloadURL(storageRef);
            }

            const stadiumRef = doc(db, 'stadiums', editingStadium.id);
            const updatedStadium = {
                name: formData.name,
                location: formData.location,
                capacity: formData.capacity,
                imageUrl: imageUrl,
                about: formData.about,
                latitude: formData.latitude,
                longitude: formData.longitude
            };
            
            await updateDoc(stadiumRef, updatedStadium);
            
            // Update local state
            setStadiums(prev => prev.map(stadium => {
                if (stadium.id === editingStadium.id) {
                    const updatedStadiumObj = new Stadium(
                        updatedStadium.name,
                        updatedStadium.location,
                        updatedStadium.capacity,
                        updatedStadium.imageUrl,
                        updatedStadium.about,
                        updatedStadium.latitude,
                        updatedStadium.longitude
                    );
                    updatedStadiumObj.id = editingStadium.id;
                    updatedStadiumObj.createdAt = stadium.createdAt;
                    updatedStadiumObj.updatedAt = new Date().toISOString();
                    return updatedStadiumObj;
                }
                return stadium;
            }));
            
            // Reset and close dialog
            setEditingStadium(null);
            setUploading(false);
            setOpenEditDialog(false);
            
            console.log('✅ Stadium updated successfully with coordinates:', formData.latitude, formData.longitude);
        } catch (error) {
            console.error('❌ Error updating stadium:', error);
            setUploading(false);
        }
    };

    const handleOpenDeleteDialog = (stadium) => {
        setStadiumToDelete(stadium);
        setOpenDeleteDialog(true);
    };

    const handleDeleteStadium = async () => {
        if (!stadiumToDelete) return;
        
        try {
            await deleteDoc(doc(db, 'stadiums', stadiumToDelete.id));
            setStadiums(prev => prev.filter(stadium => stadium.id !== stadiumToDelete.id));
            setOpenDeleteDialog(false);
            setStadiumToDelete(null);
            console.log('✅ Stadium deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting stadium:', error);
        }
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditingStadium(null);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setStadiumToDelete(null);
    };

    const handleCreateStadium = async (formData) => {
        try {
            setUploading(true);
            let imageUrl = '';
            
            if (formData.selectedImage) {
                // Upload image to Firebase Storage
                const storageRef = ref(storage, `stadiums/${Date.now()}_${formData.selectedImage.name}`);
                await uploadBytes(storageRef, formData.selectedImage);
                imageUrl = await getDownloadURL(storageRef);
            }

            const stadiumsRef = collection(db, 'stadiums');
            const newStadiumObj = new Stadium(
                formData.name,
                formData.location,
                formData.capacity,
                imageUrl,
                formData.about,
                formData.latitude,
                formData.longitude
            );
            
            const docRef = await addDoc(stadiumsRef, newStadiumObj.toFirestore());
            
            // Add to local state
            newStadiumObj.id = docRef.id;
            setStadiums(prev => [...prev, newStadiumObj]);
            
            setUploading(false);
            setOpenAddDialog(false);
            
            console.log('✅ Stadium created successfully with coordinates:', formData.latitude, formData.longitude);
        } catch (error) {
            console.error('❌ Error adding stadium:', error);
            setUploading(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="header">
                <div className="header-content">
                    <h1 className="page-title">Stadium Management</h1>
                    <div className="header-actions">
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
                <></>
            )}


            {/* Add Stadium Dialog */}
            <StadiumForm
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
                onSubmit={handleCreateStadium}
                title="Add New Stadium"
                submitText="Add Stadium"
                uploading={uploading}
            />

            {/* Edit Stadium Dialog */}
            <StadiumForm
                open={openEditDialog}
                onClose={handleCloseEditDialog}
                onSubmit={handleUpdateStadium}
                title="Edit Stadium"
                submitText="Update Stadium"
                initialData={editingStadium}
                uploading={uploading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Delete Stadium</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the stadium "{stadiumToDelete?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button 
                        onClick={handleDeleteStadium} 
                        variant="contained" 
                        sx={{ 
                            backgroundColor: '#dc004e',
                            '&:hover': { backgroundColor: '#b8003d' }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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
                {stadiums.map((stadium, index) => (
                    <Card 
                        className="stadium-card" 
                        key={stadium.id}
                        data-stadium-id={stadium.id}
                        data-index={index}
                    >
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
                                        onClick={() => handleEditStadium(stadium)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                        size="small" 
                                        className="delete-button"
                                        onClick={() => handleOpenDeleteDialog(stadium)}
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
                                {stadium.latitude && stadium.longitude && (
                                    <Typography className="stadium-coordinates">
                                        <span>🌐</span>
                                        {stadium.latitude.toFixed(4)}, {stadium.longitude.toFixed(4)}
                                    </Typography>
                                )}
                            </div>
                            <Typography className="stadium-about">
                                {stadium.about}
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                    variant="contained"
                                    onClick={() => navigate(`/stadium/${stadium.id}`)}
                                >
                                    Manage
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}


        {/* Add Stadium Dialog */}
        <StadiumForm
            open={openAddDialog}
            onClose={() => setOpenAddDialog(false)}
            onSubmit={handleCreateStadium}
            title="Add New Stadium"
            submitText="Add Stadium"
            uploading={uploading}
        />

        {/* Edit Stadium Dialog */}
        <StadiumForm
            open={openEditDialog}
            onClose={handleCloseEditDialog}
            onSubmit={handleUpdateStadium}
            title="Edit Stadium"
            submitText="Update Stadium"
            initialData={editingStadium}
            uploading={uploading}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Stadium</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete the stadium "{stadiumToDelete?.name}"? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                <Button 
                    onClick={handleDeleteStadium} 
                    variant="contained" 
                    sx={{ 
                        backgroundColor: '#dc004e',
                        '&:hover': { backgroundColor: '#b8003d' }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>

        </div>
    );
};

export default AdminPanel;
