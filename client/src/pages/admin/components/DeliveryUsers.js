// client/src/pages/admin/components/DeliveryUsers.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Button,
} from '@mui/material';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import DeliveryPerson from '../../../models/DeliveryPerson';
import AssignSectionsDialog from './AssignSectionsDialog';
import './DeliveryUsers.css';

const DeliveryUsers = ({ stadiumId = null, showAll = false }) => {
  const [users, setUsers] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const ref = collection(db, 'deliveryUsers');
    const unsub = onSnapshot(ref, (snap) => {
      let list = snap.docs.map((d) => DeliveryPerson.fromFirestore(d.data(), d.id));
      
      // Filter by stadium if stadiumId is provided and showAll is false
      if (stadiumId && !showAll) {
        list = list.filter(user => user.stadiumId === stadiumId);
      }
      
      // Stable, deterministic sort: first name, then last name, then id
      list.sort((a, b) => (
        (a.firstName || '').localeCompare(b.firstName || '') ||
        (a.lastName || '').localeCompare(b.lastName || '') ||
        (a.id || '').localeCompare(b.id || '')
      ));
      setUsers(list);
    });
    return () => unsub();
  }, [stadiumId, showAll]);

  const handleToggle = async (user) => {
    const newVal = !user.isActive;
    try {
      await updateDoc(doc(db, 'deliveryUsers', user.id), {
        isActive: newVal,
        updatedAt: new Date(),
      });
    } catch (e) {
      console.error('Error updating active state:', e);
    }
  };

  const handleOpenAssignDialog = (user) => {
    setSelectedUser(user);
    setAssignDialogOpen(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="delivery-users">
      {!stadiumId && (
        <div className="delivery-users__header">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Delivery Users</Typography>
          <Chip color="success" label={`Active: ${users.filter(u => u.isActive).length}`} variant="filled" />
        </div>
      )}
      {stadiumId && !showAll && users.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No delivery personnel assigned to this stadium yet.
        </Typography>
      )}
      {showAll && (
        <div className="delivery-users__header">
          <Chip color="primary" label={`Total: ${users.length}`} variant="filled" size="small" />
        </div>
      )}
      <div className="delivery-grid-wrapper">
          <div className="delivery-users__grid">
        {users.map((u) => (
          <div className="delivery-users__item" key={u.id}>
            <div className="delivery-user-card" onClick={(e) => e.stopPropagation()}>
              <div className="delivery-user-card__content">
                <div className="delivery-user-card__main">
                  <p className="delivery-user-card__name">{u.firstName} {u.lastName}</p>
                  <p className="delivery-user-card__email">{u.email}</p>
                </div>
                <div className="delivery-user-card__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {u.stadiumId && u.sectionIds && u.sectionIds.length > 0 && (
                    <Button
                      size="small"
                      variant="text"
                      color="info"
                      onClick={() => handleOpenAssignDialog(u)}
                      sx={{ fontSize: '0.7rem', py: 0.5, px: 1, minWidth: 'auto' }}
                    >
                      Details
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenAssignDialog(u)}
                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                  >
                    {u.stadiumId && u.sectionIds && u.sectionIds.length > 0 ? 'Edit' : 'Assign'}
                  </Button>
                  <Switch
                    checked={!!u.isActive}
                    onChange={() => handleToggle(u)}
                    color="success"
                    inputProps={{ 'aria-label': `Toggle active for ${u.firstName} ${u.lastName}` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
          </div>
      </div>

      {/* Assign Sections Dialog */}
      <AssignSectionsDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        user={selectedUser}
      />
    </div>
  );
};

export default DeliveryUsers;