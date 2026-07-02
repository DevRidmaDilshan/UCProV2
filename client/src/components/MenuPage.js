// components/MenuPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Grid, Card, CardContent, FormControl,
  InputLabel, Select, MenuItem, Button, CircularProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert
} from '@mui/material';
import { Refresh } from '@mui/icons-material';

const API_BASE = 'http://localhost:5000/api';

const MenuPage = () => {
  const [month, setMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (selectedMonth) => {
    setLoading(true);
    setError('');
    try {
      // If no month provided, let backend pick the latest
      const params = selectedMonth ? { month: selectedMonth } : {};
      const res = await axios.get(`${API_BASE}/registers/menu-dashboard`, { params });
      console.log('✅ Dashboard data:', res.data);

      if (res.data) {
        setStats(res.data);
        if (res.data.availableMonths && res.data.availableMonths.length > 0) {
          setAvailableMonths(res.data.availableMonths);
          // Set the month to the one returned by backend (could be default)
          if (res.data.month) {
            setMonth(res.data.month);
          }
        } else {
          // No data at all
          setStats(null);
          setAvailableMonths([]);
          setMonth('');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setMonth(newMonth);
    fetchDashboardData(newMonth);
  };

  const handleRefresh = () => {
    if (month) {
      fetchDashboardData(month);
    } else {
      fetchDashboardData();
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Show loading state
  if (loading && initialLoad) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Menu Dashboard
      </Typography>

      {/* Controls */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={month}
                label="Month"
                onChange={handleMonthChange}
                disabled={loading || availableMonths.length === 0}
              >
                {availableMonths.map((m) => (
                  <MenuItem key={m} value={m}>
                    {formatMonthDisplay(m)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {availableMonths.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No Data Available</Typography>
          <Typography color="textSecondary">Please add some tyre registrations first.</Typography>
        </Paper>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          {/* Summary Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {stats.monthDisplay || stats.month || 'No Month'}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Monthly Received</Typography>
                    <Typography variant="h3">{stats.monthlyReceived}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Total Pending Count</Typography>
                    <Typography variant="h3">{stats.totalPendingCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Pending on this Month</Typography>
                    <Typography variant="h3">{stats.pendingThisMonth}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Daily Pending Breakdown */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Pending Counts for {stats.monthDisplay || stats.month}
            </Typography>
            {stats.dailyPending && stats.dailyPending.length === 0 ? (
              <Typography color="textSecondary">No pending tyres for this month</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell align="right"><strong>Pending Count</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.dailyPending && stats.dailyPending.map((row) => (
                      <TableRow key={row.receivedDate}>
                        <TableCell>{formatDate(row.receivedDate)}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      ) : null}
    </Box>
  );
};

// Helper: format "YYYY-MM" to "Mon-YYYY"
const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[parseInt(month) - 1] || month;
  return `${monthName}-${year}`;
};

export default MenuPage;