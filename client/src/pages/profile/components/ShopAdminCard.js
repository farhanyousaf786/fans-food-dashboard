import React from 'react';
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Box,
  Divider,
  Tooltip,
  Chip,
  Button
} from '@mui/material';
import { Add, Delete, LocationOn, PersonAdd } from '@mui/icons-material';
import { auth } from '../../../config/firebase';

const ShopAdminCard = ({
  shop,
  onAddAdmin,
  onRemoveAdmin,
  getOwnerName
}) => {
  // Helper to generate a color from a string
  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  const stringAvatar = (name) => {
    return {
      sx: {
        bgcolor: stringToColor(name),
        width: 32,
        height: 32,
        fontSize: '0.875rem',
      },
      children: `${name.split(' ')[0][0]}${name.split(' ')[1] ? name.split(' ')[1][0] : ''}`,
    };
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ pr: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
              {shop.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <LocationOn sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                {shop.stadiumName} • {shop.location}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Add Admin">
            <IconButton
              onClick={() => onAddAdmin(shop)}
              size="small"
              sx={{
                bgcolor: 'primary.50',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.100' }
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 2, pt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Team Members
          </Typography>
          <Chip
            label={`${shop.admins?.length || 0} Admins`}
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'grey.100' }}
          />
        </Box>

        <List disablePadding sx={{ flexGrow: 1 }}>
          {shop.admins && shop.admins.map((adminId) => {
            const name = getOwnerName(adminId);
            const isCurrentUser = adminId === auth.currentUser.uid;

            return (
              <ListItem
                key={adminId}
                disablePadding
                sx={{ mb: 1.5 }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  border: '1px solid transparent',
                  '&:hover': { borderColor: 'divider', bgcolor: 'action.hover' }
                }}>
                  <Avatar {...stringAvatar(name)} sx={{ ...stringAvatar(name).sx, width: 28, height: 28, mr: 1.5 }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {name}
                        </Typography>
                        {isCurrentUser && (
                          <Typography variant="caption" color="primary" fontWeight={700}>(You)</Typography>
                        )}
                      </Box>
                    }
                  />
                  {!isCurrentUser && (
                    <IconButton
                      size="small"
                      onClick={() => onRemoveAdmin(shop.id, adminId)}
                      sx={{
                        color: 'text.disabled',
                        p: 0.5,
                        '&:hover': { color: 'error.main', bgcolor: 'error.lighter' }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>

        {(!shop.admins || shop.admins.length === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.5 }}>
            <PersonAdd sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2">No admins assigned</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ShopAdminCard;
