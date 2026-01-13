import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Close } from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AssignSectionsDialog = ({ open, onClose, user, stadiumId }) => {
  const [sections, setSections] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedShops, setSelectedShops] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize form with user's current assignments
  useEffect(() => {
    if (user) {
      setSelectedSections(user.sectionIds || []);
      setSelectedShops(user.shopIds || []);
    }
  }, [user]);



  // Fetch sections when stadium is available
  useEffect(() => {
    if (!stadiumId) {
      setSections([]);
      return;
    }

    const fetchSections = async () => {
      try {
        const sectionsRef = collection(db, 'stadiums', stadiumId, 'sections');
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
  }, [stadiumId]);

  // Fetch shops when stadium is available
  useEffect(() => {
    if (!stadiumId) {
      setShops([]);
      return;
    }

    const fetchShops = async () => {
      try {
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('stadiumId', '==', stadiumId));
        const shopsSnap = await getDocs(q);
        const shopsList = shopsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by name
        shopsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setShops(shopsList);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };

    fetchShops();
  }, [stadiumId]);



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

  const handleShopToggle = (shopId) => {
    setSelectedShops((prev) => {
      if (prev.includes(shopId)) {
        return prev.filter(id => id !== shopId);
      } else {
        return [...prev, shopId];
      }
    });
  };

  const handleRemoveShop = (shopId) => {
    setSelectedShops((prev) => prev.filter(id => id !== shopId));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'deliveryUsers', user.id), {
        stadiumId: stadiumId,
        sectionIds: selectedSections,
        shopIds: selectedShops,
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
    setSelectedSections([]);
    setSelectedShops([]);
    onClose();
  };

  const selectedStadiumName = 'Stadium';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign Stadium, Sections & Shops
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {user.firstName} {user.lastName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>


          {/* Available Sections */}
          {stadiumId && (
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

          {/* Available Shops */}
          {stadiumId && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Shops (Click to add)
              </Typography>
              <Box sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                maxHeight: 200,
                overflowY: 'auto',
                bgcolor: '#fafafa'
              }}>
                {shops.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                    No shops available
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {shops
                      .filter(shop => !selectedShops.includes(shop.id))
                      .map((shop) => (
                        <Chip
                          key={shop.id}
                          label={shop.name}
                          onClick={() => handleShopToggle(shop.id)}
                          sx={{ cursor: 'pointer' }}
                          color="secondary"
                        />
                      ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Selected Shops */}
          {selectedShops.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Assigned Shops
              </Typography>
              <Box sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                bgcolor: '#f5f5f5'
              }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedShops.map((shopId) => {
                    const shop = shops.find(s => s.id === shopId);
                    return (
                      <Chip
                        key={shopId}
                        label={shop ? shop.name : shopId}
                        onDelete={() => handleRemoveShop(shopId)}
                        color="secondary"
                        variant="filled"
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Current Assignment Summary */}
          {stadiumId && (
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
              <Typography variant="body2" color="text.secondary">
                <strong>Shops:</strong> {selectedShops.length} selected
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
          disabled={loading || !stadiumId}
        >
          {loading ? 'Saving...' : 'Save Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignSectionsDialog;
