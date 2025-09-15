import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Tooltip,
} from '@mui/material';
import RegisterList from './components/RegisterList';
import Dashboard from './components/Dashboard';
import DailyReport from './components/DailyReport';
import ReportGenerator from './components/ReportGenerator';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0A2647', // deep blue
    },
    secondary: {
      main: '#FF6F61', // coral
    },
    background: {
      default: '#f9f9f9',
    },
  },
  typography: {
    h4: {
      fontWeight: 700,
      letterSpacing: '0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: 3,
            background: 'white',
            mt: 2,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const tabs = [
    { label: 'Registration', component: <RegisterList /> },
    { label: 'Brand Summary', component: <Dashboard /> },
    { label: 'Observation Summary', component: <DailyReport /> },
    { label: 'Reports', component: <ReportGenerator /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Top Bar */}
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #0A2647 0%, #144272 100%)',
          boxShadow: 4,
        }}
      >
        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            Under Complaint Tyre Management System
          </Typography>
        </Toolbar>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          TabIndicatorProps={{
            style: { backgroundColor: '#FF6F61', height: '4px' },
          }}
        >
          {tabs.map((tab, index) => (
            <Tooltip title={tab.label} key={index} arrow>
              <Tab
                label={tab.label}
                sx={{
                  color: tabValue === index ? '#FF6F61' : '#ffffff',
                  fontWeight: tabValue === index ? 700 : 500,
                  textTransform: 'none',
                  fontSize: '1rem',
                  mx: 2,
                  '&:hover': {
                    color: '#FFD369',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                  },
                }}
              />
            </Tooltip>
          ))}
        </Tabs>
      </AppBar>

      {/* Page Content */}
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Container>
    </ThemeProvider>
  );
}

export default App;