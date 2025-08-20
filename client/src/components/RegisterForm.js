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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { format } from 'date-fns';
import { 
  getInitialData, 
  getDealerByView, 
  getSizesByBrand, 
  getSizeDetails,
  createRegister,
  updateRegister,
  getAllConsultants
} from '../services/api';

const RegisterForm = ({ initialData, onSuccess, mode = 'create' }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    receivedDate: format(new Date(), 'yyyy-MM-dd'),
    claimNo: '',
    dealerView: '',
    dealerCode: '',
    brand: '',
    size: '',
    sizeCode: '',
    obsDate: format(new Date(), 'yyyy-MM-dd'),
    techObs: '',
    treadDepth: '',
    consultantName: '',
    obsNo: ''
  });

  const [dealerViews, setDealerViews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);

  const steps = ['Basic Information', 'Technical Details'];

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        receivedDate: initialData.receivedDate || format(new Date(), 'yyyy-MM-dd'),
        obsDate: initialData.obsDate || format(new Date(), 'yyyy-MM-dd')
      }));
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
      const fetchDealer = async () => {
        try {
          const { data } = await getDealerByView(formData.dealerView);
          setFormData(prev => ({
            ...prev,
            dealerCode: data.dealerCode
          }));
        } catch (error) {
          console.error('Error fetching dealer:', error);
        }
      };
      fetchDealer();
    }
  }, [formData.dealerView]);

  useEffect(() => {
    if (formData.brand) {
      const fetchSizes = async () => {
        try {
          const { data } = await getSizesByBrand(formData.brand);
          setSizes(data);
        } catch (error) {
          console.error('Error fetching sizes:', error);
        }
      };
      fetchSizes();
    }
  }, [formData.brand]);

  useEffect(() => {
    if (formData.size) {
      const fetchSizeDetails = async () => {
        try {
          const { data } = await getSizeDetails(formData.size);
          if (data && data.sizeCode) {
            setFormData(prev => ({
              ...prev,
              sizeCode: data.sizeCode
            }));
          }
        } catch (error) {
          console.error('Error fetching size details:', error);
        }
      };
      fetchSizeDetails();
    }
  }, [formData.size]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields based on step
    if (activeStep === 0 && (!formData.claimNo || !formData.dealerView || !formData.brand || !formData.size)) {
      alert('Please fill all required fields');
      return;
    }
    
    if (activeStep === 1 && mode === 'edit') {
      // For edit mode, submit the form
      setLoading(true);
      try {
        // Filter out non-register fields
        const { dealerName, dealerLocation, ...submitData } = formData;
        await updateRegister(initialData.id, submitData);
        onSuccess();
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error saving data. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 0 && mode === 'create') {
      // For create mode, move to next step
      handleNext();
    }
  };

  const submitCreate = async () => {
    setLoading(true);
    try {
      await createRegister(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating register:', error);
      alert('Error creating record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        {mode === 'create' ? 'Add New UC Tyre' : 'Edit UC Tyre'}
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit}>
        {activeStep === 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Received Date"
                    type="date"
                    name="receivedDate"
                    value={formData.receivedDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Claim No"
                    name="claimNo"
                    value={formData.claimNo}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={dealerViews}
                    value={formData.dealerView}
                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, dealerView: newValue }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Dealer View"
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dealer Code"
                    name="dealerCode"
                    value={formData.dealerCode}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Brand</InputLabel>
                    <Select
                      name="brand"
                      value={formData.brand}
                      label="Brand"
                      onChange={handleChange}
                      required
                    >
                      {brands.map((brand) => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={sizes.map(size => size.size)}
                    value={formData.size}
                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, size: newValue }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Size"
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Size Code"
                    name="sizeCode"
                    value={formData.sizeCode}
                    onChange={handleChange}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeStep === 1 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Technical Observation"
                    name="techObs"
                    value={formData.techObs}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Remaining Tread Depth"
                    name="treadDepth"
                    value={formData.treadDepth}
                    onChange={handleChange}
                    placeholder="e.g., 6,6,6,6"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Consultant Name</InputLabel>
                    <Select
                      name="consultantName"
                      value={formData.consultantName}
                      label="Consultant Name"
                      onChange={handleChange}
                    >
                      {consultants.map((consultant) => (
                        <MenuItem key={consultant.consultantName} value={consultant.consultantName}>
                          {consultant.consultantName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Observation No</InputLabel>
                    <Select
                      name="obsNo"
                      value={formData.obsNo}
                      label="Observation No"
                      onChange={handleChange}
                    >
                      <MenuItem value="R">Recommended (R__)</MenuItem>
                      <MenuItem value="NR">Not Recommended (NR__)</MenuItem>
                      <MenuItem value="SCN">Forwarded for management decision (SCN__)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={mode === 'create' ? handleNext : handleSubmit}
            >
              Next
            </Button>
          )}
        </Box>

        {mode === 'create' && activeStep === 1 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Button 
              variant="contained" 
              color="success"
              onClick={submitCreate}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Creating...' : 'Create Registration'}
            </Button>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default RegisterForm;