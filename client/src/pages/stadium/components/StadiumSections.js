import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import './StadiumSections.css';

const cardSx = {
  height: 260,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: 260,
};

const StadiumSections = ({ stadiumId, shops }) => {
  const [sections, setSections] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ sectionName: '', sectionNo: '', rows: '', column: '', shops: [] });

  // Subscribe to sections
  useEffect(() => {
    if (!stadiumId) return;
    const sectionsRef = collection(db, 'stadiums', stadiumId, 'sections');
    const unsub = onSnapshot(sectionsRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) => (Number(a.sectionNo || 0) - Number(b.sectionNo || 0)) || String(a.sectionName || '').localeCompare(String(b.sectionName || ''))
      );
      setSections(list);
    });
    return () => unsub();
  }, [stadiumId]);

  const shopOptions = useMemo(() => shops || [], [shops]);

  const resetForm = () => setForm({ sectionName: '', sectionNo: '', rows: '', column: '', shops: [] });

  const [dragIndex, setDragIndex] = useState(null);
  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setForm((prev) => {
      const arr = [...prev.shops];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(index, 0, moved);
      return { ...prev, shops: arr };
    });
    setDragIndex(null);
  };

  const handleSave = async () => {
    try {
      const ref = collection(db, 'stadiums', stadiumId, 'sections');
      const payload = {
        sectionName: form.sectionName || '',
        sectionNo: Number(form.sectionNo) || 0,
        rows: Number(form.rows) || 0,
        column: Number(form.column) || 0,
        shops: Array.isArray(form.shops) ? form.shops : [],
        createdAt: new Date(),
      };
      const docRef = await addDoc(ref, payload);
      await updateDoc(doc(db, 'stadiums', stadiumId, 'sections', docRef.id), { sectionId: docRef.id, docId: docRef.id });
      setAddOpen(false);
      resetForm();
    } catch (e) {
      console.error('Error saving section:', e);
    }
  };

  const handleUpdate = async () => {
    if (!current) return;
    try {
      const ref = doc(db, 'stadiums', stadiumId, 'sections', current.id);
      const payload = {
        sectionName: form.sectionName || '',
        sectionNo: Number(form.sectionNo) || 0,
        rows: Number(form.rows) || 0,
        column: Number(form.column) || 0,
        shops: Array.isArray(form.shops) ? form.shops : [],
        updatedAt: new Date(),
        // Ensure identifiers are persisted and in sync
        docId: current.id,
        sectionId: current.sectionId || current.id,
      };
      await updateDoc(ref, payload);
      setEditOpen(false);
      setCurrent(null);
      resetForm();
    } catch (e) {
      console.error('Error updating section:', e);
    }
  };

  const handleDelete = async () => {
    if (!current) return;
    try {
      await deleteDoc(doc(db, 'stadiums', stadiumId, 'sections', current.id));
      setDeleteOpen(false);
      setCurrent(null);
    } catch (e) {
      console.error('Error deleting section:', e);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" className="section-header" sx={{ mb: 3, gap: 2 }}>
        <Typography variant="h6">Stadium Structure</Typography>
        <Button className="add-section-btn" variant="contained" onClick={() => setAddOpen(true)}>Add Section</Button>
      </Stack>

      {sections.length === 0 ? (
        <Typography color="text.secondary">No sections added yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {sections.map((s) => (
            <Grid item xs={12} md={6} lg={4} key={s.id} sx={{ display: 'flex' }}>
              <Card sx={cardSx} className="section-card">
                <CardContent className="section-card__content">
                  <Stack direction="row" alignItems="center" justifyContent="space-between" className="section-card__header">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.sectionName || 'Unnamed section'}
                    </Typography>
                    {typeof s.sectionNo !== 'undefined' && <Chip className="section-card__badge" label={`#${s.sectionNo}`} size="small" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Rows: {s.rows ?? '-'} • Columns: {s.column ?? '-'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" className="section-card__shops-title">Shops</Typography>
                  <Box className="section-card__shops" sx={{ flexGrow: 1 }}>
                    {Array.isArray(s.shops) && s.shops.length > 0 ? (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {s.shops.map((shopId) => {
                          const shop = shopOptions.find((x) => x.id === shopId);
                          return <Chip key={shopId} label={shop ? shop.name : shopId} size="small" />;
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No shops linked</Typography>
                    )}
                  </Box>
                  <Stack direction="row" justifyContent="flex-end" gap={1} className="section-card__actions">
                    <Button size="small" variant="outlined" onClick={() => {
                      setCurrent(s);
                      setForm({
                        sectionName: s.sectionName || '',
                        sectionNo: s.sectionNo ?? '',
                        rows: s.rows ?? '',
                        column: s.column ?? '',
                        shops: Array.isArray(s.shops) ? s.shops : [],
                      });
                      setEditOpen(true);
                    }}>Edit</Button>
                    <Button size="small" color="error" onClick={() => { setCurrent(s); setDeleteOpen(true); }}>Delete</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Stadium Section</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Section Name" fullWidth value={form.sectionName} onChange={(e) => setForm({ ...form, sectionName: e.target.value })} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <TextField margin="dense" label="Section No" type="number" fullWidth value={form.sectionNo} onChange={(e) => setForm({ ...form, sectionNo: e.target.value })} />
            <TextField margin="dense" label="Rows" type="number" fullWidth value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} />
            <TextField margin="dense" label="Columns" type="number" fullWidth value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })} />
          </Stack>
          <Autocomplete
            multiple
            options={shopOptions}
            getOptionLabel={(option) => option.name || option.id}
            value={shopOptions.filter((s) => form.shops.includes(s.id))}
            onChange={(e, value) => setForm({ ...form, shops: value.map((v) => v.id) })}
            renderInput={(params) => <TextField {...params} label="Shops" margin="dense" placeholder="Select shops for this section" />}
            sx={{ mt: 1 }}
          />
          {form.shops.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Order of Shops (drag to reorder)</Typography>
              <Stack spacing={1}>
                {form.shops.map((shopId, idx) => {
                  const shop = shopOptions.find((s) => s.id === shopId);
                  return (
                    <Box
                      key={shopId}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'grab',
                      }}
                    >
                      <Chip label={shop ? shop.name : shopId} />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.sectionName}>Save Section</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Stadium Section</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Section Name" fullWidth value={form.sectionName} onChange={(e) => setForm({ ...form, sectionName: e.target.value })} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <TextField margin="dense" label="Section No" type="number" fullWidth value={form.sectionNo} onChange={(e) => setForm({ ...form, sectionNo: e.target.value })} />
            <TextField margin="dense" label="Rows" type="number" fullWidth value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} />
            <TextField margin="dense" label="Columns" type="number" fullWidth value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })} />
          </Stack>
          <Autocomplete
            multiple
            options={shopOptions}
            getOptionLabel={(option) => option.name || option.id}
            value={shopOptions.filter((s) => form.shops.includes(s.id))}
            onChange={(e, value) => setForm({ ...form, shops: value.map((v) => v.id) })}
            renderInput={(params) => <TextField {...params} label="Shops" margin="dense" placeholder="Select shops for this section" />}
            sx={{ mt: 1 }}
          />
          {form.shops.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Order of Shops (drag to reorder)</Typography>
              <Stack spacing={1}>
                {form.shops.map((shopId, idx) => {
                  const shop = shopOptions.find((s) => s.id === shopId);
                  return (
                    <Box
                      key={shopId}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(idx)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'grab',
                      }}
                    >
                      <Chip label={shop ? shop.name : shopId} />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={!form.sectionName}>Update Section</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Section</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the section "{current?.sectionName}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StadiumSections;
