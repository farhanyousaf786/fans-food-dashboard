import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Close } from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AssignSectionsDialog = ({ open, onClose, user }) => {
  const [stadiums, setStadiums] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize form with user's current assignments
  useEffect(() => {
    if (user) {
      setSelectedStadium(user.stadiumId || '');
      setSelectedSections(user.sectionIds || []);
    }
  }, [user]);

  // Fetch stadiums on mount
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const stadiumsRef = collection(db, 'stadiums');
        const stadiumsSnap = await getDocs(stadiumsRef);
        const stadiumsList = stadiumsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setStadiums(stadiumsList);
      } catch (error) {
        console.error('Error fetching stadiums:', error);
      }
    };
    fetchStadiums();
  }, []);

  // Fetch sections when stadium is selected
  useEffect(() => {
    if (!selectedStadium) {
      setSections([]);
      return;
    }
    
    const fetchSections = async () => {
      try {
        const sectionsRef = collection(db, 'stadiums', selectedStadium, 'sections');
        const sectionsSnap = await getDocs(sectionsRef);
        const sectionsList = sectionsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        // Sort by section number
        sectionsList.sort((a, b) => (a.sectionNo || 0) - (b.sectionNo || 0));
        setSections(sectionsList);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    
    fetchSections();
  }, [selectedStadium]);

  const handleStadiumChange = (event) => {
    setSelectedStadium(event.target.value);
    setSelectedSections([]); // Reset sections when stadium changes
  };

  const handleSectionToggle = (sectionId) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setSelectedSections((prev) => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  const handleMoveDown = (index) => {
    if (index === selectedSections.length - 1) return;
    setSelectedSections((prev) => {
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  };

  const handleRemoveSection = (sectionId) => {
    setSelectedSections((prev) => prev.filter(id => id !== sectionId));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'deliveryUsers', user.id), {
        stadiumId: selectedStadium,
        sectionIds: selectedSections,
        updatedAt: new Date(),
      });
      onClose();
    } catch (error) {
      console.error('Error updating assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStadium('');
    setSelectedSections([]);
    onClose();
  };

  const selectedStadiumName = stadiums.find(s => s.id === selectedStadium)?.name || '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign Stadium & Sections
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {user.firstName} {user.lastName}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Stadium Selection */}
          <FormControl fullWidth>
            <InputLabel>Stadium</InputLabel>
            <Select
              value={selectedStadium}
              onChange={handleStadiumChange}
              label="Stadium"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {stadiums.map((stadium) => (
                <MenuItem key={stadium.id} value={stadium.id}>
                  {stadium.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Available Sections */}
          {selectedStadium && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Sections (Click to add)
              </Typography>
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 1, 
                maxHeight: 200, 
                overflowY: 'auto',
                bgcolor: '#fafafa'
              }}>
                {sections.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                    No sections available
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {sections
                      .filter(section => !selectedSections.includes(section.id))
                      .map((section) => (
                        <Chip
                          key={section.id}
                          label={section.sectionName}
                          onClick={() => handleSectionToggle(section.id)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Selected Sections with Priority */}
          {selectedSections.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Assigned Sections (Priority Order)
              </Typography>
              <List sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                bgcolor: '#f5f5f5',
                p: 0
              }}>
                {selectedSections.map((sectionId, index) => {
                  const section = sections.find(s => s.id === sectionId);
                  return (
                    <ListItem
                      key={sectionId}
                      sx={{ 
                        borderBottom: index < selectedSections.length - 1 ? '1px solid #e0e0e0' : 'none',
                        bgcolor: '#fff',
                        mb: index < selectedSections.length - 1 ? 0.5 : 0
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUpward fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveDown(index)}
                            disabled={index === selectedSections.length - 1}
                          >
                            <ArrowDownward fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveSection(sectionId)}
                            color="error"
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color="primary"
                          sx={{ minWidth: 40 }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {section ? section.sectionName : sectionId}
                          </Typography>
                          {section && (
                            <Typography variant="caption" color="text.secondary">
                              Section #{section.sectionNo} • {section.rows}x{section.column}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Current Assignment Summary */}
          {selectedStadium && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Assignment Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Stadium:</strong> {selectedStadiumName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Sections:</strong> {selectedSections.length} selected
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || !selectedStadium}
        >
          {loading ? 'Saving...' : 'Save Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignSectionsDialog;
