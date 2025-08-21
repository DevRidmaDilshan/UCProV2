import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Alert,
  Button
} from '@mui/material';
import { getDashboardData } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setDashboardData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // More specific error messages
      if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else if (error.response) {
        // Server responded with error status
        setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check if the server is running.');
      } else {
        setError('Failed to load dashboard data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              RETRY
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No dashboard data available</Alert>
      </Box>
    );
  }

  const { statusCounts, brandCounts, monthlyCounts } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        UC Tyre Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Status Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" component="div">
                {statusCounts.pending || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Recommended
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {statusCounts.recommended || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Not Recommended
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {statusCounts.notRecommended || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Management Decision
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {statusCounts.managementDecision || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Brand Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tyre Distribution by Brand
            </Typography>
            {brandCounts && brandCounts.length > 0 ? (
              <Box>
                {brandCounts.map((brand, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{brand.brand}</Typography>
                    <Typography>{brand.count}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No brand data available</Typography>
            )}
          </Paper>
        </Grid>

        {/* Monthly Registrations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Registrations
            </Typography>
            {monthlyCounts && monthlyCounts.length > 0 ? (
              <Box>
                {monthlyCounts.map((month, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{month.month}</Typography>
                    <Typography>{month.count}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No monthly data available</Typography>
            )}
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Pending</Typography>
              <Typography>{statusCounts.pending || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Recommended</Typography>
              <Typography>{statusCounts.recommended || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Not Recommended</Typography>
              <Typography>{statusCounts.notRecommended || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Management Decision</Typography>
              <Typography>{statusCounts.managementDecision || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {statusCounts.total || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;