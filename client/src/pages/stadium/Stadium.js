import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Divider, Stack } from '@mui/material';
import StadiumSections from './components/StadiumSections';
import MyShopsSection from './components/MyShopsSection';
import DeliveryUsers from '../admin/components/DeliveryUsers';

const Stadium = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stadium, setStadium] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{stadium.name}</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
      </Stack>

{/* My Shops Section */}
        <Grid item xs={12}>
          <MyShopsSection />
        </Grid>
      <Grid container spacing={3}>
        
        {/* Stadium Structure Section extracted into component */}
        <Grid item xs={12}>
          <StadiumSections stadiumId={id} shops={shops} />
        </Grid>

        

        {/* Delivery Users Section */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Delivery Personnel for this Stadium</Typography>
              <DeliveryUsers stadiumId={id} showAll={true} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Stadium;
