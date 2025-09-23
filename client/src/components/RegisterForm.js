import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Paper, 
  Typography,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { 
  getInitialData, 
  getDealerByView, 
  getSizesByBrand, 
  createRegister,
  updateRegister,
  getAllConsultants,
  getNextObservationNumber,
  getAllObservations
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
  const [observations, setObservations] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [customObservation, setCustomObservation] = useState('');
  const [manufacturingDefect, setManufacturingDefect] = useState(false);
  const [noManufacturingDefect, setNoManufacturingDefect] = useState(false);
  const [currentObservation, setCurrentObservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasParsedInitialData, setHasParsedInitialData] = useState(false);

  // Format date safely
  const formatDateForInput = (dateString) => {
    if (!dateString) return format(new Date(), 'yyyy-MM-dd');
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isNaN(date.getTime()) ? format(new Date(), 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  // Parse techObs into selections
  const parseTechnicalObservations = (techObsText) => {
    if (!techObsText) return;

    const lines = techObsText.split('\n').filter(line => line.trim() !== '');
    const newSelected = [];
    let defect = false;
    let noDefect = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '(Manufacturing Defect)') {
        defect = true;
        return;
      }
      if (trimmed === '(No Manufacturing Defect)') {
        noDefect = true;
        return;
      }

      // strip numbering if exists
      const numberedMatch = trimmed.match(/^\d+\)\s+(.+)$/);
      const observationText = numberedMatch ? numberedMatch[1] : trimmed;

      const predefinedObs = observations.find(obs => 
        observationText.startsWith(`${obs.obId} - `) || observationText === obs.observation
      );

      if (predefinedObs) {
        newSelected.push({ ...predefinedObs, isCustom: false });
      } else {
        newSelected.push({ obId: `CUSTOM-${Date.now()}`, observation: observationText, isCustom: true });
      }
    });

    setSelectedObservations(newSelected);
    setManufacturingDefect(defect);
    setNoManufacturingDefect(noDefect);
  };

  // Load initial + observations
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setDealerViews(data.dealerViews);
        setBrands(data.brands);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data);

        const observationsRes = await getAllObservations();
        setObservations(observationsRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Populate formData from initialData
  useEffect(() => {
    if (initialData && !hasParsedInitialData) {
      let obsStatus = 'Pending';
      if (initialData.obsNo) {
        if (initialData.obsNo.startsWith('R')) obsStatus = 'Recommended';
        else if (initialData.obsNo.startsWith('NR')) obsStatus = 'Not Recommended';
        else if (initialData.obsNo.startsWith('SCN')) obsStatus = 'Forwarded for Management Decision';
      }

      setFormData(prev => ({
        ...prev,
        ...initialData,
        receivedDate: formatDateForInput(initialData.receivedDate),
        obsDate: formatDateForInput(initialData.obsDate),
        obsStatus
      }));

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

      if (initialData.techObs) {
        parseTechnicalObservations(initialData.techObs);
      }

      setHasParsedInitialData(true);
    }
  }, [initialData, hasParsedInitialData, observations]);

  useEffect(() => {
    if (formData.dealerView) {
      getDealerByView(formData.dealerView)
        .then(({ data }) => {
          setFormData(prev => ({ ...prev, dealerCode: data.dealerCode }));
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

  // Update techObs string
  useEffect(() => {
    let text = '';
    selectedObservations.forEach((obs, i) => {
      text += obs.isCustom ? `${i + 1}) ${obs.observation}\n` : `${i + 1}) ${obs.obId} - ${obs.observation}\n`;
    });
    if (manufacturingDefect) text += '(Manufacturing Defect)\n';
    if (noManufacturingDefect) text += '(No Manufacturing Defect)\n';
    setFormData(prev => ({ ...prev, techObs: text }));
  }, [selectedObservations, manufacturingDefect, noManufacturingDefect]);

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

    if (mode === 'create' && value !== 'Pending' && !formData.obsNo) {
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
    } else if (value === 'Pending') {
      setFormData(prev => ({ ...prev, obsNo: '' }));
    }
  };

  const addObservation = () => {
    if (currentObservation && !selectedObservations.find(obs => obs.obId === currentObservation.obId)) {
      setSelectedObservations(prev => [...prev, { ...currentObservation, isCustom: false }]);
      setCurrentObservation(null);
    }
  };

  const removeObservation = (obId) => {
    setSelectedObservations(prev => prev.filter(obs => obs.obId !== obId));
  };

  const addCustomObservation = () => {
    if (customObservation.trim()) {
      setSelectedObservations(prev => [
        ...prev,
        { obId: `CUSTOM-${Date.now()}`, observation: customObservation.trim(), isCustom: true }
      ]);
      setCustomObservation('');
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
        const updateData = { ...formData, obsNo: initialData?.obsNo || formData.obsNo };
        await updateRegister(initialData.id, updateData);
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
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '900px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {technicalMode ? 'Add Technical Information' : mode === 'create' ? 'Add New UC Tyre' : 'Edit UC Tyre'}
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Basic Information</Typography>
            {/* ... your fields same as before ... */}
            {/* Row 1: Received Date + Claim No */}
            <Box display="flex" gap={2} mb={2}>
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
              <TextField
                fullWidth
                label="Claim No"
                name="claimNo"
                value={formData.claimNo}
                onChange={handleChange}
                required
              />
            </Box>

            {/* Row 2: Dealer View + Dealer Code */}
            <Box display="flex" gap={2} mb={2}>
              <Autocomplete
                options={dealerViews}
                value={formData.dealerView || ''}
                onChange={(e, newValue) => setFormData(prev => ({ ...prev, dealerView: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Dealer View" required fullWidth />
                )}
                freeSolo
                sx={{ flex: 3 }}
              />
              <TextField
                label="Dealer Code"
                name="dealerCode"
                value={formData.dealerCode}
                onChange={handleChange}
                disabled
                sx={{ flex: 1 }}
              />
            </Box>

            {/* Row 3: Brand + Size */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl sx={{ flex: 1 }}>
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

              <Autocomplete
                options={sizes}
                value={formData.size || ''}
                onChange={handleSizeChange}
                renderInput={(params) => (
                  <TextField {...params} label="Size" required fullWidth />
                )}
                freeSolo
                sx={{ flex: 3 }} 
              />
            </Box>

            {/* Row 4: Size Code + Serial No */}
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Size Code"
                name="sizeCode"
                value={formData.sizeCode}
                onChange={handleChange}
                disabled
              />
              <TextField
                fullWidth
                label="Serial No & DOT"
                name="serialNo"
                value={formData.serialNo}
                onChange={handleChange}
                placeholder="Enter the Serial No & DOT here..."
              />
            </Box>
          </CardContent>
        </Card>

        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Technical Details</Typography>

              <Box display="flex" gap={2} mb={2}>
                <TextField fullWidth label="Observation Date" type="date" name="obsDate"
                  value={formData.obsDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth label="Remaining Tread Depth" name="treadDepth"
                  value={formData.treadDepth} onChange={handleChange} placeholder="e.g., 6,6,6,6" />
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Consultant Name</InputLabel>
                  <Select name="consultantName" value={formData.consultantName} onChange={handleChange}>
                    {consultants.map(c => (
                      <MenuItem key={c.consultantName} value={c.consultantName}>{c.consultantName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Observation Status</InputLabel>
                  <Select name="obsStatus" value={formData.obsStatus} onChange={handleStatusChange}>
                    <MenuItem value="">Pending</MenuItem>
                    <MenuItem value="Recommended">Recommended</MenuItem>
                    <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                    <MenuItem value="Forwarded for Management Decision">Forwarded for Management Decision</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField fullWidth label="Observation Number" name="obsNo"
                value={formData.obsNo} onChange={handleChange} disabled />

              <Typography variant="subtitle1" gutterBottom>Technical Observations</Typography>
              <Box display="flex" gap={2} mb={2}>
                <Autocomplete
                  options={observations}
                  getOptionLabel={(o) => `${o.obId} - ${o.observation}`}
                  value={currentObservation}
                  onChange={(e, val) => setCurrentObservation(val)}
                  renderInput={(params) => <TextField {...params} label="Select Observation" />}
                />
                <IconButton onClick={addObservation} disabled={!currentObservation}><AddIcon /></IconButton>
              </Box>

              {selectedObservations.length > 0 && (
                <List dense sx={{ border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                  {selectedObservations.map((obs, i) => (
                    <ListItem key={obs.obId}>
                      <ListItemText primary={obs.isCustom ? `${i + 1}) ${obs.observation}` : `${i + 1}) ${obs.obId} - ${obs.observation}`} />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => removeObservation(obs.obId)}><DeleteIcon /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Box display="flex" gap={2} mb={2}>
                <TextField fullWidth label="Custom Observation" value={customObservation}
                  onChange={(e) => setCustomObservation(e.target.value)} multiline />
                <IconButton onClick={addCustomObservation} disabled={!customObservation.trim()}><AddIcon /></IconButton>
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={manufacturingDefect} onChange={(e) => setManufacturingDefect(e.target.checked)} />} label="Manufacturing Defect" />
                <FormControlLabel control={<Checkbox checked={noManufacturingDefect} onChange={(e) => setNoManufacturingDefect(e.target.checked)} />} label="No Manufacturing Defect" />
              </Box>

              <TextField fullWidth multiline rows={4} label="Technical Observation"
                value={formData.techObs} InputProps={{ style: { whiteSpace: 'pre-line' } }} />
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={() => onSuccess()} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving...' : (mode === 'create' ? 'Save Basic Info' : 'Save')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RegisterForm;

