import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const APP_CONFIG_COLLECTION = 'appConfig';
const APP_CONFIG_ID = 'global';

const Manage = () => {
  const [useTestApis, setUseTestApis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_ID));
        if (snap.exists()) {
          setUseTestApis(!!snap.data().useTestApis);
        }
      } catch (err) {
        console.error('Failed to load app config:', err);
        setError('Could not load app configuration.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleToggle = async (event) => {
    const nextValue = event.target.checked;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await setDoc(
        doc(db, APP_CONFIG_COLLECTION, APP_CONFIG_ID),
        {
          useTestApis: nextValue,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setUseTestApis(nextValue);
      setSuccess(
        nextValue
          ? 'Test APIs enabled. The app will use Stripe test mode.'
          : 'Live APIs enabled. The app will process real payments.'
      );
    } catch (err) {
      console.error('Failed to update app config:', err);
      setError('Could not save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        App Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Control whether the Fan Munch app uses test or live payment APIs.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6">Payment API Mode</Typography>
            <Typography variant="body2" color="text.secondary">
              Switch ON for test APIs. Switch OFF for live APIs.
            </Typography>
          </Box>
          <Chip
            label={useTestApis ? 'TEST MODE' : 'LIVE MODE'}
            color={useTestApis ? 'warning' : 'success'}
            variant="filled"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={useTestApis}
              onChange={handleToggle}
              disabled={saving}
              color="warning"
            />
          }
          label={useTestApis ? 'Use test APIs (ON)' : 'Use live APIs (OFF)'}
        />

        {useTestApis && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Test mode is active. Payments use Stripe test cards and no real money is charged.
          </Alert>
        )}

        {!useTestApis && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Live mode is active. Real payments will be processed through Stripe.
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Changes apply to the live app within about 10 seconds — no server restart needed on Heroku.
          Users may need to refresh the checkout page.
        </Alert>

        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Box>
  );
};

export default Manage;
