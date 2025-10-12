import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Divider, Stack } from '@mui/material';
import StadiumSections from './components/StadiumSections';

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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Shops in this Stadium</Typography>
                <Chip color="primary" label={`Total: ${shops.length}`} />
              </Stack>
              {shops.length === 0 ? (
                <Typography color="text.secondary">No shops yet in this stadium.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {shops.map((shop) => (
                    <Grid item xs={12} sm={6} key={shop.id}>
                      <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => navigate('/dashboard', { state: { shopData: shop } })}>
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{shop.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>📍 {shop.location}</Typography>
                          <Typography variant="body2" color="text.secondary">🚪 Gate {shop.gate} • Floor {shop.floor}</Typography>
                          {shop.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>{shop.description}</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stadium Structure Section extracted into component */}
        <Grid item xs={12}>
          <StadiumSections stadiumId={id} shops={shops} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Stadium;
