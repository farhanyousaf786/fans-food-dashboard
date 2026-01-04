import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Snackbar, Alert, Divider, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { db } from '../../config/firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, updateDoc, where } from 'firebase/firestore';

const AddCategory = () => {
  const [icon, setIcon] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameHe, setNameHe] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [categories, setCategories] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editIcon, setEditIcon] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameHe, setEditNameHe] = useState('');
  const [shopData, setShopData] = useState(null);

  const reset = () => {
    setIcon('');
    setNameEn('');
    setNameHe('');
  };

  useEffect(() => {
    // Get current shop data from localStorage (for stadium context)
    const savedShopData = localStorage.getItem('currentShopData');
    if (savedShopData) {
      setShopData(JSON.parse(savedShopData));
    }
  }, []);

  useEffect(() => {
    // Live fetch categories ordered by English name, filtered by stadium if available
    let q;
    if (shopData?.stadiumId) {
      q = query(
        collection(db, 'categories'), 
        where('stadiumId', '==', shopData.stadiumId),
        orderBy('nameMap.en')
      );
    } else {
      q = query(collection(db, 'categories'), orderBy('nameMap.en'));
    }
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
      setCategories(list);
    }, (err) => {
      console.error('Error loading categories:', err);
    });
    return () => unsub();
  }, [shopData]);

  const openEdit = (cat) => {
    setEditing(cat);
    setEditIcon(cat.icon || '');
    setEditNameEn(cat?.nameMap?.en || '');
    setEditNameHe(cat?.nameMap?.he || '');
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'categories', editing.id), {
        icon: (editIcon || '').trim(),
        nameMap: {
          en: (editNameEn || '').trim(),
          he: (editNameHe || '').trim(),
        },
        docId: editing.docId || editing.id,
        stadiumId: editing.stadiumId || shopData?.stadiumId || null, // Preserve stadiumId
      });
      setToast({ open: true, message: 'Category updated.', severity: 'success' });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setToast({ open: true, message: err.message || 'Failed to update category', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!icon.trim() || !nameEn.trim() || !nameHe.trim()) {
      setToast({ open: true, message: 'Please fill all fields (Icon, English and Hebrew name).', severity: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const categoriesRef = collection(db, 'categories');
      const newDocRef = doc(categoriesRef); // create ID client-side so we can store it in the document

      const payload = {
        docId: newDocRef.id,
        icon: icon.trim(),
        nameMap: {
          en: nameEn.trim(),
          he: nameHe.trim(),
        },
        stadiumId: shopData?.stadiumId || null, // Add stadiumId if available
      };

      await setDoc(newDocRef, payload);

      setToast({ open: true, message: 'Category added successfully.', severity: 'success' });
      reset();
    } catch (err) {
      console.error('Error adding category:', err);
      setToast({ open: true, message: err.message || 'Failed to add category', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Add Category
      </Typography>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Create a new category with an icon and localized names. The document will be saved under the
          `categories` collection with fields: `docId`, `icon`, and `nameMap` (en, he).
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2} maxWidth={420}>
            <TextField
              label="Icon (emoji or short text)"
              placeholder="e.g. 🥤"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              inputProps={{ maxLength: 4 }}
              required
            />
            <TextField
              label="Name (English)"
              placeholder="e.g. Drinks"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              required
            />
            <TextField
              label="Name (Hebrew)"
              placeholder="e.g. משקאות / Hebre Drinks"
              value={nameHe}
              onChange={(e) => setNameHe(e.target.value)}
              required
            />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Category'}
              </Button>
              <Button type="button" variant="outlined" onClick={reset} disabled={loading}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Categories List */}
      <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Categories
        </Typography>
        {categories.length === 0 ? (
          <Typography color="text.secondary">No categories yet.</Typography>
        ) : (
          <List>
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="edit" onClick={() => openEdit(cat)}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${cat.icon || ''} ${cat?.nameMap?.en || ''}`.trim()}
                  secondary={cat?.nameMap?.he || ''}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Icon"
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              inputProps={{ maxLength: 4 }}
            />
            <TextField
              label="Name (English)"
              value={editNameEn}
              onChange={(e) => setEditNameEn(e.target.value)}
            />
            <TextField
              label="Name (Hebrew)"
              value={editNameHe}
              onChange={(e) => setEditNameHe(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddCategory;
