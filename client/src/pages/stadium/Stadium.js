import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Divider, Stack, IconButton, Collapse, TextField, Alert } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import StadiumSections from './sections/StadiumSections';
import MyShopsSection from './shops/MyShopsSection';
import PickUpPoints from './pickup_points/PickUpPoints';
// import Rooms from './rooms/Rooms';
import Floors from '../../models/Floors';
import DeliveryUsers from '../admin/components/DeliveryUsers';

const Stadium = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stadium, setStadium] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopsExpanded, setShopsExpanded] = useState(true);
  const [stadiumExpanded, setStadiumExpanded] = useState(true);
  const [deliveryExpanded, setDeliveryExpanded] = useState(true);
  // Add state for new sections
  // const [roomsExpanded, setRoomsExpanded] = useState(true);
  const [sectionsExpanded, setSectionsExpanded] = useState(true);
  const [pickupPointsExpanded, setPickupPointsExpanded] = useState(true);
  const [standsExpanded, setStandsExpanded] = useState(true);
  const [floorsExpanded, setFloorsExpanded] = useState(true);
  const [floorsCount, setFloorsCount] = useState(0);
  const [floorsSaving, setFloorsSaving] = useState(false);
  const [floorsError, setFloorsError] = useState('');
  const [floorsSaved, setFloorsSaved] = useState(false);
  const shopsRef = collection(db, 'shops');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load stadium
        const stadiumRef = doc(db, 'stadiums', id);
        const stadiumSnap = await getDoc(stadiumRef);
        if (stadiumSnap.exists()) {
          const stadiumData = stadiumSnap.data();
          setStadium({ id, ...stadiumData });
          setFloorsCount(typeof stadiumData.floors === 'number' ? stadiumData.floors : parseInt(stadiumData.floors, 10) || 0);
        }

        // Load shops under this stadium
        const q = query(shopsRef, where('stadiumId', '==', id));
        const shopsSnap = await getDocs(q);
        const list = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setShops(list);
      } catch (e) {
        console.error('Error loading stadium details:', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
      </Box>
    );
  }

  if (!stadium) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Stadium not found</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box>
        {/* Shops Section - Only show if shops are available */}
        {stadium.availableShops && (
          <Box sx={{ mb: 3 }}>
            <Card 
              sx={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <CardContent sx={{ 
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.3)', 
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShopsExpanded(!shopsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>All Shops</Typography>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShopsExpanded(!shopsExpanded);
                    }}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: shopsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {shopsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={shopsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2, mx: -3, px: 3 }}>
                    <MyShopsSection />
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}
        
        {/* Sections Section - Only show if sections are available */}
        {stadium.availableSections && (
          <Box sx={{ mb: 3 }}>
            <Card 
              sx={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <CardContent sx={{ 
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.3)', 
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSectionsExpanded(!sectionsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Stadium Sections</Typography>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSectionsExpanded(!sectionsExpanded);
                    }}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: sectionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {sectionsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={sectionsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <StadiumSections stadiumId={id} shops={shops} />
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Stadium Rooms - temporarily disabled */}
        {/*
        {stadium.availableRooms && (
          <Box sx={{ mb: 3 }}>
            <Card sx={{ transition: 'all 0.2s ease' }}>
              <CardContent
                sx={{
                  p: 3,
                  bgcolor: 'rgba(25, 118, 210, 0.3)',
                  '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setRoomsExpanded(!roomsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Stadium Rooms
                  </Typography>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoomsExpanded(!roomsExpanded);
                    }}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: roomsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    >
                      {roomsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={roomsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                      <CardContent sx={{ p: 0 }}>
                        <Rooms stadiumId={id} />
                      </CardContent>
                    </Card>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}
        */}

        {/* Pick-up Points Section - Only show if pick-up points are available */}
        {stadium.availablePickupPoints && (
          <Box sx={{ mb: 3 }}>
            <Card 
              sx={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <CardContent sx={{ 
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.3)', 
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPickupPointsExpanded(!pickupPointsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Pick-up Points</Typography>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickupPointsExpanded(!pickupPointsExpanded);
                    }}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: pickupPointsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {pickupPointsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={pickupPointsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                      <CardContent sx={{ p: 0 }}>
                        <PickUpPoints stadiumId={id} />
                      </CardContent>
                    </Card>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Stands Section - Only show if stands are available */}
        {stadium.availableStands && (
          <Box sx={{ mb: 3 }}>
            <Card 
              sx={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <CardContent sx={{ 
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.3)', 
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setStandsExpanded(!standsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Stadium Stands</Typography>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      setStandsExpanded(!standsExpanded);
                    }}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: standsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {standsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={standsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Stadium stands management will be implemented here.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Floors Section - Only show if floors are available */}
        {stadium.availableFloors && (
          <Box sx={{ mb: 3 }}>
            <Card 
              sx={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <CardContent sx={{ 
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.3)', 
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setFloorsExpanded(!floorsExpanded)}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Stadium Floors</Typography>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloorsExpanded(!floorsExpanded);
                    }}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ 
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: floorsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      {floorsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                  </IconButton>
                </Box>
                <Collapse in={floorsExpanded} timeout={300} unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                      <CardContent>
                        {floorsError ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {floorsError}
                          </Alert>
                        ) : null}

                        {floorsSaved ? (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            Floors saved.
                          </Alert>
                        ) : null}

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <TextField
                            label="Total Floors"
                            type="number"
                            value={floorsCount}
                            onChange={(e) => {
                              setFloorsSaved(false);
                              setFloorsError('');
                              setFloorsCount(parseInt(e.target.value, 10) || 0);
                            }}
                            inputProps={{ min: 0 }}
                            sx={{ minWidth: 220 }}
                            helperText="Example: 5"
                          />
                          <Button
                            variant="contained"
                            disabled={floorsSaving}
                            onClick={async () => {
                              try {
                                setFloorsSaving(true);
                                setFloorsError('');
                                setFloorsSaved(false);

                                const stadiumRef = doc(db, 'stadiums', id);
                                const model = new Floors(floorsCount, id);
                                await updateDoc(stadiumRef, model.toFirestore());

                                setStadium((prev) => (prev ? { ...prev, floors: model.floors } : prev));
                                setFloorsSaved(true);
                              } catch (e) {
                                console.error('Error saving stadium floors:', e);
                                setFloorsError(e?.message || 'Failed to save floors.');
                              } finally {
                                setFloorsSaving(false);
                              }
                            }}
                          >
                            {floorsSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Delivery Users Section - ALWAYS AVAILABLE - BOTTOM */}
        <Box>
          <Card 
            sx={{ 
              transition: 'all 0.2s ease'
            }}
          >
            <CardContent sx={{ 
              p: 3,
              bgcolor: 'rgba(25, 118, 210, 0.3)', 
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
            }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setDeliveryExpanded(!deliveryExpanded)}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Delivery Personnel</Typography>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeliveryExpanded(!deliveryExpanded);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { 
                      color: 'primary.main',
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  <Box sx={{ 
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: deliveryExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    {deliveryExpanded ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </IconButton>
              </Box>
              <Collapse in={deliveryExpanded} timeout={300} unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                    <CardContent>
                      <DeliveryUsers stadiumId={id} showAll={false} />
                    </CardContent>
                  </Card>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Stadium;
