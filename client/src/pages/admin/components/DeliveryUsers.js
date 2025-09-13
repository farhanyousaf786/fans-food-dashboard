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
} from '@mui/material';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import DeliveryPerson from '../../../models/DeliveryPerson';
import './DeliveryUsers.css';

const DeliveryUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const ref = collection(db, 'deliveryUsers');
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => DeliveryPerson.fromFirestore(d.data(), d.id));
      // Stable, deterministic sort: first name, then last name, then id
      list.sort((a, b) => (
        (a.firstName || '').localeCompare(b.firstName || '') ||
        (a.lastName || '').localeCompare(b.lastName || '') ||
        (a.id || '').localeCompare(b.id || '')
      ));
      setUsers(list);
    });
    return () => unsub();
  }, []);

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

  return (
    <div className="delivery-users">
      <div className="delivery-users__header">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Delivery Users</Typography>
        <Chip color="success" label={`Active: ${users.filter(u => u.isActive).length}`} variant="filled" />
      </div>
      <div className="delivery-users__grid">
        {users.map((u) => (
          <div className="delivery-users__item" key={u.id}>
            <div className="delivery-user-card">
              <div className="delivery-user-card__content">
                <div className="delivery-user-card__avatar">
                  {u.image ? (
                    <img src={u.image} alt={`${u.firstName} ${u.lastName}`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    (u.firstName || '?').charAt(0)
                  )}
                </div>
                <div className="delivery-user-card__main">
                  <p className="delivery-user-card__name">{u.firstName} {u.lastName}</p>
                  <p className="delivery-user-card__email">{u.email}</p>
                  <div className="delivery-user-card__meta">
                    <span className={`delivery-user-card__chip ${u.isActive ? 'delivery-user-card__chip--active' : ''}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    {u.phone && <span className="delivery-user-card__chip">{u.phone}</span>}
                  </div>
                </div>
                <div className="delivery-user-card__switch">
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
  );
};

export default DeliveryUsers;