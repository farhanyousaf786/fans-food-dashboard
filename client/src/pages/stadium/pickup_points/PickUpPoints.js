import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Card, 
    CardContent, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Grid,
    IconButton,
    Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { db } from '../../../config/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import PickUpPoint from '../../../models/PickUpPoint';

const PickUpPoints = ({ stadiumId }) => {
    const [pickUpPoints, setPickUpPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPoint, setEditingPoint] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        area: '',
        description: '',
        location: ''
    });

    // Fetch pickup points for this stadium
    useEffect(() => {
        const fetchPickUpPoints = async () => {
            try {
                // Use subcollection under stadium
                const pickUpPointsRef = collection(db, 'stadiums', stadiumId, 'pickUpPoints');
                const querySnapshot = await getDocs(pickUpPointsRef);
                const pointsList = querySnapshot.docs.map(doc => 
                    PickUpPoint.fromFirestore(doc, doc.id)
                );
                setPickUpPoints(pointsList);
            } catch (error) {
                console.error('Error fetching pickup points:', error);
            } finally {
                setLoading(false);
            }
        };

        if (stadiumId) {
            fetchPickUpPoints();
        }
    }, [stadiumId]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle open dialog for add/edit
    const handleOpenDialog = (point = null) => {
        if (point) {
            setEditingPoint(point);
            setFormData({
                name: point.name,
                area: point.area,
                description: point.description,
                location: point.location
            });
        } else {
            setEditingPoint(null);
            setFormData({
                name: '',
                area: '',
                description: '',
                location: ''
            });
        }
        setOpenDialog(true);
    };

    // Handle close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPoint(null);
        setFormData({
            name: '',
            area: '',
            description: '',
            location: ''
        });
    };

    // Handle save pickup point
    const handleSavePoint = async () => {
        try {
            if (editingPoint) {
                // Update existing point
                const pointRef = doc(db, 'stadiums', stadiumId, 'pickUpPoints', editingPoint.id);
                const updatedPoint = new PickUpPoint(
                    formData.name,
                    formData.area,
                    formData.description,
                    formData.location,
                    stadiumId
                );
                await updateDoc(pointRef, updatedPoint.toFirestore());
                
                // Update local state
                setPickUpPoints(prev => prev.map(point => 
                    point.id === editingPoint.id 
                        ? { ...updatedPoint, id: editingPoint.id }
                        : point
                ));
            } else {
                // Create new point
                const newPoint = new PickUpPoint(
                    formData.name,
                    formData.area,
                    formData.description,
                    formData.location,
                    stadiumId
                );
                // Save to stadium subcollection
                const pickUpPointsRef = collection(db, 'stadiums', stadiumId, 'pickUpPoints');
                const docRef = await addDoc(pickUpPointsRef, newPoint.toFirestore());
                
                // Add to local state
                newPoint.id = docRef.id;
                setPickUpPoints(prev => [...prev, newPoint]);
            }
            
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving pickup point:', error);
        }
    };

    // Handle delete pickup point
    const handleDeletePoint = async (pointId) => {
        try {
            // Delete from stadium subcollection
            await deleteDoc(doc(db, 'stadiums', stadiumId, 'pickUpPoints', pointId));
            setPickUpPoints(prev => prev.filter(point => point.id !== pointId));
        } catch (error) {
            console.error('Error deleting pickup point:', error);
        }
    };

    if (loading) {
        return <Typography>Loading pickup points...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pick-up Points Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2 }}
                >
                    Add Pick-up Point
                </Button>
            </Box>

            <Grid container spacing={3}>
                {pickUpPoints.map((point) => (
                    <Grid item xs={12} md={6} lg={4} key={point.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {point.name}
                                    </Typography>
                                    <Box>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleOpenDialog(point)}
                                            sx={{ mr: 1 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDeletePoint(point.id)}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                                
                                <Chip 
                                    label={point.area} 
                                    size="small" 
                                    sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}
                                />
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {point.description}
                                </Typography>
                                
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    📍 {point.location}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                
                {pickUpPoints.length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No pickup points found. Click "Add Pick-up Point" to create one.
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingPoint ? 'Edit Pick-up Point' : 'Add Pick-up Point'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Pick-up Point Name"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Area"
                        fullWidth
                        variant="outlined"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Location"
                        fullWidth
                        variant="outlined"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSavePoint} variant="contained">
                        {editingPoint ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PickUpPoints;
