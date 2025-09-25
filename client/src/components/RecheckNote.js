import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Grid,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  getAllRechecks,
  createRecheck,
  updateRecheck,
  deleteRecheck,
  getRegistersWithObservations,
  getRegisterForRecheck
} from '../services/api';

const RecheckNote = () => {
  const [rechecks, setRechecks] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRecheck, setSelectedRecheck] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    reObsDate: format(new Date(), 'yyyy-MM-dd'),
    reObs: '',
    reTreadDepth: ''
  });

  const [registerData, setRegisterData] = useState({
    claimNo: '',
    dealerView: '',
    brand: '',
    size: '',
    treadDepth: '',
    techObs: '',
    obsDate: '',
    obsStatus: ''
  });

  useEffect(() => {
    fetchRechecks();
    fetchRegisters();
  }, []);

  const fetchRechecks = async () => {
    try {
      const { data } = await getAllRechecks();
      setRechecks(data);
    } catch (error) {
      console.error('Error fetching rechecks:', error);
      setMessage('Error fetching recheck data');
    }
  };

  const fetchRegisters = async () => {
    try {
      const { data } = await getRegistersWithObservations();
      setRegisters(data);
    } catch (error) {
      console.error('Error fetching registers:', error);
      setMessage('Error fetching register data');
    }
  };

  const handleRegisterChange = async (event, value) => {
    if (value) {
      setFormData(prev => ({ ...prev, id: value.id }));
      
      try {
        const { data } = await getRegisterForRecheck(value.id);
        setRegisterData({
          claimNo: data.claimNo || '',
          dealerView: data.dealerView || '',
          brand: data.brand || '',
          size: data.size || '',
          treadDepth: data.serialNo || '',
          techObs: data.techObs || '',
          obsDate: data.obsDate ? format(new Date(data.obsDate), 'yyyy-MM-dd') : '',
          obsStatus: data.obsStatus || ''
        });
      } catch (error) {
        console.error('Error fetching register details:', error);
        setMessage('Error fetching register details');
      }
    } else {
      setFormData(prev => ({ ...prev, id: '' }));
      setRegisterData({
        claimNo: '',
        dealerView: '',
        brand: '',
        size: '',
        treadDepth: '',
        techObs: '',
        obsDate: '',
        obsStatus: ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      reObsDate: format(new Date(), 'yyyy-MM-dd'),
      reObs: '',
      reTreadDepth: ''
    });
    setRegisterData({
      claimNo: '',
      dealerView: '',
      brand: '',
      size: '',
      treadDepth: '',
      techObs: '',
      obsDate: '',
      obsStatus: ''
    });
    setSelectedRecheck(null);
    setEditMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id || !formData.reObs || !formData.reTreadDepth) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editMode && selectedRecheck) {
        await updateRecheck(selectedRecheck.recheckNo, formData);
        setMessage('Recheck updated successfully!');
      } else {
        await createRecheck(formData);
        setMessage('Recheck created successfully!');
      }
      
      fetchRechecks();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving recheck:', error);
      setMessage('Error saving recheck data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recheck) => {
    setSelectedRecheck(recheck);
    setFormData({
      id: recheck.id,
      reObsDate: recheck.reObsDate ? format(new Date(recheck.reObsDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      reObs: recheck.reObs || '',
      reTreadDepth: recheck.reTreadDepth || ''
    });
    setRegisterData({
      claimNo: recheck.claimNo || '',
      dealerView: recheck.dealerView || '',
      brand: recheck.brand || '',
      size: recheck.size || '',
      treadDepth: recheck.treadDepth || '',
      techObs: recheck.techObs || '',
      obsDate: recheck.obsDate ? format(new Date(recheck.obsDate), 'yyyy-MM-dd') : '',
      obsStatus: recheck.obsStatus || ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = async (recheckNo) => {
    if (window.confirm('Are you sure you want to delete this recheck?')) {
      try {
        await deleteRecheck(recheckNo);
        setMessage('Recheck deleted successfully!');
        fetchRechecks();
      } catch (error) {
        console.error('Error deleting recheck:', error);
        setMessage('Error deleting recheck');
      }
    }
  };

  const handlePrint = (recheck) => {
    const printContent = `
      <html>
        <head>
          <title>Recheck Note - ${recheck.formattedRecheckNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Recheck Note</h1>
            <h2>Recheck No: ${recheck.formattedRecheckNo}</h2>
          </div>
          
          <div class="section">
            <h3>Basic Information</h3>
            <div class="field"><span class="label">Claim No:</span> <span class="value">${recheck.claimNo || 'N/A'}</span></div>
            <div class="field"><span class="label">Dealer:</span> <span class="value">${recheck.dealerView || 'N/A'}</span></div>
            <div class="field"><span class="label">Brand:</span> <span class="value">${recheck.brand || 'N/A'}</span></div>
            <div class="field"><span class="label">Size:</span> <span class="value">${recheck.size || 'N/A'}</span></div>
            <div class="field"><span class="label">Serial No:</span> <span class="value">${recheck.treadDepth || 'N/A'}</span></div>
          </div>

          <div class="section">
            <h3>Previous Observation Details</h3>
            <div class="field"><span class="label">Observation Date:</span> <span class="value">${recheck.obsDate ? format(new Date(recheck.obsDate), 'yyyy-MM-dd') : 'N/A'}</span></div>
            <div class="field"><span class="label">Observation Status:</span> <span class="value">${recheck.obsStatus || 'N/A'}</span></div>
            <div class="field"><span class="label">Technical Observations:</span></div>
            <div class="value" style="white-space: pre-wrap;">${recheck.techObs || 'N/A'}</div>
          </div>

          <div class="section">
            <h3>Recheck Details</h3>
            <div class="field"><span class="label">Recheck Date:</span> <span class="value">${recheck.reObsDate ? format(new Date(recheck.reObsDate), 'yyyy-MM-dd') : 'N/A'}</span></div>
            <div class="field"><span class="label">Present Tread Depth:</span> <span class="value">${recheck.reTreadDepth || 'N/A'}</span></div>
            <div class="field"><span class="label">Present Observations:</span></div>
            <div class="value" style="white-space: pre-wrap;">${recheck.reObs || 'N/A'}</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            Recheck Notes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Recheck Note
          </Button>
        </Box>

        {message && (
          <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* Rechecks Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Recheck No</TableCell>
                <TableCell>Claim No</TableCell>
                <TableCell>Dealer</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Recheck Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rechecks.map((recheck) => (
                <TableRow key={recheck.recheckNo}>
                  <TableCell>{recheck.formattedRecheckNo}</TableCell>
                  <TableCell>{recheck.claimNo}</TableCell>
                  <TableCell>{recheck.dealerView}</TableCell>
                  <TableCell>{recheck.brand}</TableCell>
                  <TableCell>{recheck.size}</TableCell>
                  <TableCell>
                    {recheck.reObsDate ? format(new Date(recheck.reObsDate), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(recheck)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(recheck.recheckNo)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton 
                      color="info" 
                      onClick={() => handlePrint(recheck)}
                      title="Print"
                    >
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editMode ? 'Edit Recheck Note' : 'Add Recheck Note'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                {/* Register Selection */}
                <Grid item xs={12}>
                  <Autocomplete
                    options={registers}
                    getOptionLabel={(option) => `ID: ${option.id} - Claim: ${option.claimNo} - ${option.brand} ${option.size}`}
                    value={registers.find(reg => reg.id === formData.id) || null}
                    onChange={handleRegisterChange}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Register (ID)"
                        required
                        fullWidth
                      />
                    )}
                    disabled={editMode}
                  />
                </Grid>

                {/* Basic Information Card */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Claim No"
                            value={registerData.claimNo}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Dealer"
                            value={registerData.dealerView}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Brand"
                            value={registerData.brand}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Size"
                            value={registerData.size}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Previous Observation Card */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Previous Observation Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Serial No"
                            value={registerData.treadDepth}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                            multiline
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Observation Date"
                            value={registerData.obsDate}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Previous Technical Observations"
                            value={registerData.techObs}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                            multiline
                            rows={3}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Observation Status"
                            value={registerData.obsStatus}
                            InputProps={{ readOnly: true }}
                            variant="filled"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recheck Details Card */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recheck Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Recheck Date"
                            type="date"
                            name="reObsDate"
                            value={formData.reObsDate}
                            onChange={handleInputChange}
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Present Tread Depth"
                            name="reTreadDepth"
                            value={formData.reTreadDepth}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., 6,6,6,6"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Present Observations"
                            name="reObs"
                            value={formData.reObs}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                            required
                            placeholder="Enter present observations..."
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : (editMode ? 'Update' : 'Save')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default RecheckNote;