import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { FormControl, Select, MenuItem, Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledSelect = styled(Select, {
  shouldForwardProp: (prop) => prop !== 'isRTL',
})(({ theme, isRTL }) => ({
  '& .MuiSelect-select': {
    padding: isRTL ? '8px 8px 8px 24px !important' : '8px 24px 8px 8px !important',
    display: 'flex',
    alignItems: 'center',
    minHeight: 'auto',
    borderRadius: '4px',
    border: '1px solid',
    borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
    '&:hover': {
      borderColor: theme.palette.text.primary,
    },
    textAlign: isRTL ? 'right' : 'left',
    direction: isRTL ? 'rtl' : 'ltr',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&.Mui-focused .MuiSelect-select': {
    borderColor: theme.palette.primary.main,
    borderWidth: '2px',
  },
  '& .MuiSvgIcon-root': {
    left: isRTL ? 8 : 'auto',
    right: isRTL ? 'auto' : 8,
  },
}));

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const theme = useTheme();

  const handleChange = (event) => {
    changeLanguage(event.target.value);
  };

  const isRTL = language === 'he';

  return (
    <Box sx={{ minWidth: 80, direction: isRTL ? 'rtl' : 'ltr' }}>
      <FormControl size="small" variant="standard">
        <StyledSelect
          value={language}
          onChange={handleChange}
          disableUnderline
          isRTL={isRTL}
          IconComponent={() => null}
          MenuProps={{
            PaperProps: {
              sx: {
                mt: 1,
                '& .MuiMenuItem-root': {
                  direction: (props) => props['data-value'] === 'he' ? 'rtl' : 'ltr',
                  gap: 1,
                  minWidth: 100,
                  justifyContent: 'flex-start',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  },
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  backgroundColor: 'transparent',
                  '&.Mui-focusVisible': {
                    backgroundColor: theme.palette.action.hover,
                  },
                },
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: isRTL ? 'right' : 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: isRTL ? 'right' : 'left',
            },
          }}
        >
          <MenuItem 
            value="en" 
            data-value="en"
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              direction: 'ltr',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
              <Box component="span">English</Box>
              <Box component="span" sx={{ fontSize: '0.9rem' }}>🇬🇧</Box>
            </Box>
          </MenuItem>
          <MenuItem 
            value="he" 
            data-value="he"
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              direction: 'rtl',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
              <Box component="span">עברית</Box>
              <Box component="span" sx={{ fontSize: '0.9rem' }}>🇮🇱</Box>
            </Box>
          </MenuItem>
        </StyledSelect>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;
