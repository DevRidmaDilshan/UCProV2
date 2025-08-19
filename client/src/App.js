import React from 'react';
import { Container, CssBaseline } from '@mui/material';
import RegisterList from './components/RegisterList';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <RegisterList />
      </Container>
    </>
  );
}

export default App;
