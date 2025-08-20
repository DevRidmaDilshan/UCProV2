import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  IconButton,
  TextField,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Card,
  CardContent,
  Grid // Add this import
} from '@mui/material';
import { Edit, Delete, Print, Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import { getAllRegisters, deleteRegister } from '../services/api';
import RegisterForm from './RegisterForm';

const RegisterList = () => {
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editRegister, setEditRegister] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRegister, setViewRegister] = useState(null);

  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    setLoading(true);
    try {
      const { data } = await getAllRegisters();
      setRegisters(data);
    } catch (error) {
      console.error('Error fetching registers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteRegister(deleteId);
      fetchRegisters();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting register:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (register) => {
    if (!register.obsNo) return <Chip label="Pending" color="warning" size="small" />;
    
    if (register.obsNo.startsWith('R')) return <Chip label="Recommended" color="success" size="small" />;
    if (register.obsNo.startsWith('NR')) return <Chip label="Not Recommended" color="error" size="small" />;
    if (register.obsNo.startsWith('SCN')) return <Chip label="Management Decision" color="info" size="small" />;
    
    return <Chip label="Unknown" size="small" />;
  };

  const filteredRegisters = registers.filter(register => 
    register.claimNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    register.dealerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (register.dealerName && register.dealerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        UC Tyre Registers
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              label="Search by Claim No, Dealer Code or Name"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: '400px' }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setEditRegister({})}
              sx={{ fontWeight: 'bold' }}
            >
              Add New Registration
            </Button>
          </Box>
        </CardContent>
      </Card>

      {editRegister !== null && (
        <RegisterForm
          initialData={editRegister}
          onSuccess={() => {
            fetchRegisters();
            setEditRegister(null);
          }}
          mode={editRegister && editRegister.id ? 'edit' : 'create'}
        />
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Reg No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Received Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Claim No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Dealer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Brand</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredRegisters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No registers found</TableCell>
              </TableRow>
            ) : (
              filteredRegisters.map((register) => (
                <TableRow key={register.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{register.id}</TableCell>
                  <TableCell>{register.receivedDate ? format(new Date(register.receivedDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{register.claimNo}</TableCell>
                  <TableCell>
                    {register.dealerName || register.dealerCode}
                    {register.dealerLocation && ` (${register.dealerLocation})`}
                  </TableCell>
                  <TableCell>{register.brand}</TableCell>
                  <TableCell>{register.size}</TableCell>
                  <TableCell>{getStatusChip(register)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewRegister(register)} title="View Details">
                      <Visibility color="primary" />
                    </IconButton>
                    <IconButton onClick={() => {
                      // Create a copy with only register fields
                      const registerData = { ...register };
                      delete registerData.dealerName;
                      delete registerData.dealerLocation;
                      setEditRegister(registerData);
                    }} title="Edit">
                      <Edit color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => setDeleteId(register.id)} title="Delete">
                      <Delete color="error" />
                    </IconButton>
                    <IconButton title="Print">
                      <Print />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this register? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={Boolean(viewRegister)}
        onClose={() => setViewRegister(null)}
        maxWidth="md"
        fullWidth
      >
        {viewRegister && (
          <>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
              Register Details - #{viewRegister.id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Received Date:</Typography>
                    <Typography>{viewRegister.receivedDate ? format(new Date(viewRegister.receivedDate), 'dd/MM/yyyy') : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Claim No:</Typography>
                    <Typography>{viewRegister.claimNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer:</Typography>
                    <Typography>{viewRegister.dealerName || viewRegister.dealerCode}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer Location:</Typography>
                    <Typography>{viewRegister.dealerLocation || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer View:</Typography>
                    <Typography>{viewRegister.dealerView}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Tyre Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Brand:</Typography>
                    <Typography>{viewRegister.brand}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Size:</Typography>
                    <Typography>{viewRegister.size}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Size Code:</Typography>
                    <Typography>{viewRegister.sizeCode || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                {viewRegister.obsDate && (
                  <>
                    <Typography variant="h6" gutterBottom>Technical Details</Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Observation Date:</Typography>
                        <Typography>{format(new Date(viewRegister.obsDate), 'dd/MM/yyyy')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Technical Observation:</Typography>
                        <Typography>{viewRegister.techObs || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Remaining Tread Depth:</Typography>
                        <Typography>{viewRegister.treadDepth || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Consultant Name:</Typography>
                        <Typography>{viewRegister.consultantName || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Observation No:</Typography>
                        <Typography>{viewRegister.obsNo || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewRegister(null)} color="primary">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setViewRegister(null);
                  // Create a copy with only register fields
                  const registerData = { ...viewRegister };
                  delete registerData.dealerName;
                  delete registerData.dealerLocation;
                  setEditRegister(registerData);
                }}
                color="secondary"
              >
                Edit
              </Button>
              <Button 
                onClick={() => window.print()}
                startIcon={<Print />}
              >
                Print
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RegisterList;