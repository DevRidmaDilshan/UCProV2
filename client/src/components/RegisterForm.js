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
  Autocomplete
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
  const [formData, setFormData] = useState({
  receivedDate: format(new Date(), 'yyyy-MM-dd'),
  claimNo: '',
  dealerView: '',
  dealerCode: '',
  brand: '',
  size: '',
  sizeCode: '',
  obsDate: '',
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

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        receivedDate: initialData.receivedDate || format(new Date(), 'yyyy-MM-dd')
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
        if (data) {
          setFormData(prev => ({
            ...prev,
            sizeCode: data.sizeCode || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching size details:', error);
        setFormData(prev => ({ ...prev, sizeCode: '' }));
      }
    };
    fetchSizeDetails();
  } else {
    setFormData(prev => ({ ...prev, sizeCode: '' }));
  }
}, [formData.size]);

// Update the handleChange function to handle nulls
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};


const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!formData.claimNo || !formData.dealerView || !formData.brand || !formData.size) {
    alert('Please fill all required fields');
    return;
  }

  setLoading(true);
  try {
    // Prepare data for submission
    const submissionData = {
      ...formData,
      // Convert empty strings to null for dates
      obsDate: formData.obsDate || null
    };

    if (mode === 'create') {
      await createRegister(submissionData);
    } else {
      await updateRegister(initialData.id, submissionData);
    }
    onSuccess();
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Error saving data. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {mode === 'create' ? 'Add New UC Tyre' : 'Edit UC Tyre'}
      </Typography>
      <form onSubmit={handleSubmit}>
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
          
          {mode === 'edit' && (
            <>
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Remaining Tread Depth"
                  name="treadDepth"
                  value={formData.treadDepth}
                  onChange={handleChange}
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
                    <MenuItem value="R__">Recommended (R__)</MenuItem>
                    <MenuItem value="NR__">Not Recommended (NR__)</MenuItem>
                    <MenuItem value="SCN__">Forwarded for management decision (SCN__)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default RegisterForm;