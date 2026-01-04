import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, db } from '../../../config/firebase';
import User from '../../../models/User';
import Stadium from '../../../models/Stadium';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'shopowner',
    stadiumId: ''
  });

  // Fetch all users from both collections
  useEffect(() => {
    fetchUsers();
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const stadiumsRef = collection(db, 'stadiums');
      const stadiumsSnap = await getDocs(stadiumsRef);
      const stadiumsList = stadiumsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setStadiums(stadiumsList);
    } catch (error) {
      console.error('Error fetching stadiums:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = [];

      // Fetch from admins collection
      const adminsRef = collection(db, 'admins');
      const adminsSnap = await getDocs(adminsRef);
      adminsSnap.forEach(doc => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          ...userData,
          role: 'admin',
          collection: 'admins'
        });
      });

      // Fetch from shopowners collection
      const shopownersRef = collection(db, 'shopowners');
      const shopownersSnap = await getDocs(shopownersRef);
      shopownersSnap.forEach(doc => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          ...userData,
          role: 'shopowner',
          collection: 'shopowners'
        });
      });

      // Fetch from deliveryUsers collection
      const deliveryRef = collection(db, 'deliveryUsers');
      const deliverySnap = await getDocs(deliveryRef);
      deliverySnap.forEach(doc => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          ...userData,
          role: 'delivery',
          collection: 'deliveryUsers'
        });
      });

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditMode(true);
      setCurrentUser(user);
      setFormData({
        name: user.name || user.firstName + ' ' + user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'shopowner',
        stadiumId: user.stadiumId || ''
      });
    } else {
      setEditMode(false);
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'shopowner',
        stadiumId: ''
      });
    }
    setDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '', role: 'shopowner', stadiumId: '' });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getCollectionName = (role) => {
    switch (role) {
      case 'admin':
        return 'admins';
      case 'shopowner':
        return 'shopowners';
      case 'delivery':
        return 'deliveryUsers';
      default:
        return 'shopowners';
    }
  };

  const handleSaveUser = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.name || !formData.email) {
        setError('Name and email are required');
        return;
      }

      if (!editMode && !formData.password) {
        setError('Password is required for new users');
        return;
      }

      const collectionName = getCollectionName(formData.role);

      if (editMode) {
        // Update existing user
        const userRef = doc(db, currentUser.collection, currentUser.id);
        
        let updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          stadiumId: formData.stadiumId,
          updatedAt: new Date()
        };

        // For delivery users, split name into firstName and lastName
        if (formData.role === 'delivery') {
          const nameParts = formData.name.split(' ');
          updateData.firstName = nameParts[0] || '';
          updateData.lastName = nameParts.slice(1).join(' ') || '';
        }

        await updateDoc(userRef, updateData);

        // If role changed, move to different collection
        if (currentUser.collection !== collectionName) {
          // Create in new collection
          await setDoc(doc(db, collectionName, currentUser.id), {
            ...updateData,
            createdAt: currentUser.createdAt || new Date()
          });
          
          // Delete from old collection
          await deleteDoc(doc(db, currentUser.collection, currentUser.id));
        }

        setSuccess('User updated successfully');
      } else {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        let userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          stadiumId: formData.stadiumId,
          createdAt: new Date()
        };

        // For delivery users, split name into firstName and lastName
        if (formData.role === 'delivery') {
          const nameParts = formData.name.split(' ');
          userData = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: formData.email,
            phone: '',
            isActive: true,
            stadiumId: formData.stadiumId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }

        // Store in appropriate collection
        await setDoc(doc(db, collectionName, userCredential.user.uid), userData);

        setSuccess('User created successfully');
      }

      // Refresh users list
      await fetchUsers();
      handleCloseDialog();

    } catch (error) {
      console.error('Error saving user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else {
        setError(error.message || 'Failed to save user');
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user: ${user.name || user.firstName + ' ' + user.lastName}?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, user.collection, user.id));
      
      setSuccess('User deleted successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'shopowner':
        return 'primary';
      case 'delivery':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={`${user.collection}-${user.id}`}>
                <TableCell>
                  {user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A')}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteUser(user)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
              disabled={editMode} // Don't allow email changes in edit mode
            />
            
            {!editMode && (
              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            )}
            
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="shopowner">Shop Owner</MenuItem>
                <MenuItem value="delivery">Delivery Personnel</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Stadium</InputLabel>
              <Select
                name="stadiumId"
                value={formData.stadiumId}
                onChange={handleInputChange}
                label="Stadium"
              >
                <MenuItem value="">No Stadium</MenuItem>
                {stadiums.map((stadium) => (
                  <MenuItem key={stadium.id} value={stadium.id}>
                    {stadium.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editMode ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
