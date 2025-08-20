import React from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import RegisterList from './components/RegisterList';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <RegisterList />
      </Container>
    </ThemeProvider>
  );
}

export default App;
