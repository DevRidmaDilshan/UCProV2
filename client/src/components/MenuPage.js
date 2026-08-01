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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (selectedMonth) => {
    setLoading(true);
    setError('');
    try {
      const params = selectedMonth ? { month: selectedMonth } : {};
      const res = await axios.get(`${API_BASE}/registers/menu-dashboard`, { params });
      if (res.data) {
        setStats(res.data);
        if (res.data.availableMonths && res.data.availableMonths.length > 0) {
          setAvailableMonths(res.data.availableMonths);
          if (res.data.month) setMonth(res.data.month);
        } else {
          setStats(null);
          setAvailableMonths([]);
          setMonth('');
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.response?.data?.error || 'Failed to load data');
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
    if (month) fetchDashboardData(month);
    else fetchDashboardData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

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
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Monthly Received</Typography>
                    <Typography variant="h3">{stats.monthlyReceived}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Total Pending Count</Typography>
                    <Typography variant="h3">{stats.totalPendingCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Pending on this Month</Typography>
                    <Typography variant="h3">{stats.pendingThisMonth}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#f3e5f5' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="textSecondary">Received on Today</Typography>
                    <Typography variant="h3">{stats.todayReceived}</Typography>
                    <Typography variant="caption">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Pending by Brand - Two Tables (Total & Monthly) */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Total Pending by Brand (All Time)
                </Typography>
                {stats.totalPendingByBrand && stats.totalPendingByBrand.length === 0 ? (
                  <Typography color="textSecondary">No pending tyres</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Brand</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>% of Total Pending</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.totalPendingByBrand && stats.totalPendingByBrand.map((row) => (
                          <TableRow key={row.brand}>
                            <TableCell>{row.brand}</TableCell>
                            <TableCell align="right">{row.count}</TableCell>
                            <TableCell align="right">
                              {stats.totalPendingCount > 0 ? ((row.count / stats.totalPendingCount) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Pending by Brand ({stats.monthDisplay})
                </Typography>
                {stats.monthlyPendingByBrand && stats.monthlyPendingByBrand.length === 0 ? (
                  <Typography color="textSecondary">No pending tyres for this month</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Brand</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>% of Monthly Pending</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.monthlyPendingByBrand && stats.monthlyPendingByBrand.map((row) => (
                          <TableRow key={row.brand}>
                            <TableCell>{row.brand}</TableCell>
                            <TableCell align="right">{row.count}</TableCell>
                            <TableCell align="right">
                              {stats.pendingThisMonth > 0 ? ((row.count / stats.pendingThisMonth) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
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