import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    photoURL: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.uid) {
          const docRef = doc(db, 'admins', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData({
              displayName: user.displayName || '',
              email: user.email || '',
              phone: data.phone || '',
              address: data.address || '',
              description: data.description || '',
              photoURL: user.photoURL || ''
            });
            setPhotoPreview(user.photoURL || '');
          }
        }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let photoURL = profileData.photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profile-photos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, 'admins', user.uid);
      await updateDoc(docRef, {
        displayName: profileData.displayName,
        phone: profileData.phone,
        address: profileData.address,
        description: profileData.description,
        photoURL,
        updatedAt: new Date().toISOString()
      });

      // Update user profile
      await user.updateProfile({
        displayName: profileData.displayName,
        photoURL
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setPhotoFile(null);
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setError('Failed to log out');
    }
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative', mr: 3 }}>
            <Avatar
              src={photoPreview || profileData.photoURL}
              sx={{ width: 100, height: 100 }}
            />
            {isEditing && (
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  backgroundColor: 'white',
                  boxShadow: 1,
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
                component="label"
              >
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <PhotoCameraIcon />
              </IconButton>
            )}
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              Profile Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your account information
            </Typography>
          </Box>
          {!isEditing && (
            <IconButton
              onClick={() => setIsEditing(true)}
              sx={{ ml: 'auto' }}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <TextField
              label="Display Name"
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              name="email"
              value={profileData.email}
              disabled
              fullWidth
            />

            <TextField
              label="Phone"
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
            />

            <TextField
              label="Address"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              fullWidth
            />

            <TextField
              label="Description"
              name="description"
              value={profileData.description}
              onChange={handleInputChange}
              disabled={!isEditing}
              multiline
              rows={4}
              fullWidth
            />

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditing(false);
                    setPhotoFile(null);
                    setPhotoPreview(profileData.photoURL);
                  }}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Box>
        </form>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
