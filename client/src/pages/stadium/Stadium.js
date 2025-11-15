import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Divider, Stack, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import StadiumSections from './components/StadiumSections';
import MyShopsSection from './components/MyShopsSection';
import DeliveryUsers from '../admin/components/DeliveryUsers';

const Stadium = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stadium, setStadium] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopsExpanded, setShopsExpanded] = useState(false);
  const [stadiumExpanded, setStadiumExpanded] = useState(false);
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
  const shopsRef = collection(db, 'shops');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load stadium
        const stadiumRef = doc(db, 'stadiums', id);
        const stadiumSnap = await getDoc(stadiumRef);
        if (stadiumSnap.exists()) {
          setStadium({ id, ...stadiumSnap.data() });
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
        {/* My Shops Section - TOP */}
        <Box sx={{ mb: 3 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setShopsExpanded(!shopsExpanded)}
          >
            <CardContent sx={{ 
              p: 3,
              bgcolor: 'rgba(25, 118, 210, 0.3)', 
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>All Shops</Typography>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShopsExpanded(!shopsExpanded);
                  }}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  {shopsExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={shopsExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, mx: -3, px: 3 }}>
                  <MyShopsSection />
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>
        
        {/* Stadium Structure Section - MIDDLE */}
        <Box sx={{ mb: 3 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setStadiumExpanded(!stadiumExpanded)}
          >
            <CardContent sx={{ 
              p: 3,
              bgcolor: 'rgba(25, 118, 210, 0.3)', 
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Stadium Sections</Typography>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    setStadiumExpanded(!stadiumExpanded);
                  }}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  {stadiumExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={stadiumExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  <StadiumSections stadiumId={id} shops={shops} />
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* Delivery Users Section - BOTTOM */}
        <Box>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setDeliveryExpanded(!deliveryExpanded)}
          >
            <CardContent sx={{ 
              p: 3,
              bgcolor: 'rgba(25, 118, 210, 0.3)', 
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.4)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Delivery Personnel</Typography>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeliveryExpanded(!deliveryExpanded);
                  }}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  {deliveryExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={deliveryExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ borderRadius: 2, bgcolor: 'white' }}>
                    <CardContent>
                      <DeliveryUsers stadiumId={id} showAll={true} />
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
