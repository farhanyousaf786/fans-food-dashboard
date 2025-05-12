// AddMenuDialog.jsx (Modern Revamp - One Field Per Line)
import React, { useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    Switch, Button, Grid, Box, Typography,
    IconButton, Stack, Divider
} from '@mui/material';
import { AccessTime, CloudUpload, Delete, Save } from '@mui/icons-material';
import './AddMenuDialog.css';

const categories = [
    'Appetizers', 'Main Course', 'Sides', 'Beverages', 'Desserts', 'Specials'
];

const AddMenuDialog = ({ open, onClose, onSubmit, menuItem, onChange }) => {
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        if (!event.target.files?.length) return;
        
        const files = Array.from(event.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        // Ensure we have an array to spread into
        const currentImages = menuItem.images || [];
        onChange({ target: { name: 'images', value: [...currentImages, ...newImages] } });
    };

    const handleRemoveImage = (index) => {
        if (!menuItem.images) return;
        
        const newImages = [...menuItem.images];
        if (newImages[index]?.preview) {
            URL.revokeObjectURL(newImages[index].preview);
        }
        newImages.splice(index, 1);
        onChange({ target: { name: 'images', value: newImages } });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <Box className="modern-dialog">
                <DialogTitle className="modern-header">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="h5">Add New Menu Item</Typography>
                            <Typography variant="body2" className="subtitle">Complete the form to add your new item</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            className="modern-submit"
                            onClick={onSubmit}
                            startIcon={<Save />}
                        >
                            Save Menu
                        </Button>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent className="modern-content">
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Item Name"
                            name="name"
                            required
                            value={menuItem.name}
                            onChange={onChange}
                            className="modern-input"
                        />

                        <TextField
                            fullWidth
                            label="Price"
                            name="price"
                            type="number"
                            required
                            value={menuItem.price}
                            onChange={onChange}
                            className="modern-input"
                            InputProps={{ startAdornment: <span>$</span> }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            name="description"
                            value={menuItem.description}
                            onChange={onChange}
                            className="modern-input"
                        />

                        <FormControl fullWidth className="modern-input">
                            <InputLabel>Category</InputLabel>
                            <Select
                                name="category"
                                value={menuItem.category}
                                onChange={onChange}
                                label="Category"
                            >
                                {categories.map(cat => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box className="toggle-box">
                            <Typography>Available for Order</Typography>
                            <Switch
                                checked={menuItem.isAvailable}
                                onChange={onChange}
                                name="isAvailable"
                                color="success"
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Preparation Time (min)"
                            name="preparationTime"
                            type="number"
                            value={menuItem.preparationTime}
                            onChange={onChange}
                            className="modern-input"
                            InputProps={{ endAdornment: <AccessTime sx={{ color: '#888' }} /> }}
                        />

                        <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, bgcolor: '#fff' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="500">Menu Images</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<CloudUpload />}
                                    onClick={() => fileInputRef.current?.click()}
                                    size="small"
                                >
                                    Upload Images
                                </Button>
                            </Box>
                            
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />

                            {(!menuItem.images || menuItem.images.length === 0) ? (
                                <Box 
                                    sx={{ 
                                        border: '2px dashed #ddd',
                                        borderRadius: '8px',
                                        p: 3,
                                        textAlign: 'center',
                                        bgcolor: '#fafafa'
                                    }}
                                >
                                    <Typography color="text.secondary">
                                        No images selected yet
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        {menuItem.images.length} image(s) selected:
                                    </Typography>
                                    <Stack spacing={1}>
                                        {menuItem.images.map((img, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    border: '1px solid #eee',
                                                    borderRadius: '4px',
                                                    bgcolor: '#fff'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        mr: 2,
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img
                                                        src={img.preview}
                                                        alt={`Preview ${idx + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {img.file.name}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    sx={{ color: '#666' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions className="modern-actions">
                    <Button onClick={onClose} variant="outlined" className="modern-cancel">
                        Cancel
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddMenuDialog;