import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Grid, 
  Paper, 
  Typography,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { 
  getInitialData, 
  getDealerByView, 
  getSizesByBrand, 
  createRegister,
  updateRegister,
  getAllConsultants,
  getNextObservationNumber
} from '../services/api';

const RegisterForm = ({ initialData, onSuccess, mode = 'create', technicalMode = false }) => {
  const [formData, setFormData] = useState({
    receivedDate: format(new Date(), 'yyyy-MM-dd'),
    claimNo: '',
    dealerView: '',
    dealerCode: '',
    brand: '',
    size: '',
    sizeCode: '',
    serialNo:'',
    obsDate: format(new Date(), 'yyyy-MM-dd'),
    techObs: '',
    treadDepth: '',
    consultantName: '',
    obsNo: '',
    obsStatus: 'Pending'
  });

  const [dealerViews, setDealerViews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return format(new Date(), 'yyyy-MM-dd');
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isNaN(date.getTime()) ? format(new Date(), 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  useEffect(() => {
    if (initialData) {
      // Determine obsStatus
      let obsStatus = 'Pending';
      if (initialData.obsNo) {
        if (initialData.obsNo.startsWith('R')) {
          obsStatus = 'Recommended';
        } else if (initialData.obsNo.startsWith('NR')) {
          obsStatus = 'Not Recommended';
        } else if (initialData.obsNo.startsWith('SCN')) {
          obsStatus = 'Forwarded for Management Decision';
        }
      }

      setFormData(prev => ({
        ...prev,
        ...initialData,
        receivedDate: formatDateForInput(initialData.receivedDate),
        obsDate: formatDateForInput(initialData.obsDate),
        obsStatus
      }));

      // 👉 ensure sizes load when editing
      if (initialData.brand) {
        getSizesByBrand(initialData.brand).then(({ data }) => {
          setSizes(data.map(s => s.size));
          setSizeOptions(data);

          const selectedSize = data.find(s => s.sizeCode === initialData.sizeCode);
          if (selectedSize) {
            setFormData(prev => ({
              ...prev,
              size: selectedSize.size,
              sizeCode: selectedSize.sizeCode
            }));
          }
        });
      }
    }

    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setDealerViews(data.dealerViews);
        setBrands(data.brands);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [initialData]);

  useEffect(() => {
    if (formData.dealerView) {
      getDealerByView(formData.dealerView)
        .then(({ data }) => {
          setFormData(prev => ({
            ...prev,
            dealerCode: data.dealerCode
          }));
        })
        .catch(err => console.error('Error fetching dealer:', err));
    }
  }, [formData.dealerView]);

  useEffect(() => {
    if (formData.brand) {
      getSizesByBrand(formData.brand)
        .then(({ data }) => {
          setSizes(data.map(s => s.size));
          setSizeOptions(data);
        })
        .catch(err => console.error('Error fetching sizes:', err));
    } else {
      setSizes([]);
      setSizeOptions([]);
      setFormData(prev => ({ ...prev, size: '', sizeCode: '' }));
    }
  }, [formData.brand]);

  const handleSizeChange = (e, newValue) => {
    if (newValue) {
      const selectedSize = sizeOptions.find(s => s.size === newValue);
      setFormData(prev => ({
        ...prev,
        size: newValue,
        sizeCode: selectedSize ? selectedSize.sizeCode : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, size: '', sizeCode: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, obsStatus: value }));

    if (value !== 'Pending') {
      try {
        let type = '';
        switch (value) {
          case 'Recommended': type = 'R'; break;
          case 'Not Recommended': type = 'NR'; break;
          case 'Forwarded for Management Decision': type = 'SCN'; break;
          default: return;
        }

        const { data } = await getNextObservationNumber(type);
        setFormData(prev => ({ ...prev, obsNo: data.nextNumber }));
      } catch (err) {
        console.error('Error generating observation number:', err);
      }
    } else {
      setFormData(prev => ({ ...prev, obsNo: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.claimNo || !formData.dealerView || !formData.brand || !formData.size || !formData.serialNo) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const basicData = {
          receivedDate: formData.receivedDate,
          claimNo: formData.claimNo,
          dealerView: formData.dealerView,
          dealerCode: formData.dealerCode,
          brand: formData.brand,
          size: formData.size,
          sizeCode: formData.sizeCode,
          serialNo: formData.serialNo,
        };

        const registerId = await createRegister(basicData);
        setMessage('Basic information saved successfully! Registration No: ' + registerId);
        setTimeout(() => onSuccess(), 2000);
      } else {
        await updateRegister(initialData.id, formData);
        setMessage('Registration updated successfully!');
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setMessage('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {technicalMode ? 'Add Technical Information' : mode === 'create' ? 'Add New UC Tyre' : 'Edit UC Tyre'}
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Received Date"
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={technicalMode}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Claim No"
                  name="claimNo"
                  value={formData.claimNo}
                  onChange={handleChange}
                  required
                  disabled={technicalMode}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Autocomplete
                  options={dealerViews}
                  value={formData.dealerView || ''}
                  onChange={(e, newValue) => setFormData(prev => ({ ...prev, dealerView: newValue }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Dealer View" required fullWidth />
                  )}
                  sx={{ minWidth: 250 }}
                  disabled={technicalMode}
                  freeSolo
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Dealer Code"
                  name="dealerCode"
                  value={formData.dealerCode}
                  onChange={handleChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    name="brand"
                    value={formData.brand}
                    label="Brand"
                    onChange={handleChange}
                    required
                    sx={{ minWidth: 250 }}
                    disabled={technicalMode}
                  >
                    {brands.map((brand) => (
                      <MenuItem key={brand} value={brand}>
                        {brand}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={sizes}
                  value={formData.size || ''}
                  onChange={handleSizeChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Size" required />
                  )}
                  disabled={technicalMode}
                  freeSolo
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Size Code"
                  name="sizeCode"
                  value={formData.sizeCode}
                  onChange={handleChange}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Serial No & DOT"
                    name="serialNo"
                    value={formData.serialNo}
                    onChange={handleChange}
                    placeholder="Enter the Serial No & DOT here..."
                  />
                </Grid>
            </Grid>
          </CardContent>
        </Card>

        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Observation Date"
                    type="date"
                    name="obsDate"
                    value={formData.obsDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Remaining Tread Depth"
                    name="treadDepth"
                    value={formData.treadDepth}
                    onChange={handleChange}
                    placeholder="e.g., 6,6,6,6"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Consultant Name</InputLabel>
                    <Select
                      name="consultantName"
                      value={formData.consultantName}
                      label="Consultant Name"
                      onChange={handleChange}
                    >
                      {consultants.map((c) => (
                        <MenuItem key={c.consultantName} value={c.consultantName}>
                          {c.consultantName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Observation Status</InputLabel>
                    <Select
                      name="obsStatus"
                      value={formData.obsStatus}
                      label="Observation Status"
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Recommended">Recommended</MenuItem>
                      <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                      <MenuItem value="Forwarded for Management Decision">Forwarded for Management Decision</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Observation Number"
                    name="obsNo"
                    value={formData.obsNo}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Technical Observation"
                    name="techObs"
                    value={formData.techObs}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    placeholder="Enter technical observations here..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={() => onSuccess()} variant="outlined">
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? 'Saving...' : (mode === 'create' ? 'Save Basic Info' : 'Save')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RegisterForm;
