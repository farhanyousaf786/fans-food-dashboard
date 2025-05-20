import React from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

const OrderFilters = ({ statusFilter, sortBy, onStatusChange, onSortChange }) => {
  return (
    <Box className="orders-filters">
      <FormControl size="small" className="filter-select">
        <InputLabel>Status</InputLabel>
        <Select value={statusFilter} onChange={onStatusChange} label="Status">
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="0">Pending</MenuItem>
          <MenuItem value="1">Preparing</MenuItem>
          <MenuItem value="2">Delivering</MenuItem>
          <MenuItem value="3">Delivered</MenuItem>
          <MenuItem value="4">Cancelled</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" className="filter-select">
        <InputLabel>Sort</InputLabel>
        <Select value={sortBy} onChange={onSortChange} label="Sort">
          <MenuItem value="date">Date</MenuItem>
          <MenuItem value="total">Total</MenuItem>
          <MenuItem value="items">Items</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default OrderFilters;
