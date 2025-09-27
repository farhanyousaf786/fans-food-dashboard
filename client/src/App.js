import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import Auth from './pages/Auth';
import Dashboard from './pages/dashboard/Dashboard';
import AdminPanel from './pages/admin/AdminPanel';
import ShopPanel from './pages/shop/ShopPanel';
import Profile from './pages/profile/Profile';
import Manage from './pages/manage/Manage';
import Stadium from './pages/stadium/Stadium';
import Orders from './pages/orders/Orders';
import Analysis from './pages/analysis/Analysis';
import Sidebar from './components/Sidebar';
import AddCategory from './pages/categories/AddCategory';

// Create theme instance with RTL support
const getTheme = (direction = 'ltr') => {
  const isRTL = direction === 'rtl';
  
  return createTheme({
    direction,
    palette: {
      primary: {
        main: '#3D70FF',
        light: '#5A84F8',
        dark: '#3161EA',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#F5F5F5',
        paper: '#FFFFFF',
      },
    },
    typography: {
      fontFamily: isRTL 
        ? '"Heebo", "Arial", sans-serif' 
        : '"Lato", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            direction,
          },
        },
      },
    },
  });
};

const DashboardLayout = ({ children }) => {
  const location = window.location.pathname;
  const isShopRoute = location === '/shop';
  const isAdminRoute = location === '/admin';
  const isStadiumRoute = location.startsWith('/stadium');
  const hideSidebar = isShopRoute || isAdminRoute || isStadiumRoute;
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      {!hideSidebar && <Sidebar />}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: '70px',  // Match header height
          backgroundColor: '#f8f9fa',
          marginLeft: hideSidebar ? 0 : '240px', // Adjust margin when sidebar is hidden
          transition: 'margin 0.3s ease',
          width: hideSidebar ? '100%' : 'calc(100% - 240px)'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const PrivateRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  
  console.log('🔐 PRIVATE ROUTE: Checking authentication...');
  console.log('🔐 PRIVATE ROUTE: User string from localStorage:', userString);
  
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
    console.log('🔐 PRIVATE ROUTE: Parsed user:', user);
  } catch (error) {
    console.error('🔐 PRIVATE ROUTE: Error parsing user data:', error);
    localStorage.removeItem('user'); // Clear corrupted data
    return <Navigate to="/auth" />;
  }

  if (!user) {
    console.log('🔐 PRIVATE ROUTE: No user found, redirecting to auth');
    return <Navigate to="/auth" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log('🔐 PRIVATE ROUTE: Role mismatch. Required:', requiredRole, 'User role:', user.role);
    return <Navigate to="/dashboard" />;
  }

  console.log('🔐 PRIVATE ROUTE: Authentication successful for user:', user.email);
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

// Wrapper component that uses the useLanguage hook
function AppContent() {
  const { language } = useLanguage();
  const theme = getTheme(language === 'he' ? 'rtl' : 'ltr');
  
  // Update document direction when language changes
  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/orders" element={<PrivateRoute><DashboardLayout><Orders /></DashboardLayout></PrivateRoute>} />
          <Route path="/analysis" element={<PrivateRoute><DashboardLayout><Analysis /></DashboardLayout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute requiredRole="admin"><DashboardLayout><AdminPanel /></DashboardLayout></PrivateRoute>} />
          <Route path="/shop" element={<PrivateRoute requiredRole="shopowner"><DashboardLayout><ShopPanel /></DashboardLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><DashboardLayout><Profile /></DashboardLayout></PrivateRoute>} />
          <Route path="/manage" element={<PrivateRoute><DashboardLayout><Manage /></DashboardLayout></PrivateRoute>} />
          <Route path="/stadium/:id" element={<PrivateRoute><DashboardLayout><Stadium /></DashboardLayout></PrivateRoute>} />
          <Route path="/add-category" element={<PrivateRoute><DashboardLayout><AddCategory /></DashboardLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </I18nextProvider>
  );
};

export default App;