// components/BrandReport.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api';

const BrandReport = () => {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/registers/initial-data`);
        setBrands(res.data.brands || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBrands();
  }, []);

  const handleGenerate = async () => {
    if (!selectedBrand) {
      setError('Please select a brand');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/registers/brand-report`, {
        params: { brand: selectedBrand, startDate, endDate }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendedBreakdown = () => {
    const { breakdown } = reportData.recommended;
    if (!breakdown || breakdown.length === 0) {
      return <Typography>No Recommended claims in this period.</Typography>;
    }

    return (
      <Box sx={{ mt: 2 }}>
        {breakdown.map((item, idx) => (
          <Accordion key={idx} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                {item.obsCategory} &nbsp; <strong>({item.total} tyres)</strong>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Size Category</strong></TableCell>
                      <TableCell align="right"><strong>Count</strong></TableCell>
                      <TableCell align="right"><strong>% within this defect</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.sizeCategories.map((size, i) => (
                      <TableRow key={i}>
                        <TableCell>{size.name}</TableCell>
                        <TableCell align="right">{size.count}</TableCell>
                        <TableCell align="right">
                          {((size.count / item.total) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  if (!reportData) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Brand Report
        </Typography>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Select Brand</InputLabel>
                <Select
                  value={selectedBrand}
                  label="Select Brand"
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="From Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="To Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Brand Report
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Select Brand</InputLabel>
              <Select
                value={selectedBrand}
                label="Select Brand"
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="From Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="To Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={loading}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Total Received</Typography>
              <Typography variant="h3">{reportData.totalReceived}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#4caf50', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">R (Recommended)</Typography>
              <Typography variant="h3">{reportData.recommended.total}</Typography>
              <Typography variant="body2">
                {((reportData.recommended.total / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f44336', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">NR</Typography>
              <Typography variant="h3">{reportData.nr}</Typography>
              <Typography variant="body2">
                {((reportData.nr / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ff9800', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">SCN</Typography>
              <Typography variant="h3">{reportData.scn}</Typography>
              <Typography variant="body2">
                {((reportData.scn / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#9e9e9e', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Pending</Typography>
              <Typography variant="h3">{reportData.pending}</Typography>
              <Typography variant="body2">
                {((reportData.pending / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommended Breakdown */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Recommended Breakdown by Defect Category and Size Category
      </Typography>
      {renderRecommendedBreakdown()}
    </Box>
  );
};

export default BrandReport;