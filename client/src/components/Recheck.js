// components/Recheck.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Box, Grid, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Autocomplete, Card, CardContent, IconButton, List, ListItem,
  ListItemText, ListItemSecondaryAction, Checkbox, FormControlLabel, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Save, Print, Refresh, Edit, Delete, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const API_BASE = 'http://localhost:5000/api';

const Recheck = () => {
  const [searchType, setSearchType] = useState('id');
  const [registerList, setRegisterList] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [registerDetails, setRegisterDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rechecks, setRechecks] = useState([]);
  const [message, setMessage] = useState('');
  const [observations, setObservations] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [customObservation, setCustomObservation] = useState('');
  const [manufacturingDefect, setManufacturingDefect] = useState(false);
  const [noManufacturingDefect, setNoManufacturingDefect] = useState(false);
  const [currentObservation, setCurrentObservation] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    reObsDate: format(new Date(), 'yyyy-MM-dd'),
    reObsStatus: '',
    reObs: '',
    reTreadDepth: ''
  });

  useEffect(() => {
    fetchRegisterList();
    fetchAllRechecks();
    fetchObservations();
  }, []);

  const fetchRegisterList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rechecks/register-list`);
      setRegisterList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllRechecks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/rechecks/all`);
      setRechecks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/observations`);
      setObservations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSelect = async (event, newValue) => {
    setSelectedRegister(newValue);
    if (newValue) {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/rechecks/register-details`, {
          params: { searchType, value: newValue[searchType] }
        });
        setRegisterDetails(res.data);
        // Reset form
        setFormData({
          reObsDate: format(new Date(), 'yyyy-MM-dd'),
          reObsStatus: '',
          reObs: '',
          reTreadDepth: ''
        });
        setSelectedObservations([]);
        setManufacturingDefect(false);
        setNoManufacturingDefect(false);
        setEditMode(false);
      } catch (err) {
        console.error(err);
        setRegisterDetails(null);
      } finally {
        setLoading(false);
      }
    } else {
      setRegisterDetails(null);
    }
  };

  // Build techObs string from selections
  const buildTechObs = () => {
    let text = '';
    selectedObservations.forEach((obs, i) => {
      text += `${i + 1}) ${obs.observation}\n`;
    });
    if (manufacturingDefect) text += '(Manufacturing Defect)\n';
    if (noManufacturingDefect) text += '(No Manufacturing Defect)\n';
    return text.trim();
  };

  const addObservation = () => {
    if (currentObservation && !selectedObservations.find(obs => obs.id === currentObservation.obId)) {
      setSelectedObservations(prev => [
        ...prev,
        { id: currentObservation.obId, observation: currentObservation.observation, isCustom: false }
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
        { id: `CUSTOM-${Date.now()}`, observation: customObservation.trim(), isCustom: true }
      ]);
      setCustomObservation('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!selectedRegister) {
      setMessage('Please select a register');
      return;
    }
    if (!formData.reObsDate || !formData.reObsStatus) {
      setMessage('Recheck date and status are required');
      return;
    }
    const techObsString = buildTechObs();
    setSaving(true);
    setMessage('');
    try {
      if (editMode) {
        await axios.put(`${API_BASE}/rechecks/${editId}`, {
          reObsDate: formData.reObsDate,
          reObsStatus: formData.reObsStatus,
          reObs: techObsString,
          reTreadDepth: formData.reTreadDepth
        });
        setMessage('Recheck updated successfully');
      } else {
        await axios.post(`${API_BASE}/rechecks/save`, {
          id: selectedRegister.id,
          reObsDate: formData.reObsDate,
          reObsStatus: formData.reObsStatus,
          reObs: techObsString,
          reTreadDepth: formData.reTreadDepth
        });
        setMessage('Recheck saved successfully');
      }
      // Reset form
      setFormData({
        reObsDate: format(new Date(), 'yyyy-MM-dd'),
        reObsStatus: '',
        reObs: '',
        reTreadDepth: ''
      });
      setSelectedObservations([]);
      setManufacturingDefect(false);
      setNoManufacturingDefect(false);
      setSelectedRegister(null);
      setRegisterDetails(null);
      setEditMode(false);
      fetchAllRechecks();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error saving recheck');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recheck) => {
    setEditMode(true);
    setEditId(recheck.id);
    setSelectedRegister({ id: recheck.id, obsNo: recheck.obsNo });
    setRegisterDetails({
      claimNo: recheck.claimNo,
      dealerView: recheck.dealerView,
      brand: recheck.brand,
      size: recheck.size,
      serialNo: recheck.serialNo,
      obsNo: recheck.obsNo,
      obsDate: recheck.obsDate,
      obsStatus: recheck.obsStatus,
      techObs: recheck.techObs,
      treadDepth: recheck.treadDepth
    });
    setFormData({
      reObsDate: recheck.reObsDate ? format(new Date(recheck.reObsDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      reObsStatus: recheck.reObsStatus || '',
      reObs: recheck.reObs || '',
      reTreadDepth: recheck.reTreadDepth || ''
    });
    // Parse existing reObs into selectedObservations
    if (recheck.reObs) {
      const lines = recheck.reObs.split('\n').filter(l => l.trim());
      const newSelected = [];
      lines.forEach(line => {
        if (line.includes('(Manufacturing Defect)')) {
          setManufacturingDefect(true);
        } else if (line.includes('(No Manufacturing Defect)')) {
          setNoManufacturingDefect(true);
        } else {
          const match = line.match(/^\d+\)\s+(.+)$/);
          const obsText = match ? match[1] : line;
          const found = observations.find(o => obsText.includes(o.observation) || o.observation === obsText);
          if (found) {
            newSelected.push({ id: found.obId, observation: found.observation, isCustom: false });
          } else {
            newSelected.push({ id: `CUSTOM-${Date.now()}`, observation: obsText, isCustom: true });
          }
        }
      });
      setSelectedObservations(newSelected);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/rechecks/${deleteId}`);
      fetchAllRechecks();
      setDeleteId(null);
      setMessage('Recheck deleted successfully');
    } catch (err) {
      console.error(err);
      setMessage('Error deleting recheck');
    }
  };

  const handlePrint = (recheck) => {
    const printWindow = window.open('', '_blank');
    const logoHtml = `<img src="/recheck.png" alt="Logo" style="height: 60px; float: left;">`;
    const recheckDisplay = recheck.reNo ? `RE${recheck.reNo.toString().padStart(4, '0')}` : recheck.reObsNo;
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recheck Note - ${recheckDisplay}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .container { max-width: 900px; margin: auto; border: 1px solid #000; padding: 20px; position: relative; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .logo { position: absolute; top: 20px; left: 20px; }
          .title { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; text-decoration: underline; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
          th { background: #f0f0f0; text-align: center; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .footer { margin-top: 20px; font-size: 10px; text-align: center; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${logoHtml}</div>
          <div class="header">
            <h1>RECHECK NOTE</h1>
            <p>Recheck No: ${recheckDisplay} | Reg No: ${recheck.id} | Obs No: ${recheck.obsNo || 'N/A'}</p>
          </div>
          <div class="title">TYRE INSPECTION REPORT</div>
          <table>
            <tr><th style="width: 20%;">Claim No</th><td colspan="3">${recheck.claimNo || 'N/A'}</td></tr>
            <tr><th>Dealer</th><td>${recheck.dealerView || 'N/A'}</td><th>Brand</th><td>${recheck.brand || 'N/A'}</td></tr>
            <tr><th>Size</th><td>${recheck.size || 'N/A'}</td><th>Serial No</th><td>${recheck.serialNo || 'N/A'}</td></tr>
            <tr><th colspan="4">Previous Observation</th></tr>
            <tr><th>Date</th><td colspan="3">${recheck.obsDate ? format(new Date(recheck.obsDate), 'dd/MM/yyyy') : 'N/A'}</td></tr>
            <tr><th>Status</th><td colspan="3">${recheck.obsStatus || 'N/A'}</td></tr>
            <tr><th>Technical Observation</th><td colspan="3">${(recheck.techObs || 'N/A').replace(/\n/g, '<br/>')}</td></tr>
            <tr><th>Remaining Tread Depth</th><td colspan="3">${recheck.treadDepth || 'N/A'}</td></tr>
            <tr><th colspan="4">Present Observation (Recheck)</th></tr>
            <tr><th>Date</th><td colspan="3">${recheck.reObsDate ? format(new Date(recheck.reObsDate), 'dd/MM/yyyy') : 'N/A'}</td></tr>
            <tr><th>Status</th><td colspan="3">${recheck.reObsStatus || 'N/A'}</td></tr>
            <tr><th>Technical Observation</th><td colspan="3">${(recheck.reObs || 'N/A').replace(/\n/g, '<br/>')}</td></tr>
            <tr><th>Remaining Tread Depth</th><td colspan="3">${recheck.reTreadDepth || 'N/A'}</td></tr>
          </table>
          <div class="signatures">
            <div>Date: ${recheck.reObsDate ? format(new Date(recheck.reObsDate), 'dd/MM/yyyy') : 'N/A'}</div>
            <div>Consultant in Tyre Technology</div>
          </div>
          <div class="footer">This is a computer generated document – valid without signature</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Recheck Management
      </Typography>

      {/* Selection Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={(e) => setSearchType(e.target.value)}>
                <MenuItem value="id">Reg No</MenuItem>
                <MenuItem value="obsNo">Observation No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={registerList}
              getOptionLabel={(option) => `${searchType === 'id' ? option.id : option.obsNo} - ${option.obsNo || ''}`}
              value={selectedRegister}
              onChange={handleRegisterSelect}
              renderInput={(params) => <TextField {...params} label="Select Register" />}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRegisterList}>Refresh List</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Previous Details */}
      {registerDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">Previous Observation Details</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}><strong>Claim No:</strong> {registerDetails.claimNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Dealer:</strong> {registerDetails.dealerView}</Grid>
              <Grid item xs={12} sm={6}><strong>Brand:</strong> {registerDetails.brand}</Grid>
              <Grid item xs={12} sm={6}><strong>Size:</strong> {registerDetails.size}</Grid>
              <Grid item xs={12} sm={6}><strong>Serial No:</strong> {registerDetails.serialNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs No:</strong> {registerDetails.obsNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs Date:</strong> {registerDetails.obsDate ? format(new Date(registerDetails.obsDate), 'dd/MM/yyyy') : 'N/A'}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs Status:</strong> {registerDetails.obsStatus}</Grid>
              <Grid item xs={12}><strong>Technical Observation:</strong><br/>{registerDetails.techObs || 'N/A'}</Grid>
              <Grid item xs={12}><strong>Tread Depth:</strong> {registerDetails.treadDepth || 'N/A'}</Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recheck Form */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">{editMode ? 'Edit Recheck' : 'Present Observation (Recheck)'}</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Recheck Date" type="date" name="reObsDate"
              value={formData.reObsDate} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Recheck Status</InputLabel>
              <Select name="reObsStatus" value={formData.reObsStatus} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Recommended">Recommended</MenuItem>
                <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                <MenuItem value="Forwarded for Management Decision">Forwarded for Management Decision</MenuItem>
                <MenuItem value="Return to Dealer">Return to Dealer</MenuItem>
                <MenuItem value="Sent to CEAT">Sent to CEAT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Observations Selection UI */}
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
            renderInput={(params) => <TextField {...params} label="Select Observation" />}
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
            fullWidth label="Custom Observation" value={customObservation}
            onChange={(e) => setCustomObservation(e.target.value)} multiline rows={2}
          />
          <IconButton onClick={addCustomObservation} disabled={!customObservation.trim()} color="primary">
            <AddIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <FormControlLabel
            control={<Checkbox checked={manufacturingDefect} onChange={(e) => setManufacturingDefect(e.target.checked)} />}
            label="Manufacturing Defect"
          />
          <FormControlLabel
            control={<Checkbox checked={noManufacturingDefect} onChange={(e) => setNoManufacturingDefect(e.target.checked)} />}
            label="No Manufacturing Defect"
          />
        </Box>

        <TextField
          fullWidth multiline rows={4} label="Technical Observation (Preview)"
          value={buildTechObs()} InputProps={{ style: { whiteSpace: 'pre-line' } }}
        />

        <TextField
          fullWidth label="Recheck Tread Depth (e.g., 6,6,6,6)" name="reTreadDepth"
          value={formData.reTreadDepth} onChange={handleChange} sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (editMode ? 'Update Recheck' : 'Save Recheck')}
          </Button>
          {editMode && (
            <Button variant="outlined" onClick={() => {
              setEditMode(false);
              setSelectedRegister(null);
              setRegisterDetails(null);
              setFormData({
                reObsDate: format(new Date(), 'yyyy-MM-dd'),
                reObsStatus: '',
                reObs: '',
                reTreadDepth: ''
              });
              setSelectedObservations([]);
            }}>
              Cancel Edit
            </Button>
          )}
        </Box>
        {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>}
      </Paper>

      {/* All Rechecks Table */}
      <Typography variant="h5" gutterBottom>All Rechecks</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reg No</TableCell>
              <TableCell>Recheck No</TableCell>
              <TableCell>Obs No</TableCell>
              <TableCell>Obs Date</TableCell>
              <TableCell>Tech Obs</TableCell>
              <TableCell>Tread Depth</TableCell>
              <TableCell>Recheck Date</TableCell>
              <TableCell>Recheck Status</TableCell>
              <TableCell>Recheck Obs</TableCell>
              <TableCell>Recheck Tread</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rechecks.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.reNo ? `RE${row.reNo.toString().padStart(4, '0')}` : row.reObsNo}</TableCell>
                <TableCell>{row.obsNo}</TableCell>
                <TableCell>{row.obsDate ? format(new Date(row.obsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'pre-wrap' }}>{row.techObs?.substring(0, 50)}...</TableCell>
                <TableCell>{row.treadDepth}</TableCell>
                <TableCell>{row.reObsDate ? format(new Date(row.reObsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>{row.reObsStatus}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{row.reObs?.substring(0, 50)}...</TableCell>
                <TableCell>{row.reTreadDepth}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handlePrint(row)} title="Print"><Print fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleEdit(row)} title="Edit"><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setDeleteId(row.id)} title="Delete"><Delete fontSize="small" color="error" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this recheck?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recheck;