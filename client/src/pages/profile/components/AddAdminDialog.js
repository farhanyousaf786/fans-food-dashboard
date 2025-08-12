import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const AddAdminDialog = ({ 
  open, 
  onClose, 
  selectedShop, 
  allShopOwners, 
  selectedOwner, 
  onOwnerChange, 
  onAddAdmin 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Shop Admin</DialogTitle>
      <DialogContent>
        <Typography className="dialog-description">
          Add a shop owner as admin to: <strong>{selectedShop?.name}</strong>
        </Typography>
        
        <FormControl fullWidth className="shop-select">
          <InputLabel>Select Shop Owner</InputLabel>
          <Select
            value={selectedOwner}
            onChange={onOwnerChange}
            label="Select Shop Owner"
          >
            {allShopOwners
              .filter(owner => 
                !selectedShop?.admins?.includes(owner.id)
              )
              .map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name} ({owner.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions className="dialog-actions">
        <Button onClick={onClose} className="cancel-btn">
          Cancel
        </Button>
        <Button onClick={onAddAdmin} variant="contained" className="add-btn">
          Add Admin
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAdminDialog;
