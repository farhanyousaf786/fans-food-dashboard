import React from 'react';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Auth from './pages/Auth';
import Dashboard from './pages/dashboard/Dashboard';
import AdminPanel from './pages/admin/AdminPanel';
import ShopPanel from './pages/shop/ShopPanel';
import Profile from './pages/profile/Profile';
import Manage from './pages/manage/Manage';
import Stadium from './pages/stadium/Stadium';
import Orders from './pages/orders/Orders';
import Sidebar from './components/Sidebar';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#4C9E48',
      light: '#6abe66',
      dark: '#356e32',
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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: '70px',  // Match header height
          backgroundColor: '#f8f9fa'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const PrivateRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const HomeRedirect = () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!userData) return <Navigate to="/dashboard" />;

  switch (userData.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'shopowner':
      return <Navigate to="/shop" />;
    default:
      return <Navigate to="/dashboard" />;
  }
};

function App() {
  const isAuthenticated = !!localStorage.getItem('user');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={isAuthenticated ? <HomeRedirect /> : <Auth />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><DashboardLayout><Orders /></DashboardLayout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminPanel /></PrivateRoute>} />
          <Route path="/shop" element={<PrivateRoute requiredRole="shopowner"><ShopPanel /></PrivateRoute>} />
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