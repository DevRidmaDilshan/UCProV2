import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { generateReport, getInitialData, getAllConsultants } from '../services/api';
import { format } from 'date-fns';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brand: '',
    size: '',
    consultant: ''
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [consultants, setConsultants] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setBrands(data.brands);
        
        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const { data } = await generateReport(filters);
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Reg No', 'Received Date', 'Claim No', 'Dealer', 'Brand', 'Size', 'Status', 'Consultant'];
    const csvData = reportData.map(item => [
      item.id,
      item.receivedDate ? format(new Date(item.receivedDate), 'dd/MM/yyyy') : 'N/A',
      item.claimNo,
      item.dealerName || item.dealerCode,
      item.brand,
      item.size,
      item.serialNo,
      item.obsNo || 'Pending',
      item.consultantName || 'N/A'
    ].join(','));

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'uc_tyre_report.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Report Generator
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Brand</InputLabel>
            <Select
              name="brand"
              value={filters.brand}
              label="Brand"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Brands</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>
                  {brand}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Consultant</InputLabel>
            <Select
              name="consultant"
              value={filters.consultant}
              label="Consultant"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Consultants</MenuItem>
              {consultants.map((consultant) => (
                <MenuItem key={consultant.consultantName} value={consultant.consultantName}>
                  {consultant.consultantName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
        <Button 
          variant="outlined" 
          onClick={handleExportCSV}
          disabled={reportData.length === 0}
        >
          Export to CSV
        </Button>
      </Box>

      {reportData.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reg No</TableCell>
                <TableCell>Received Date</TableCell>
                <TableCell>Claim No</TableCell>
                <TableCell>Dealer</TableCell>
                <TableCell>Dealer Code</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Size Code</TableCell>
                <TableCell>Observation Date</TableCell>
                <TableCell>Remaining Tread Depth</TableCell>
                <TableCell>Technical Observation</TableCell>
                <TableCell>Observation No</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Consultant</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.receivedDate ? format(new Date(item.receivedDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{item.claimNo}</TableCell>
                  <TableCell>{item.dealerName || item.dealerCode}</TableCell>
                  <TableCell>{item.dealerCode}</TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.sizeCode}</TableCell>
                  <TableCell>{item.serialNo}</TableCell>
                  <TableCell>{item.obsDate ? format(new Date(item.obsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{item.treadDepth}</TableCell>
                  <TableCell>{item.techObs}</TableCell>
                  <TableCell>{item.obsNo || 'N/A'}</TableCell>
                  <TableCell>{item.obsStatus}</TableCell>
                  <TableCell>{item.consultantName || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ReportGenerator;