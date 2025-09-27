import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Box, Typography, Card, CardContent, CardMedia, Grid, Chip, Button, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

const Stadium = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stadium, setStadium] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    sectionName: '',
    sectionNo: '',
    rows: '',
    column: '',
    shops: [] // array of shop ids
  });

  useEffect(() => {
    let unsub = () => {};
    const fetchData = async () => {
      try {
        // Load stadium
        const stadiumRef = doc(db, 'stadiums', id);
        const stadiumSnap = await getDoc(stadiumRef);
        if (stadiumSnap.exists()) {
          setStadium({ id, ...stadiumSnap.data() });
        }

        // Load shops under this stadium
        const shopsRef = collection(db, 'shops');
        const q = query(shopsRef, where('stadiumId', '==', id));
        const shopsSnap = await getDocs(q);
        const list = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setShops(list);

        // Subscribe to sections subcollection for live updates
        const sectionsRef = collection(db, 'stadiums', id, 'sections');
        unsub = onSnapshot(sectionsRef, (snap) => {
          const sec = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Optional: sort by sectionNo then name
          sec.sort((a,b) => (Number(a.sectionNo||0) - Number(b.sectionNo||0)) || String(a.sectionName||'').localeCompare(String(b.sectionName||'')));
          setSections(sec);
        });
      } catch (e) {
        console.error('Error loading stadium details:', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">Loading...</Typography>
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
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {stadium.imageUrl && (
              <CardMedia component="img" height="200" image={stadium.imageUrl} alt={stadium.name} />
            )}
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.2}>
                <Typography color="text.secondary">📍 {stadium.location}</Typography>
                {typeof stadium.capacity !== 'undefined' && (
                  <Typography color="text.secondary">👥 {Number(stadium.capacity).toLocaleString()} seats</Typography>
                )}
                {(stadium.latitude && stadium.longitude) && (
                  <Typography color="text.secondary">🌐 {Number(stadium.latitude).toFixed(4)}, {Number(stadium.longitude).toFixed(4)}</Typography>
                )}
              </Stack>
              {stadium.about && (
                <Typography sx={{ mt: 2 }}>
                  {stadium.about}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
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

        {/* Stadium Structure Section */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Stadium Structure</Typography>
                <Button variant="contained" onClick={() => setAddOpen(true)}>Add Section</Button>
              </Stack>
              {sections.length === 0 ? (
                <Typography color="text.secondary">No sections added yet.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {sections.map((s) => (
                    <Grid item xs={12} md={6} lg={4} key={s.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.sectionName || 'Unnamed section'}</Typography>
                            {typeof s.sectionNo !== 'undefined' && (
                              <Chip label={`#${s.sectionNo}`} size="small" />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Rows: {s.rows ?? '-'} • Columns: {s.column ?? '-'}
                          </Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="body2" sx={{ mb: 0.5 }}>Shops</Typography>
                          {Array.isArray(s.shops) && s.shops.length > 0 ? (
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {s.shops.map((shopId) => {
                                const shop = shops.find(x => x.id === shopId);
                                return <Chip key={shopId} label={shop ? shop.name : shopId} />;
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No shops linked</Typography>
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
      </Grid>

      {/* Add Section Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Stadium Section</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            fullWidth
            value={form.sectionName}
            onChange={(e) => setForm({ ...form, sectionName: e.target.value })}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <TextField
              margin="dense"
              label="Section No"
              type="number"
              fullWidth
              value={form.sectionNo}
              onChange={(e) => setForm({ ...form, sectionNo: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Rows"
              type="number"
              fullWidth
              value={form.rows}
              onChange={(e) => setForm({ ...form, rows: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Columns"
              type="number"
              fullWidth
              value={form.column}
              onChange={(e) => setForm({ ...form, column: e.target.value })}
            />
          </Stack>
          <Autocomplete
            multiple
            options={shops}
            getOptionLabel={(option) => option.name || option.id}
            value={shops.filter(s => form.shops.includes(s.id))}
            onChange={(e, value) => setForm({ ...form, shops: value.map(v => v.id) })}
            renderInput={(params) => (
              <TextField {...params} label="Shops" margin="dense" placeholder="Select shops for this section" />
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const sectionsRef = collection(db, 'stadiums', id, 'sections');
                const payload = {
                  sectionName: form.sectionName || '',
                  sectionNo: Number(form.sectionNo) || 0,
                  rows: Number(form.rows) || 0,
                  column: Number(form.column) || 0,
                  shops: Array.isArray(form.shops) ? form.shops : [],
                  createdAt: new Date()
                };
                const docRef = await addDoc(sectionsRef, payload);
                // Persist id inside document as sectionId
                await updateDoc(doc(db, 'stadiums', id, 'sections', docRef.id), { sectionId: docRef.id });
                setAddOpen(false);
                setForm({ sectionName: '', sectionNo: '', rows: '', column: '', shops: [] });
              } catch (e) {
                console.error('Error adding section:', e);
              }
            }}
            disabled={!form.sectionName}
          >
            Save Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Stadium;
