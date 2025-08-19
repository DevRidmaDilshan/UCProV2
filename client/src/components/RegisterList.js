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
  DialogTitle
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

  const filteredRegisters = registers.filter(register => 
    register.claimNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    register.dealerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (register.dealerName && register.dealerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        UC Tyre Registers
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setEditRegister({})}
        >
          Add New
        </Button>
      </Box>

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reg No</TableCell>
              <TableCell>Received Date</TableCell>
              <TableCell>Claim No</TableCell>
              <TableCell>Dealer</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredRegisters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No registers found</TableCell>
              </TableRow>
            ) : (
              filteredRegisters.map((register) => (
                <TableRow key={register.id}>
                  <TableCell>{register.id}</TableCell>
                  <TableCell>{format(new Date(register.receivedDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{register.claimNo}</TableCell>
                  <TableCell>{register.dealerName || register.dealerCode}</TableCell>
                  <TableCell>{register.brand}</TableCell>
                  <TableCell>{register.size}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewRegister(register)}>
                      <Visibility color="primary" />
                    </IconButton>
                    <IconButton onClick={() => {
                        // Create a copy with only register fields
                        const registerData = { ...register };
                        delete registerData.dealerName;
                        delete registerData.dealerLocation;
                        setEditRegister(registerData);
                        }}>
                        <Edit color="secondary" />
                    </IconButton>
                    <IconButton onClick={() => setDeleteId(register.id)}>
                      <Delete color="error" />
                    </IconButton>
                    <IconButton>
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
            <DialogTitle>Register Details - #{viewRegister.id}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1">Basic Information</Typography>
                  <Typography>Received Date: {format(new Date(viewRegister.receivedDate), 'dd/MM/yyyy')}</Typography>
                  <Typography>Claim No: {viewRegister.claimNo}</Typography>
                  <Typography>Dealer: {viewRegister.dealerName || viewRegister.dealerCode}</Typography>
                  <Typography>Dealer Location: {viewRegister.dealerLocation}</Typography>
                  <Typography>Dealer View: {viewRegister.dealerView}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1">Tyre Information</Typography>
                  <Typography>Brand: {viewRegister.brand}</Typography>
                  <Typography>Size: {viewRegister.size}</Typography>
                  <Typography>Size Code: {viewRegister.sizeCode}</Typography>
                </Box>
                {viewRegister.obsDate && (
                  <>
                    <Box>
                      <Typography variant="subtitle1">Technical Details</Typography>
                      <Typography>Observation Date: {format(new Date(viewRegister.obsDate), 'dd/MM/yyyy')}</Typography>
                      <Typography>Technical Observation: {viewRegister.techObs}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1">Consultation Details</Typography>
                      <Typography>Remaining Tread Depth: {viewRegister.treadDepth}</Typography>
                      <Typography>Consultant Name: {viewRegister.consultantName}</Typography>
                      <Typography>Observation No: {viewRegister.obsNo}</Typography>
                    </Box>
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
                  setEditRegister(viewRegister);
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