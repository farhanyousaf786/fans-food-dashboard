import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Auth from './pages/Auth';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import Manage from './pages/manage/Manage';
import Stadium from './pages/stadium/Stadium';
import Sidebar from './components/Sidebar';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#15BE77',
      light: '#4dcf95',
      dark: '#0e8553',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
});

const DashboardLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  const isAuthenticated = !!localStorage.getItem('user');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />
          } />
          <Route path="/dashboard" element={
            isAuthenticated ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/" />
          } />
          <Route path="/profile" element={
            isAuthenticated ? <DashboardLayout><Profile /></DashboardLayout> : <Navigate to="/" />
          } />
          <Route path="/manage" element={
            isAuthenticated ? <DashboardLayout><Manage /></DashboardLayout> : <Navigate to="/" />
          } />
          <Route path="/stadium" element={
            isAuthenticated ? <DashboardLayout><Stadium /></DashboardLayout> : <Navigate to="/" />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;