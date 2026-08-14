// RegisterForm.js
import React, { useState, useEffect, useCallback } from 'react';
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
import axios from 'axios';

const API_BASE_URL = '/api';

const RegisterForm = ({ initialData, onSuccess, mode = 'create', technicalMode = false }) => {
  const [formData, setFormData] = useState({
    receivedDate: format(new Date(), 'yyyy-MM-dd'),
    claimNo: '',
    dealerView: '',
    dealerCode: '',
    brand: '',
    size: '',
    sizeCode: '',
    serialNo: '',
    originalTread: '',
    obsDate: format(new Date(), 'yyyy-MM-dd'),
    techObs: '',
    treadDepth: '',
    consultantName: '',
    obsNo: '',
    obsStatus: 'Pending',
    locationName: '',
    stackName: ''
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

  // Locations and stacks state
  const [locations, setLocations] = useState([]);
  const [stacks, setStacks] = useState([]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return format(new Date(), 'yyyy-MM-dd');
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isNaN(date.getTime()) ? format(new Date(), 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  // ---------- PRINT FUNCTION (copied from RegisterList) ----------
  const printRegister = (register) => {
    let headerTitle = "PENDING NOTE";
    let noteNumberLabel = "PENDING No";
    
    if (register.obsStatus === 'Recommended') {
      headerTitle = "CLAIM REFUND NOTE";
      noteNumberLabel = "CR No";
    } else if (register.obsStatus === 'Not Recommended') {
      headerTitle = "NO REFUND NOTE";
      noteNumberLabel = "NR No";
    } else if (register.obsStatus === 'Forwarded for Management Decision') {
      headerTitle = "SPECIAL CONSIDERATION NOTE";
      noteNumberLabel = "SCN No";
    }

    const formattedTechObs = register.techObs ? register.techObs.replace(/\n/g, '<br/>') : 'N/A';

    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <title>${headerTitle} - ${register.obsNo}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 13px;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          border: 1px solid #000;
          padding: 10px;
          box-sizing: border-box;
        }
        .header {
          text-align: right;
          margin-bottom: 5px;
        }
        .header div {
          margin: 2px 0;
        }
        .title {
          text-align: center;
          font-weight: bold;
          font-size: 25px;
          margin: 5px 0 15px;
          text-transform: uppercase;
          text-decoration: underline;
        }
        table {
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
          vertical-align: middle;
        }
        .claim-info {
          width: 45%;
          margin-left: auto;
          margin-bottom: 15px;
        }
        .claim-info th, .claim-info td {
          height: 25px;
        }
        .agent-customer {
          width: 100%;
        }
        .agent-customer th, .agent-customer td {
          height: 30px;
        }
        .tyre-details {
          width: 100%;
        }
        .tyre-details th, .tyre-details td {
          height: 25px;
        }
        .observations {
          width: 100%;
        }
        .observations td {
          height: auto;
          min-height: 80px;
          text-align: left;
          padding: 8px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin: 40px 0 20px;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }
        .refund-table {
          width: 60%;
          margin: 0 0 20px auto;
        }
        .refund-table th, .refund-table td {
          height: 15px;
        }
        .approval {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .approval div {
          width: 45%;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          margin-top: 20px;
          font-style: italic;
        }
        @media print {
          body { 
            margin: 0;
            padding: 0;
          }
          .container {
            border: none;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
      </head>
      <body>
      <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
      </div>
        <div class="container">
          <div class="header">
            <div>Reg. No:<b>${register.id}</b></div>
            <div>${noteNumberLabel}: <b>${register.obsNo || 'N/A'}</b></div>
          </div>
          <div class="title">${headerTitle}</div>
          <table class="claim-info">
            <tr>
              <th style="width: 50%;">Claim No</th>
              <th>Date of Claim</th>
            </tr>
            <tr>
              <td>${register.claimNo}</td>
              <td></td>
            </tr>
          </table>
          <table class="agent-customer" style="width:100%;">
            <tr>
              <th style="width: 50%;">AGENT</th>
              <th>CUSTOMER</th>
            </tr>
            <tr>
              <td>${register.dealerView || 'N/A'}</td>
              <td></td>
            </tr>
          </table>
          <table class="tyre-details">
            <tr>
              <th style="width: 33%;">Brand</th>
              <th style="width: 34%;">Size</th>
              <th style="width: 33%;">Serial No</th>
            </tr>
            <tr>
              <td>${register.brand}</td>
              <td>${register.size}</td>
              <td>${register.serialNo || 'N/A'}</td>
            </tr>
          </table>
          <table class="observations">
            <tr>
              <th style="width: 25%; text-align: left; height: 80px;">Technical Observations :</th>
              <td style="width: 75%; height: auto; text-align: left;">${formattedTechObs}</td>
            </tr>
          </table>
          <table class="observations">
            <tr>
              <th style="width: 25%; text-align: left; height: 20px;">Remaining Tread Depth :</th>
              <td style="width: 75%; height: 20px; text-align: center;">${register.treadDepth || 'N/A'}</td>
            </tr>
          </table>
          <b>
            ${register.obsStatus === 'Recommended' 
              ? 'Refund : Recommended' 
              : register.obsStatus === 'Forwarded for Management Decision' 
                ? 'Forwarded for Management Decision' 
              : register.obsStatus === 'Not Recommended' 
                ? 'Refund : Not Recommended'
                : 'Refund : Not Recommended'}
          </b>
          <div class="signatures">
            <div class="signature-box">
              ${register.obsDate ? format(new Date(register.obsDate), 'dd/MM/yyyy') : 'N/A'} <br>
              <br>
              <b>Date</b>
            </div>
            <div class="signature-box">
              __________________________ <br>
              <br>
              <b>Consultant in Tyre Technology</b>
            </div>
          </div>
          <br>
          _________________________________________________________________________________________________<br>
          <br>
          <br>
          <table class="refund-table">
            <tr>
              <th colspan="2">NSD</th>
              <th colspan="2">Refund</th>
            </tr>
            <tr>
              <th>Spec</th>
              <th>Remaining</th>
              <th>%</th>
              <th>Rs.</th>
            </tr>
            <tr>
              <td style="height: 30px;">${register.originalTread || ''}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </table>
          <div class="approval">
            <div>Approved by:</div>
            <div>Accepted by:</div>
          </div>
          <div class="footer">
          <br><br>
          ______________________________________________________________________________________________________________<br>
            <b><i>N.B.A refunded claim tyre becomes the property of Wheels (Pvt) Ltd.</i></b>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
  };
  // ----------------------------------------------------------------

  const parseTechnicalObservations = useCallback((techObsText) => {
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

      const numberedMatch = trimmed.match(/^\d+\)\s+(.+)$/);
      const observationText = numberedMatch ? numberedMatch[1] : trimmed;

      const predefinedObs = observations.find(obs =>
        observationText.startsWith(`${obs.obId} - ${obs.observation}`) || observationText === obs.observation
      );

      if (predefinedObs) {
        newSelected.push({
          id: predefinedObs.obId,
          observation: predefinedObs.observation,
          isCustom: false
        });
      } else {
        newSelected.push({
          id: `CUSTOM-${Date.now()}`,
          observation: observationText,
          isCustom: true
        });
      }
    });

    setSelectedObservations(newSelected);
    setManufacturingDefect(defect);
    setNoManufacturingDefect(noDefect);
  }, [observations]);

  // Load all initial data including locations & stacks
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setDealerViews(data.dealerViews);
        setBrands(data.brands);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data || []);

        const observationsRes = await getAllObservations();
        setObservations(observationsRes.data || []);

        const [locationsRes, stacksRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/registers/locations/all`),
          axios.get(`${API_BASE_URL}/registers/stacks/all`)
        ]);
        setLocations(locationsRes.data);
        setStacks(stacksRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setMessage('Failed to load initial data.');
      }
    };
    fetchInitialData();
  }, []);

  // Populate form when editing
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
        obsStatus,
        locationName: initialData.locationName || '',
        stackName: initialData.stackName || ''
      }));

      // Fetch sizes for the brand and match the selected size
      if (initialData.brand) {
        getSizesByBrand(initialData.brand)
          .then(({ data }) => {
            setSizes(data.map(s => s.size));
            setSizeOptions(data);
            // Find the size that matches either sizeCode or originalTread
            let selectedSize = data.find(s => s.sizeCode === initialData.sizeCode);
            if (!selectedSize) {
              selectedSize = data.find(s => s.originalTread === initialData.originalTread);
            }
            if (selectedSize) {
              setFormData(prev => ({
                ...prev,
                size: selectedSize.size,
                sizeCode: selectedSize.sizeCode,
                originalTread: selectedSize.originalTread
              }));
            }
          })
          .catch(err => console.error('Error fetching sizes:', err));
      }

      if (initialData.techObs) {
        parseTechnicalObservations(initialData.techObs);
      }

      setHasParsedInitialData(true);
    }
  }, [initialData, hasParsedInitialData, observations, parseTechnicalObservations]);

  // Fetch dealer code when dealerView changes
  useEffect(() => {
    if (formData.dealerView) {
      getDealerByView(formData.dealerView)
        .then(({ data }) => {
          setFormData(prev => ({ ...prev, dealerCode: data.dealerCode }));
        })
        .catch(err => console.error('Error fetching dealer:', err));
    }
  }, [formData.dealerView]);

  // Fetch sizes when brand changes
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
      setFormData(prev => ({ ...prev, size: '', sizeCode: '', originalTread: '' }));
    }
  }, [formData.brand]);

  // Update techObs whenever selected observations or defect flags change
  useEffect(() => {
    let text = '';
    selectedObservations.forEach((obs, i) => {
      text += `${i + 1}) ${obs.observation}\n`;
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
        sizeCode: selectedSize ? selectedSize.sizeCode : '',
        originalTread: selectedSize ? selectedSize.originalTread : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, size: '', sizeCode: '', originalTread: '' }));
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
        setFormData(prev => {
          const currentObsNo = prev.obsNo;
          if (!currentObsNo || !currentObsNo.startsWith(type)) {
            getNextObservationNumber(type)
              .then(({ data }) => {
                setFormData(prevState => ({ ...prevState, obsNo: data.nextNumber }));
              })
              .catch(err => console.error('Error generating observation number:', err));
          }
          return prev;
        });
      } catch (err) {
        console.error('Error generating observation number:', err);
      }
    } else {
      setFormData(prev => ({ ...prev, obsNo: '' }));
    }
  };

  const addObservation = () => {
    if (currentObservation && !selectedObservations.find(obs => obs.id === currentObservation.obId)) {
      setSelectedObservations(prev => [
        ...prev,
        {
          id: currentObservation.obId,
          observation: currentObservation.observation,
          isCustom: false
        }
      ]);
      setCurrentObservation(null);
    }
  };

  const removeObservation = (id) => {
    setSelectedObservations(prev => prev.filter(obs => obs.id !== id));
  };

  const addCustomObservation = () => {
    if (customObservation.trim()) {
      setSelectedObservations(prev => [
        ...prev,
        {
          id: `CUSTOM-${Date.now()}`,
          observation: customObservation.trim(),
          isCustom: true
        }
      ]);
      setCustomObservation('');
    }
  };

  // ---------- NEW SUBMIT HANDLER: Save & Print ----------
  const handleSaveAndPrint = async (e) => {
    e.preventDefault();

    // Validation (same as before)
    if (!formData.claimNo || !formData.dealerView || !formData.brand || !formData.size || !formData.serialNo) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let savedId;
      if (mode === 'create') {
        const basicData = {
          receivedDate: formData.receivedDate,
          claimNo: formData.claimNo,
          dealerView: formData.dealerView,
          dealerCode: formData.dealerCode,
          brand: formData.brand,
          size: formData.size,
          sizeCode: formData.sizeCode,
          originalTread: formData.originalTread,
          serialNo: formData.serialNo,
        };
        savedId = await createRegister(basicData);
        // Build full register object for printing
        const registerData = {
          id: savedId,
          ...formData,
        };
        printRegister(registerData);
        setMessage(`Basic information saved successfully! Registration No: ${savedId}`);
        setTimeout(() => onSuccess(), 2000);
      } else {
        // Edit mode
        await updateRegister(initialData.id, formData);
        const registerData = {
          id: initialData.id,
          ...formData,
        };
        printRegister(registerData);
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
  // ----------------------------------------------------------------

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

      <form onSubmit={handleSaveAndPrint}>
        {/* Basic Info Card */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Basic Information</Typography>
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
                required
              />
              <TextField
                fullWidth
                label="Original Tread Depth"
                name="originalTread"
                value={formData.originalTread}
                onChange={handleChange}
                disabled
              />
            </Box>
          </CardContent>
        </Card>

        {/* Technical Details Card */}
        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Technical Details</Typography>

              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="Observation Date"
                  type="date"
                  name="obsDate"
                  value={formData.obsDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Remaining Tread Depth"
                  name="treadDepth"
                  value={formData.treadDepth}
                  onChange={handleChange}
                  placeholder="e.g., 6,6,6,6"
                />
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Consultant Name</InputLabel>
                  <Select
                    name="consultantName"
                    value={formData.consultantName || ''}
                    label="Consultant Name"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {consultants.map(c => (
                      <MenuItem key={c.consultantName} value={c.consultantName}>
                        {c.consultantName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    <MenuItem value="Forwarded for Management Decision">
                      Forwarded for Management Decision
                    </MenuItem>
                    <MenuItem value="Return to Dealer">Return to Dealer</MenuItem>
                    <MenuItem value="Sent to CEAT">Sent to CEAT</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Observation Number"
                name="obsNo"
                value={formData.obsNo}
                onChange={handleChange}
                disabled
              />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Technical Observations
              </Typography>
              <Box display="flex" gap={2} mb={2}>
                <Autocomplete
                  options={observations}
                  getOptionLabel={(option) => `${option.obId} - ${option.observation}`}
                  value={currentObservation}
                  onChange={(event, newValue) => setCurrentObservation(newValue)}
                  isOptionEqualToValue={(option, value) => option.obId === value?.obId}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Observation" />
                  )}
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={addObservation} disabled={!currentObservation} color="primary">
                  <AddIcon />
                </IconButton>
              </Box>

              {selectedObservations.length > 0 && (
                <List dense sx={{ border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                  {selectedObservations.map((obs, i) => (
                    <ListItem key={obs.id}>
                      <ListItemText primary={`${i + 1}) ${obs.observation}`} />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => removeObservation(obs.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="Custom Observation"
                  value={customObservation}
                  onChange={(e) => setCustomObservation(e.target.value)}
                  multiline
                  rows={2}
                />
                <IconButton onClick={addCustomObservation} disabled={!customObservation.trim()} color="primary">
                  <AddIcon />
                </IconButton>
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={manufacturingDefect}
                      onChange={(e) => setManufacturingDefect(e.target.checked)}
                    />
                  }
                  label="Manufacturing Defect"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={noManufacturingDefect}
                      onChange={(e) => setNoManufacturingDefect(e.target.checked)}
                    />
                  }
                  label="No Manufacturing Defect"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Technical Observation"
                value={formData.techObs}
                InputProps={{ style: { whiteSpace: 'pre-line' } }}
              />
            </CardContent>
          </Card>
        )}

        {/* Location & Stack Card */}
        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location & Stacking
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    name="locationName"
                    value={formData.locationName || ''}
                    label="Location"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.locationID || loc.locationName} value={loc.locationName}>
                        {loc.locationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Stack</InputLabel>
                  <Select
                    name="stackName"
                    value={formData.stackName || ''}
                    label="Stack"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {stacks.map((stk) => (
                      <MenuItem key={stk.stackID || stk.stackName} value={stk.stackName}>
                        {stk.stackName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={() => onSuccess()} variant="outlined">
            Cancel
          </Button>
          {/* Save button changed to Save & Print */}
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Print'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RegisterForm;