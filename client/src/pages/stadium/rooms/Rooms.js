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
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Avatar,
    LinearProgress,
    Fade,
    Slide,
    useTheme,
    alpha,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Checkbox,
    FormGroup,
    FormControlLabel,
    InputAdornment
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Room as RoomIcon,
    MeetingRoom as MeetingRoomIcon,
    Layers as LayersIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Calculate as CalculateIcon,
    Map as MapIcon,
    List as ListIcon,
    GridOn as GridOnIcon,
    AddCircle as AddCircleIcon,
    RemoveCircle as RemoveCircleIcon
} from '@mui/icons-material';
import { db } from '../../../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Room from '../../../models/Room';
import './Rooms.css';

const Rooms = ({ stadiumId }) => {
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [formData, setFormData] = useState({
        floors: [],
        sections: [],
        roomsPerFloor: {}
    });
    const [showRoomList, setShowRoomList] = useState(false);
    const [viewMode, setViewMode] = useState('overview'); // overview, list, map, grid

    // Fetch room data for this stadium
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const roomRef = doc(db, 'stadiums', stadiumId, 'roomConfig', 'config');
                const roomDoc = await getDoc(roomRef);
                
                if (roomDoc.exists()) {
                    const parsed = Room.fromFirestore(roomDoc, roomDoc.id);
                    setRoomData(parsed);
                    const data = roomDoc.data();
                    setFormData({
                        floors: parsed.floors || [],
                        sections: data.sections || [],
                        roomsPerFloor: data.roomsPerFloor || {}
                    });
                } else {
                    // Don't create default config - let user configure first
                    setRoomData(new Room({ floors: [], sections: [], roomsPerFloor: {} }, stadiumId));
                    setFormData({
                        floors: [],
                        sections: [],
                        roomsPerFloor: {}
                    });
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (stadiumId) {
            fetchRoomData();
        }
    }, [stadiumId]);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle floor selection
    const handleFloorChange = (event) => {
        const {
            target: { value },
        } = event;
        const nextFloors = (typeof value === 'string' ? value.split(',') : value)
            .map((f) => (typeof f === 'number' ? f : parseInt(f, 10)))
            .filter((f) => !Number.isNaN(f));
        setFormData(prev => ({
            ...prev,
            floors: nextFloors,
            roomsPerFloor: {
                ...prev.roomsPerFloor,
                ...nextFloors.reduce((acc, floor) => {
                    const key = String(floor);
                    if (prev.roomsPerFloor?.[key] === undefined) {
                        acc[key] = 0;
                    }
                    return acc;
                }, {})
            }
        }));
    };

    // Handle section selection
    const handleSectionChange = (event) => {
        const {
            target: { value },
        } = event;
        setFormData(prev => ({
            ...prev,
            sections: typeof value === 'string' ? value.split(',') : value
        }));
    };

    // Handle rooms per floor change
    const handleRoomsPerFloorChange = (floor, value) => {
        const key = String(floor);
        setFormData(prev => ({
            ...prev,
            roomsPerFloor: {
                ...prev.roomsPerFloor,
                [key]: parseInt(value) || 0
            }
        }));
    };

    // Handle open dialog for edit
    const handleOpenDialog = () => {
        setEditingData(roomData);
        // Reset form to current roomData values or defaults
        if (roomData) {
            setFormData({
                floors: roomData.floors || [],
                sections: roomData.sections || [],
                roomsPerFloor: roomData.roomsPerFloor || {}
            });
        }
        setOpenDialog(true);
    };

    // Handle close dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingData(null);
    };

    // Handle save room configuration
    const handleSaveConfig = async () => {
        if (!stadiumId) return;
        try {
            setSaving(true);
            setSaveError('');

            if (!formData.floors?.length) {
                setSaveError('Please select at least one floor.');
                return;
            }

            const anyRooms = (formData.floors || []).some((floor) => (formData.roomsPerFloor?.[String(floor)] || 0) > 0);
            if (!anyRooms) {
                setSaveError('Please enter rooms for at least one selected floor.');
                return;
            }

            const roomRef = doc(db, 'stadiums', stadiumId, 'roomConfig', 'config');
            const newRoomData = new Room({
                floors: formData.floors,
                sections: formData.sections,
                roomsPerFloor: formData.roomsPerFloor
            }, stadiumId);

            await setDoc(roomRef, newRoomData.toFirestore(), { merge: true });

            setRoomData(newRoomData);
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving room configuration:', error);
            setSaveError(error?.message || 'Failed to save configuration.');
        } finally {
            setSaving(false);
        }
    };

    // Generate room list for display
    const generateRoomList = () => {
        if (!roomData || !roomData.floors) return [];
        return Room.generateRoomList(roomData.floors, roomData.sections || [], roomData.roomsPerFloor || {});
    };

    // Get total rooms
    const getTotalRooms = () => {
        if (!roomData || !roomData.floors) return 0;
        return Room.getTotalRooms(roomData.floors, roomData.sections || [], roomData.roomsPerFloor || {});
    };

    // Get room distribution by section
    const getRoomDistribution = () => {
        if (!roomData || !roomData.floors || !roomData.roomsPerFloor) return [];

        if (!roomData.sections || roomData.sections.length === 0) {
            // No sections selected => show distribution by floor
            return roomData.floors
                .slice()
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((floor) => ({
                    section: `Floor ${floor}`,
                    rooms: roomData.roomsPerFloor[floor] || 0,
                    isFloor: true,
                    floor
                }));
        }

        return roomData.sections.map((section) => {
            const roomsInSection = roomData.floors.reduce((total, floor) => {
                return total + (roomData.roomsPerFloor[floor] || 0);
            }, 0);

            return {
                section: section.toUpperCase(),
                rooms: roomsInSection,
                isFloor: false
            };
        });
    };

    if (loading) {
        return (
            <Box className="loading-container">
                <LinearProgress className="loading-progress" />
                <Typography className="loading-text">
                    Loading room configuration...
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="rooms-container">
            {/* Header */}
            <Box className="rooms-header">
               
                <Button
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={handleOpenDialog}
                    className="configure-button"
                >
                    Configure System
                </Button>
            </Box>

            {/* View Mode Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
                    <Tab value="overview" label="Overview" icon={<LayersIcon />} />
                    <Tab value="list" label="List View" icon={<ListIcon />} />
                    <Tab value="grid" label="Grid View" icon={<GridOnIcon />} />
                    <Tab value="map" label="Map View" icon={<MapIcon />} />
                </Tabs>
            </Box>

            {/* Overview Tab */}
            {viewMode === 'overview' && (
                <Box>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Card className="summary-card">
                                <CardContent>
                                    <Avatar className="avatar">
                                        <RoomIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h3">
                                        {getTotalRooms()}
                                    </Typography>
                                    <Typography className="subtitle">
                                        Total Rooms
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card className="summary-card">
                                <CardContent>
                                    <Avatar className="avatar">
                                        <LayersIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h3">
                                        {roomData?.floors?.length || 0}
                                    </Typography>
                                    <Typography className="subtitle">
                                        Active Floors (1-50)
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Card className="summary-card">
                                <CardContent>
                                    <Avatar className="avatar">
                                        <MeetingRoomIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                    <Typography variant="h3">
                                        {roomData?.sections?.length || 0}
                                    </Typography>
                                    <Typography className="subtitle">
                                        Active Sections (A-Z)
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Room Distribution */}
                    {roomData && roomData.floors && roomData.floors.length > 0 ? (
                        <Card className="room-distribution">
                            <Typography variant="h6">
                                {roomData.sections && roomData.sections.length > 0
                                    ? 'Room Distribution by Section'
                                    : 'Room Distribution by Floor'}
                            </Typography>
                            <Grid container spacing={2}>
                                {getRoomDistribution().map((dist, index) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                        <Box className="section-box">
                                            <Typography variant="h6">
                                                {dist.isFloor ? dist.section : `Section ${dist.section}`}
                                            </Typography>
                                            <Typography className="room-count">
                                                {dist.rooms} rooms
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Card>
                    ) : (
                        <Card className="room-distribution">
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Room Distribution
                            </Typography>
                            <Box className="section-box empty">
                                <Typography variant="h6">
                                    No floors configured
                                </Typography>
                                <Typography className="room-count">
                                    Click "Configure System" to set up floors and rooms
                                </Typography>
                            </Box>
                        </Card>
                    )}
                </Box>
            )}

            {/* List View Tab */}
            {viewMode === 'list' && (
                <Box>
                    {roomData && roomData.floors && getTotalRooms() > 0 ? (
                        <TableContainer component={Paper} className="room-list-container">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Room Number</TableCell>
                                        <TableCell>Section</TableCell>
                                        <TableCell>Floor</TableCell>
                                        <TableCell>Room</TableCell>
                                        <TableCell>Full Location</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {generateRoomList().map((room, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {room.roomNumber}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={room.section ? room.section : 'No Section'}
                                                    size="small"
                                                    className="room-section-chip"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={`Floor ${room.floor}`} size="small" className="room-floor-chip" />
                                            </TableCell>
                                            <TableCell>{room.roomLabel}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {(room.section ? room.sectionLabel : 'No Section')} • {room.floorLabel} • {room.roomLabel}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info">
                            No rooms configured yet. Click "Configure System" to set up rooms.
                        </Alert>
                    )}
                </Box>
            )}

            {/* Grid View Tab */}
            {viewMode === 'grid' && (
                <Box>
                    {roomData && roomData.floors && getTotalRooms() > 0 ? (
                        <Grid container spacing={2}>
                            {generateRoomList().map((room, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Card className="summary-card" sx={{ cursor: 'pointer' }}>
                                        <CardContent>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                                {room.roomNumber}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={room.section ? room.section : 'No Section'}
                                                    size="small"
                                                    className="room-section-chip"
                                                />
                                                <Chip label={`F${room.floor}`} size="small" className="room-floor-chip" />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {(room.section ? room.sectionLabel : 'No Section')} • {room.floorLabel}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Alert severity="info">
                            No rooms configured yet. Click "Configure System" to set up rooms.
                        </Alert>
                    )}
                </Box>
            )}

            {/* Map View Tab */}
            {viewMode === 'map' && (
                <Box>
                    {roomData && roomData.floors && getTotalRooms() > 0 ? (
                        <Paper className="room-list-container">
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Visual map representation of your stadium room layout. Rooms are organized by sections and floors.
                            </Alert>
                            
                            {/* Section-based Map Layout */}
                            {getRoomDistribution().map((section, sectionIndex) => (
                                <Box key={sectionIndex} sx={{ mb: 4 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        {section.isFloor ? section.section : `Section ${section.section}`} ({section.rooms} rooms)
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {generateRoomList()
                                            .filter((room) => (section.isFloor ? room.floor === section.floor : room.section === section.section))
                                            .map((room, roomIndex) => (
                                                <Grid item xs={12} sm={6} md={4} lg={2} key={roomIndex}>
                                                    <Box
                                                        sx={{
                                                            p: 2,
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: 1,
                                                            textAlign: 'center',
                                                            bgcolor: '#f8f8f8',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: '#e8e8e8' }
                                                        }}
                                                    >
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {room.roomNumber}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Floor {room.floor}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            ))}
                                    </Grid>
                                    <Divider sx={{ mt: 3 }} />
                                </Box>
                            ))}
                        </Paper>
                    ) : (
                        <Alert severity="info">
                            No rooms configured yet. Click "Configure System" to set up rooms.
                        </Alert>
                    )}
                </Box>
            )}

            {/* Configuration Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    className: "config-dialog"
                }}
            >
                <DialogTitle className="config-dialog-title">
                    <Box className="title-content">
                        <SettingsIcon />
                        Configure Room System
                    </Box>
                </DialogTitle>
                <DialogContent className="config-dialog-content">
                    {saveError ? (
                        <Alert severity="error" className="config-alert">
                            {saveError}
                        </Alert>
                    ) : null}
                    <Alert 
                        severity="info" 
                        className="config-alert"
                    >
                        Select multiple floors (1-50) and sections (A-Z) for your stadium, then specify the number of rooms per floor.
                        Room numbers will be automatically generated based on these values.
                    </Alert>
                    
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Select Floors (1-50)"
                                value={formData.floors}
                                className="config-form-field"
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{
                                    multiple: true,
                                    displayEmpty: true,
                                    onChange: handleFloorChange,
                                    renderValue: (selected) => {
                                        if (!selected?.length) {
                                            return (
                                                <Typography variant="body2" color="text.secondary">
                                                    Select floors
                                                </Typography>
                                            );
                                        }

                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={`Floor ${value}`} size="small" />
                                                ))}
                                            </Box>
                                        );
                                    }
                                }}
                            >
                                {Room.getAvailableFloors().map((floor) => (
                                    <MenuItem key={floor.value} value={floor.value}>
                                        <Checkbox checked={formData.floors.indexOf(floor.value) > -1} />
                                        {floor.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Select Sections (A-Z)"
                                value={formData.sections}
                                className="config-form-field"
                                InputLabelProps={{ shrink: true }}
                                SelectProps={{
                                    multiple: true,
                                    displayEmpty: true,
                                    onChange: handleSectionChange,
                                    renderValue: (selected) => {
                                        if (!selected?.length) {
                                            return (
                                                <Typography variant="body2" color="text.secondary">
                                                    Select sections
                                                </Typography>
                                            );
                                        }

                                        return (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={`Section ${value.toUpperCase()}`} size="small" />
                                                ))}
                                            </Box>
                                        );
                                    }
                                }}
                            >
                                {Room.getAvailableSections().map((section) => (
                                    <MenuItem key={section.value} value={section.value}>
                                        <Checkbox checked={formData.sections.indexOf(section.value) > -1} />
                                        {section.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        
                        {/* Rooms per Floor Configuration */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Rooms per Floor Configuration
                            </Typography>
                            {formData.floors.length === 0 ? (
                                <Alert severity="warning">
                                    Please select at least one floor to configure rooms.
                                </Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {formData.floors.sort((a, b) => parseInt(a) - parseInt(b)).map(floor => (
                                        <Grid item xs={12} key={floor}>
                                            <TextField
                                                fullWidth
                                                label={`Floor ${floor} Rooms`}
                                                type="number"
                                                value={formData.roomsPerFloor[floor] || 0}
                                                onChange={(e) => handleRoomsPerFloorChange(floor, parseInt(e.target.value) || 0)}
                                                helperText="Number of rooms on this floor"
                                                className="config-form-field"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <RoomIcon sx={{ color: 'text.secondary' }} />
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box className="config-preview">
                                <Typography variant="subtitle2">
                                    <CalculateIcon className="preview-icon" />
                                    Configuration Preview:
                                </Typography>
                                <Typography className="format-example">
                                    Selected Floors: {formData.floors.length > 0 ? formData.floors.map(f => `F${f}`).join(', ') : 'None'}
                                </Typography>
                                <Typography className="format-example">
                                    Selected Sections: {formData.sections.length > 0 ? formData.sections.map(s => s.toUpperCase()).join(', ') : 'None'}
                                </Typography>
                                <Typography className="format-example">
                                    Room Number Format: {formData.sections.length > 0 ? '[Section][Floor][Room]' : '[Floor][Room]'}
                                    {formData.sections.length > 0 ? ' (e.g., A101, B205, C312)' : ' (e.g., 101, 205, 312)'}
                                </Typography>
                                <Divider />
                                <Box className="calculation-details">
                                    <Typography className="format-example">
                                        Total Rooms: {Room.getTotalRooms(formData.floors || [], formData.sections || [], formData.roomsPerFloor || {})} rooms
                                    </Typography>
                                    <Typography className="format-example">
                                        {formData.floors.length > 0
                                            ? (formData.sections.length > 0
                                                ? `Each section will have ${formData.floors.reduce((sum, floor) => sum + (formData.roomsPerFloor[floor] || 0), 0)} rooms across all floors`
                                                : `Total rooms across selected floors: ${formData.floors.reduce((sum, floor) => sum + (formData.roomsPerFloor[floor] || 0), 0)}`)
                                            : 'Please select floors to calculate totals'
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="config-dialog-actions">
                    <Button 
                        onClick={handleCloseDialog}
                        className="cancel-button"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveConfig} 
                        variant="contained"
                        className="save-button"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Rooms;
