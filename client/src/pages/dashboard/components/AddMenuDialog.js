// AddMenuDialog.jsx (Modern Revamp - One Field Per Line)
import React, { useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    Switch, Button, Grid, Box, Typography,
    IconButton, Stack, Divider
} from '@mui/material';
import { AccessTime, CloudUpload, Delete } from '@mui/icons-material';
import './AddMenuDialog.css';

const categories = [
    'Appetizers', 'Main Course', 'Sides', 'Beverages', 'Desserts', 'Specials'
];

const AddMenuDialog = ({ open, onClose, onSubmit, menuItem, onChange }) => {
    const fileInputRef = useRef(null);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        onChange({ target: { name: 'images', value: [...(menuItem.images || []), ...newImages] } });
    };

    const handleRemoveImage = (index) => {
        const newImages = [...menuItem.images];
        URL.revokeObjectURL(newImages[index].preview);
        newImages.splice(index, 1);
        onChange({ target: { name: 'images', value: newImages } });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <Box className="modern-dialog">
                <DialogTitle className="modern-header">
                    <Typography variant="h5">Add New Menu Item</Typography>
                    <Typography variant="body2" className="subtitle">Complete the form to add your new item</Typography>
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

                        <Box className="upload-area" onClick={() => fileInputRef.current?.click()}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                hidden
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <CloudUpload className="upload-icon" />
                            <Typography variant="subtitle1">Upload Images</Typography>
                            <Typography variant="caption">Click to upload (multiple supported)</Typography>
                        </Box>

                        {menuItem.images?.length > 0 && (
                            <Stack direction="row" spacing={2} className="image-preview-gallery">
                                {menuItem.images.map((img, idx) => (
                                    <Box key={idx} className="image-thumb">
                                        <img src={img.preview} alt={`Preview ${idx}`} className="image-file" />
                                        <IconButton className="remove-btn" onClick={() => handleRemoveImage(idx)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions className="modern-actions">
                    <Button onClick={onClose} variant="outlined" className="modern-cancel">Cancel</Button>
                    <Button onClick={onSubmit} variant="contained" className="modern-submit">Create Item</Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddMenuDialog;