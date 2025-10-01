// components/RecheckList.jsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Card,
  CardContent,
  Grid,
  TablePagination
} from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { getAllRechecks, deleteRecheck } from '../services/api';
import RecheckForm from './RecheckForm';

const RecheckList = () => {
  const [rechecks, setRechecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editRecheck, setEditRecheck] = useState(null);
  const [viewRecheck, setViewRecheck] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchRechecks();
  }, []);

  const fetchRechecks = async () => {
    setLoading(true);
    try {
      const { data } = await getAllRechecks();
      setRechecks(data);
    } catch (error) {
      console.error('Error fetching rechecks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteRecheck(deleteId);
      fetchRechecks();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting recheck:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'Recommended':
        return <Chip label="Recommended" color="success" size="small" />;
      case 'Not Recommended':
        return <Chip label="Not Recommended" color="error" size="small" />;
      case 'Forwarded for Management Decision':
        return <Chip label="Management Decision" color="info" size="small" />;
      case 'Pending':
        return <Chip label="Pending" color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const filteredRechecks = rechecks.filter(recheck => {
    const search = searchTerm?.toLowerCase() || '';
    return (
      (recheck.reObsNo?.toLowerCase().includes(search)) ||
      (recheck.register?.claimNo?.toLowerCase().includes(search)) ||
      (recheck.register?.dealerView?.toLowerCase().includes(search)) ||
      (recheck.reObsStatus?.toLowerCase().includes(search))
    );
  });

  const sortedRechecks = [...filteredRechecks].sort(
    (a, b) => new Date(b.reObsDate) - new Date(a.reObsDate)
  );

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRechecks.length) : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Recheck Management
      </Typography>

      {/* Search and Add Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                label="Search by Recheck No, Claim No, Dealer, or Status"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setEditRecheck({})}
                sx={{ fontWeight: 'bold' }}
                fullWidth
                startIcon={<Add />}
              >
                Add New Recheck
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {editRecheck !== null && (
        <RecheckForm
          initialData={editRecheck}
          onSuccess={() => {
            fetchRechecks();
            setEditRecheck(null);
          }}
          mode={editRecheck && editRecheck.reNo ? 'edit' : 'create'}
        />
      )}

      {/* Rechecks Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 1200 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Recheck No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Reg No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Claim No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Dealer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Recheck Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Recheck Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Original Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Recheck Tread Depth</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">Loading...</TableCell>
              </TableRow>
            ) : sortedRechecks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No rechecks found</TableCell>
              </TableRow>
            ) : (
              sortedRechecks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((recheck) => (
                <TableRow key={recheck.reNo} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {recheck.reObsNo}
                  </TableCell>
                  <TableCell>{recheck.id}</TableCell>
                  <TableCell>{recheck.register?.claimNo}</TableCell>
                  <TableCell>{recheck.register?.dealerView}</TableCell>
                  <TableCell>
                    {recheck.reObsDate ? format(new Date(recheck.reObsDate), 'dd/MM/yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(recheck.reObsStatus)}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(recheck.register?.obsStatus || 'Pending')}
                  </TableCell>
                  <TableCell>{recheck.reTreadDepth || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewRecheck(recheck)} title="View Details">
                      <Visibility color="primary" />
                    </IconButton>
                    <IconButton 
                      onClick={() => setEditRecheck(recheck)} 
                      title="Edit"
                      sx={{ color: '#424242' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => setDeleteId(recheck.reNo)} title="Delete">
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={9} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRechecks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this recheck? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={Boolean(viewRecheck)}
        onClose={() => setViewRecheck(null)}
        maxWidth="md"
        fullWidth
      >
        {viewRecheck && (
          <>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
              Recheck Details - {viewRecheck.reObsNo}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Recheck Number:</Typography>
                    <Typography>{viewRecheck.reObsNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Recheck Date:</Typography>
                    <Typography>
                      {viewRecheck.reObsDate ? format(new Date(viewRecheck.reObsDate), 'dd/MM/yyyy') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Registration Number:</Typography>
                    <Typography>{viewRecheck.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Claim Number:</Typography>
                    <Typography>{viewRecheck.register?.claimNo}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Status Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Recheck Status:</Typography>
                    <Typography>{viewRecheck.reObsStatus}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Original Status:</Typography>
                    <Typography>{viewRecheck.register?.obsStatus || 'Pending'}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Technical Details</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Recheck Tread Depth:</Typography>
                    <Typography>{viewRecheck.reTreadDepth || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Recheck Observation:</Typography>
                    <Typography style={{ whiteSpace: 'pre-line' }}>
                      {viewRecheck.reObs || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Register Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer:</Typography>
                    <Typography>{viewRecheck.register?.dealerView}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Brand:</Typography>
                    <Typography>{viewRecheck.register?.brand}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Size:</Typography>
                    <Typography>{viewRecheck.register?.size}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Serial No:</Typography>
                    <Typography>{viewRecheck.register?.serialNo || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewRecheck(null)} color="primary">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setViewRecheck(null);
                  setEditRecheck(viewRecheck);
                }}
                color="secondary"
              >
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RecheckList;