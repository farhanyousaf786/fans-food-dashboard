import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Snackbar, Alert, Divider } from '@mui/material';
import { db } from '../../config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const AddCategory = () => {
  const [icon, setIcon] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameHe, setNameHe] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const reset = () => {
    setIcon('');
    setNameEn('');
    setNameHe('');
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
