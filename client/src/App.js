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
  Box 
} from '@mui/material';
import RegisterList from './components/RegisterList';
import Dashboard from './components/Dashboard';
import ReportGenerator from './components/ReportGenerator';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#093f75ff',
    },
    secondary: {
      main: '#f0e8eaff',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
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
        <Box sx={{ p: 3 }}>
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar with unique color */}
      <AppBar 
        position="static" 
        sx={{ backgroundColor: "#2E3B55" }}   // top bar color
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            UCProV2 - Tyre Management System
          </Typography>
        </Toolbar>

        {/* Tabs with individual colors */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          TabIndicatorProps={{
            style: { backgroundColor: "white" }, // indicator color
          }}
        >
          <Tab 
            label="Dashboard" 
            sx={{ color: tabValue === 0 ? "#ff5722" : "#ffffff" }} 
          />
          <Tab 
            label="Registers" 
            sx={{ color: tabValue === 1 ? "#4caf50" : "#ffffff" }} 
          />
          <Tab 
            label="Reports" 
            sx={{ color: tabValue === 2 ? "#2196f3" : "#ffffff" }} 
          />
        </Tabs>
      </AppBar>

      {/* Tab Content */}
      <Container maxWidth="xl">
        <TabPanel value={tabValue} index={0}>
          <Dashboard />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <RegisterList />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ReportGenerator />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;