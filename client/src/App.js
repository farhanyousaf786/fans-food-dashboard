import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StadiumProvider } from './context/StadiumContext';
import Auth from './pages/auth/Auth';
import Profile from './pages/Profile';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/Orders';
import Menus from './pages/menus/Menus';
import AddCustomer from './pages/customers/AddCustomer';
import Members from './pages/customers/Members';
import GeneralCustomers from './pages/customers/GeneralCustomers';
import Analytics from './pages/analytics/Analytics';
import Stadiums from './pages/stadiums/Stadiums';
import RequireAuth from './components/RequireAuth';

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
    h1: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  return isAuthPage ? children : (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <StadiumProvider>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/stadiums" element={<RequireAuth><Stadiums /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><AppLayout><Profile /></AppLayout></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><AppLayout><Orders /></AppLayout></RequireAuth>} />
            <Route path="/menus" element={<RequireAuth><AppLayout><Menus /></AppLayout></RequireAuth>} />
            <Route path="/customers/add" element={<RequireAuth><AppLayout><AddCustomer /></AppLayout></RequireAuth>} />
            <Route path="/customers/members" element={<RequireAuth><AppLayout><Members /></AppLayout></RequireAuth>} />
            <Route path="/customers/general" element={<RequireAuth><AppLayout><GeneralCustomers /></AppLayout></RequireAuth>} />
            <Route path="/analytics" element={<RequireAuth><AppLayout><Analytics /></AppLayout></RequireAuth>} />
            <Route path="*" element={<Navigate to="/stadiums" />} />
          </Routes>
        </Router>
        </ThemeProvider>
      </StadiumProvider>
    </AuthProvider>
  );
}

export default App;
