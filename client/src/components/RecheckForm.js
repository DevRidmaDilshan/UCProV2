// components/RecheckForm.jsx
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Typography,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import {
  getAllRegistersForDropdown,
  getRegisterById,
  createRecheck,
  updateRecheck,
  getNextRecheckNumber
} from '../services/api';

const RecheckForm = ({ initialData, onSuccess, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    id: '',
    reObsDate: format(new Date(), 'yyyy-MM-dd'),
    reObsStatus: '',
    reObs: '',
    reTreadDepth: '',
    reObsNo: ''
  });

  const [registers, setRegisters] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [registerDetails, setRegisterDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRegisters, setLoadingRegisters] = useState(true);
  const [message, setMessage] = useState('');
  const [hasFetchedNextNumber, setHasFetchedNextNumber] = useState(false);

  // Load registers for dropdown
  useEffect(() => {
    const fetchRegisters = async () => {
      try {
        setLoadingRegisters(true);
        const { data } = await getAllRegistersForDropdown();
        console.log('Fetched registers:', data); // Debug log
        setRegisters(data);
      } catch (error) {
        console.error('Error fetching registers:', error);
        setMessage('Error loading registers. Please try again.');
      } finally {
        setLoadingRegisters(false);
      }
    };
    
    fetchRegisters();
  }, []);

  // Get next recheck number for new entries
  useEffect(() => {
    if (mode === 'create' && !hasFetchedNextNumber) {
      const fetchNextNumber = async () => {
        try {
          const { data } = await getNextRecheckNumber();
          setFormData(prev => ({ ...prev, reObsNo: data.nextNumber }));
          setHasFetchedNextNumber(true);
        } catch (error) {
          console.error('Error fetching next recheck number:', error);
        }
      };
      fetchNextNumber();
    }
  }, [mode, hasFetchedNextNumber]);

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        id: initialData.id,
        reObsDate: format(new Date(initialData.reObsDate), 'yyyy-MM-dd'),
        reObsStatus: initialData.reObsStatus,
        reObs: initialData.reObs || '',
        reTreadDepth: initialData.reTreadDepth || '',
        reObsNo: initialData.reObsNo
      });

      // Find and set the selected register
      const fetchRegisterDetails = async () => {
        try {
          const { data } = await getRegisterById(initialData.id);
          setRegisterDetails(data);
          // Create register object matching dropdown format
          setSelectedRegister({
            id: data.id,
            claimNo: data.claimNo,
            dealerView: data.dealerView,
            brand: data.brand,
            size: data.size,
            serialNo: data.serialNo
          });
        } catch (error) {
          console.error('Error fetching register details:', error);
        }
      };
      fetchRegisterDetails();
    }
  }, [initialData, mode]);

  const handleRegisterSelect = async (event, newValue) => {
    setSelectedRegister(newValue);
    if (newValue) {
      setFormData(prev => ({ ...prev, id: newValue.id }));
      try {
        const { data } = await getRegisterById(newValue.id);
        setRegisterDetails(data);
      } catch (error) {
        console.error('Error fetching register details:', error);
        setMessage('Error loading register details');
      }
    } else {
      setRegisterDetails(null);
      setFormData(prev => ({ ...prev, id: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id || !formData.reObsDate || !formData.reObsStatus) {
      setMessage('Please fill all required fields: Reg No, Recheck Date, and Recheck Observation Status');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await createRecheck(formData);
        setMessage('Recheck created successfully!');
      } else {
        await updateRecheck(initialData.reNo, formData);
        setMessage('Recheck updated successfully!');
      }
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      console.error('Error saving recheck:', err);
      setMessage('Error saving recheck data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '900px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {mode === 'create' ? 'Add New Recheck' : 'Edit Recheck'}
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Registration Selection */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Select Registration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={registers}
                  value={selectedRegister}
                  onChange={handleRegisterSelect}
                  getOptionLabel={(option) => 
                    option ? `Reg No: ${option.id} - Claim: ${option.claimNo} - ${option.dealerView}` : ''
                  }
                  isOptionEqualToValue={(option, value) => 
                    option?.id === value?.id
                  }
                  loading={loadingRegisters}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Registration Number"
                      required
                      placeholder={loadingRegisters ? "Loading registration numbers..." : "Select a registration number"}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingRegisters ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  disabled={mode === 'edit'}
                  noOptionsText="No registration numbers found"
                />
                {registers.length === 0 && !loadingRegisters && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    No registration numbers available. Please create some registers first.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Register Details Display */}
        {registerDetails && (
          <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Registered Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Claim No:</Typography>
                  <Typography>{registerDetails.claimNo}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Dealer:</Typography>
                  <Typography>{registerDetails.dealerView}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Brand:</Typography>
                  <Typography>{registerDetails.brand}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Size:</Typography>
                  <Typography>{registerDetails.size}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Serial No:</Typography>
                  <Typography>{registerDetails.serialNo || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Original Status:</Typography>
                  <Typography>{registerDetails.obsStatus || 'Pending'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Recheck Information */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recheck Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Recheck Date"
                  type="date"
                  name="reObsDate"
                  value={formData.reObsDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Recheck Number"
                  name="reObsNo"
                  value={formData.reObsNo}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Recheck Observation Status</InputLabel>
                  <Select
                    name="reObsStatus"
                    value={formData.reObsStatus}
                    label="Recheck Observation Status"
                    onChange={handleChange}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Recommended">Recommended</MenuItem>
                    <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                    <MenuItem value="Forwarded for Management Decision">
                      Forwarded for Management Decision
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recheck Tread Depth"
                  name="reTreadDepth"
                  value={formData.reTreadDepth}
                  onChange={handleChange}
                  placeholder="e.g., 6,6,6,6"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Recheck Observation"
                  name="reObs"
                  value={formData.reObs}
                  onChange={handleChange}
                  placeholder="Enter recheck observations..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={() => onSuccess()} variant="outlined">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading || !formData.id}
          >
            {loading ? 'Saving...' : (mode === 'create' ? 'Create Recheck' : 'Update Recheck')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RecheckForm;