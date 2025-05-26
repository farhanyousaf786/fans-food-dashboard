import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Switch,
    FormControlLabel,
    IconButton,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    MenuItem,
    Checkbox,
    FormGroup
} from '@mui/material';
import { Close, CloudUpload, Delete, Add } from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../../config/firebase';

const categories = [
    'Appetizers', 'Main Course', 'Sides', 'Beverages', 'Desserts', 'Specials'
];

const EditMenuDialog = ({ open, onClose, onSubmit, menuItem, shopData }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const [editedItem, setEditedItem] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [],
        isAvailable: true,
        preparationTime: 15,
        foodType: [],
    });

    useEffect(() => {
        if (menuItem) {
            setEditedItem({
                ...menuItem,
                price: menuItem.price.toString()
            });
        }
    }, [menuItem]);

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        if (name === 'customization') {
            setEditedItem(prev => ({
                ...prev,
                customization: value
            }));
        } else if (name === 'foodType') {
            setEditedItem(prev => ({
                ...prev,
                foodType: value
            }));
        } else {
            setEditedItem(prev => ({
                ...prev,
                [name]: name === 'isAvailable' ? checked : value
            }));
        }
    };

    const handleImageUpload = async (e) => {
        if (!e.target.files?.length) return;
        
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        // Keep existing image URLs and add new ones
        const currentImages = editedItem.images || [];
        const existingUrls = currentImages.filter(img => typeof img === 'string');
        
        setEditedItem(prev => ({
            ...prev,
            images: [...existingUrls, ...newImages]
        }));
    };

    const handleRemoveImage = (index) => {
        const newImages = [...editedItem.images];
        if (newImages[index].preview) {
            URL.revokeObjectURL(newImages[index].preview);
        }
        newImages.splice(index, 1);
        setEditedItem(prev => ({
            ...prev,
            images: newImages
        }));
    };

    const handleAddOption = (type) => {
        const updatedCustomization = { ...editedItem.customization };
        updatedCustomization[type] = [
            ...updatedCustomization[type],
            { name: '', price: '' }
        ];
        handleInputChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleRemoveOption = (type, index) => {
        const updatedCustomization = { ...editedItem.customization };
        updatedCustomization[type].splice(index, 1);
        handleInputChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleOptionChange = (type, index, field, value) => {
        const updatedCustomization = { ...editedItem.customization };
        updatedCustomization[type][index][field] = value;
        handleInputChange({ target: { name: 'customization', value: updatedCustomization } });
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            // Upload new images
            const imageUrls = [];
            for (const image of editedItem.images) {
                if (image.file) {
                    const storageRef = ref(storage, `menuItems/${shopData.id}/${Date.now()}-${image.file.name}`);
                    const snapshot = await uploadBytes(storageRef, image.file);
                    const url = await getDownloadURL(snapshot.ref);
                    imageUrls.push(url);
                } else if (typeof image === 'string') {
                    imageUrls.push(image);
                }
            }

            const updatedItem = {
                ...editedItem,
                images: imageUrls,
                price: parseFloat(editedItem.price)
            };

            await onSubmit(updatedItem);
            setSuccess('Menu item updated successfully!');
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 1000);
        } catch (error) {
            console.error('Error updating menu item:', error);
            setError('Failed to update menu item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <Box className="modern-dialog" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <DialogTitle className="modern-header">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Edit Menu Item</Typography>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}
                    <Stack spacing={3}>
                        <TextField
                            label="Name"
                            name="name"
                            value={editedItem.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Description"
                            name="description"
                            value={editedItem.description}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                            fullWidth
                        />

                        <TextField
                            label="Price"
                            name="price"
                            type="number"
                            value={editedItem.price}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: '$'
                            }}
                        />

                        <TextField
                            label="Category"
                            name="category"
                            select
                            value={editedItem.category}
                            onChange={handleInputChange}
                            fullWidth
                        >
                            {categories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Preparation Time (minutes)"
                            name="preparationTime"
                            type="number"
                            value={editedItem.preparationTime}
                            onChange={handleInputChange}
                            fullWidth
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editedItem.isAvailable}
                                    onChange={handleInputChange}
                                    name="isAvailable"
                                    color="primary"
                                />
                            }
                            label="Available"
                        />
                        {/* Images */}
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Images
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {editedItem.images?.map((image, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            width: 100,
                                            height: 100
                                        }}
                                    >
                                        <img
                                            src={typeof image === 'string' ? image : image.preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveImage(index)}
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255,255,255,1)'
                                                }
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUpload />}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    Upload
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                    />
                                </Button>
                            </Box>
                        </Box>

                        {/* Customization Options */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Customization Options
                            </Typography>
                            
                            {/* Toppings */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1">Toppings</Typography>
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() => handleAddOption('toppings')}
                                        size="small"
                                    >
                                        Add Topping
                                    </Button>
                                </Box>
                                {editedItem.customization?.toppings?.map((topping, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            label="Name"
                                            value={topping.name}
                                            onChange={(e) => handleOptionChange('toppings', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Price"
                                            type="number"
                                            value={topping.price}
                                            onChange={(e) => handleOptionChange('toppings', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveOption('toppings', index)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Extras */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1">Extras</Typography>
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() => handleAddOption('extras')}
                                        size="small"
                                    >
                                        Add Extra
                                    </Button>
                                </Box>
                                {editedItem.customization?.extras?.map((extra, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            label="Name"
                                            value={extra.name}
                                            onChange={(e) => handleOptionChange('extras', index, 'name', e.target.value)}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Price"
                                            type="number"
                                            value={extra.price}
                                            onChange={(e) => handleOptionChange('extras', index, 'price', e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveOption('extras', index)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>

                            {/* Food Type Options */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Food Type</Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={editedItem.foodType?.halal || false}
                                                onChange={(e) => {
                                                    handleInputChange({
                                                        target: {
                                                            name: 'foodType',
                                                            value: {
                                                                ...(editedItem.foodType || {}),
                                                                halal: e.target.checked
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                        }
                                        label="Halal"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={editedItem.foodType?.kosher || false}
                                                onChange={(e) => {
                                                    handleInputChange({
                                                        target: {
                                                            name: 'foodType',
                                                            value: {
                                                                ...(editedItem.foodType || {}),
                                                                kosher: e.target.checked
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                        }
                                        label="Kosher"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={editedItem.foodType?.vegan || false}
                                                onChange={(e) => {
                                                    handleInputChange({
                                                        target: {
                                                            name: 'foodType',
                                                            value: {
                                                                ...(editedItem.foodType || {}),
                                                                vegan: e.target.checked
                                                            }
                                                        }
                                                    });
                                                }}
                                            />
                                        }
                                        label="Vegan"
                                    />
                                </FormGroup>
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default EditMenuDialog;
