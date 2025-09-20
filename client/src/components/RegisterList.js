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
import { Edit, Delete, Print, Visibility, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { getAllRegisters, deleteRegister } from '../services/api';
import RegisterForm from './RegisterForm';

const RegisterList = () => {
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [regNoSearch, setRegNoSearch] = useState('');
  const [editRegister, setEditRegister] = useState(null);
  const [technicalRegister, setTechnicalRegister] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewRegister, setViewRegister] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    setLoading(true);
    try {
      const { data } = await getAllRegisters();
      setRegisters(data);
    } catch (error) {
      console.error('Error fetching registers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteRegister(deleteId);
      fetchRegisters();
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting register:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (register) => {
    if (!register.obsStatus || register.obsStatus === 'Pending') {
      return <Chip label="Pending" color="warning" size="small" />;
    }
    
    switch(register.obsStatus) {
      case 'Recommended':
        return <Chip label="Recommended" color="success" size="small" />;
      case 'Not Recommended':
        return <Chip label="Not Recommended" color="error" size="small" />;
      case 'Forwarded for Management Decision':
        return <Chip label="Management Decision" color="info" size="small" />;
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrint = (register) => {
    // Determine header and note number based on observation status
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

        /* Header (top-right) */
        .header {
          text-align: right;
          margin-bottom: 5px;
        }
        .header div {
          margin: 2px 0;
        }

        /* Title */
        .title {
          text-align: center;
          font-weight: bold;
          font-size: 25px;
          margin: 5px 0 15px;
          text-transform: uppercase;
          text-decoration: underline;
        }

        /* Generic table */
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

        /* Claim Info Table (small right box) */
        .claim-info {
          width: 45%;   /* control width */
          margin-left: auto; /* push to right */
          margin-bottom: 15px;
        }
        .claim-info th, .claim-info td {
          height: 25px; /* control height */
        }

        /* Agent/Customer */
        .agent-customer {
          width: 100%;
        }
        .agent-customer th, .agent-customer td {
          height: 30px;
        }

        /* Tyre details */
        .tyre-details {
          width: 100%;
        }
        .tyre-details th, .tyre-details td {
          height: 25px;
        }

        /* Observations */
        .observations {
          width: 100%;
        }
        .observations td {
          height: 60px; /* bigger height for text area */
        }

        /* Signatures row */
        .signatures {
          display: flex;
          justify-content: space-between;
          margin: 40px 0 20px;
        }
        .signature-box {
          width: 45%;
          text-align: center;
        }

        /* Refund Table */
        .refund-table {
          width: 60%;              /* control size */
          margin: 0 0 20px auto;   /* push to right */
        }
        .refund-table th, .refund-table td {
          height: 15px;
        }


        /* Approval */
        .approval {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .approval div {
          width: 45%;
        }

        /* Footer */
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

          <!-- Header -->
          <div class="header">
            <div>Reg. No:<b>${register.id}</b></div>
            <div>${noteNumberLabel}: <b>${register.obsNo || 'N/A'}</b></div>
          </div>

          <!-- Title -->
          <div class="title">${headerTitle}</div>

          <!-- Claim Info -->
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

          <!-- Agent / Customer -->
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

          <!-- Tyre Details -->
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

          <!-- Observations & Tread Depth -->
          <table class="observations">
            <tr>
              <th style="width: 25%; text-align: left; height: 80px;">Technical Observations :</th>
              <td style="width: 75%; height: 80px; text-align: center;">${register.techObs || 'N/A'}</td>
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
          

          <!-- Observation Date & Consultant -->
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


          <!-- Refund Table -->
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
              <td style="height: 30px;"></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </table>

          <!-- Approval -->
          <div class="approval">
            <div>Approved by:</div>
            <div>Accepted by:</div>
          </div>

          <!-- Footer -->
          <div class="footer">
          <br><br>
          _______________________________________________________________________<br>
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

  const filteredRegisters = registers.filter(register => {
    const search = searchTerm?.toLowerCase() || '';
    return (
      (regNoSearch ? register.id?.toString().includes(regNoSearch) : true) &&
      (search ? (
        (register.claimNo ?? '').toLowerCase().includes(search) ||
        (register.dealerCode ?? '').toLowerCase().includes(search) ||
        (register.serialNo ?? '').toLowerCase().includes(search) ||
        (register.obsNo ?? '').toLowerCase().includes(search) ||
        (register.dealerName ?? '').toLowerCase().includes(search)
      ) : true)
    );
  });

  const sortedRegisters = [...filteredRegisters].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredRegisters.length) : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        UC Tyre Register
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search by Reg No"
                variant="outlined"
                size="small"
                value={regNoSearch}
                onChange={(e) => setRegNoSearch(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search by Claim No, Dealer Code or Name"
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
                onClick={() => setEditRegister({})}
                sx={{ fontWeight: 'bold' }}
                fullWidth
              >
                Add New Registration
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {editRegister !== null && (
        <RegisterForm
          initialData={editRegister}
          onSuccess={() => {
            fetchRegisters();
            setEditRegister(null);
          }}
          mode={editRegister && editRegister.id ? 'edit' : 'create'}
        />
      )}

      {technicalRegister !== null && (
        <RegisterForm
          initialData={technicalRegister}
          onSuccess={() => {
            fetchRegisters();
            setTechnicalRegister(null);
          }}
          mode="edit"
          technicalMode={true}
        />
      )}

      <TableContainer 
        component={Paper} 
        elevation={3} 
        sx={{ 
          maxHeight: '60vh',
          overflow: 'auto',
          '& .MuiTableRow-root': {
            position: 'relative'
          }
        }}
      >
        <Table stickyHeader sx={{ minWidth: 1500 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              {/* First three columns with sticky positioning */}
              <TableCell sx={{ 
                fontWeight: 'bold', 
                position: 'sticky', 
                left: 0, 
                zIndex: 3, 
                backgroundColor: '#f5f5f5',
                minWidth: 120
              }}>
                Reg No
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                position: 'sticky', 
                left: 120, 
                zIndex: 3, 
                backgroundColor: '#f5f5f5',
                minWidth: 120
              }}>
                Received Date
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                position: 'sticky', 
                left: 240, 
                zIndex: 3, 
                backgroundColor: '#f5f5f5',
                minWidth: 120
              }}>
                Claim No
              </TableCell>
              
              {/* Remaining columns */}
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Dealer</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Dealer Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Brand</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Size Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Serial No</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Observation NO</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Consultant</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Remaining Tread Depth</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Observation Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Technical Observation</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                position: 'sticky', 
                right: 250, 
                backgroundColor: '#f5f5f5',
                zIndex: 3,
                minWidth: 150
              }}>
                Status
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold', 
                position: 'sticky', 
                right: 0, 
                backgroundColor: '#f5f5f5',
                zIndex: 3,
                minWidth: 250,
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center">Loading...</TableCell>
              </TableRow>
            ) : sortedRegisters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">No registers found</TableCell>
              </TableRow>
            ) : (
              sortedRegisters
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((register) => (
                <TableRow key={register.id} hover>
                  {/* First three sticky columns */}
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 2, 
                    backgroundColor: 'white',
                    minWidth: 120
                  }}>
                    {register.id}
                  </TableCell>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    left: 120, 
                    zIndex: 2, 
                    backgroundColor: 'white',
                    minWidth: 120
                  }}>
                    {register.receivedDate ? format(new Date(register.receivedDate), 'dd/MM/yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    left: 240, 
                    zIndex: 2, 
                    backgroundColor: 'white',
                    minWidth: 120
                  }}>
                    {register.claimNo}
                  </TableCell>
                  
                  {/* Remaining columns */}
                  <TableCell sx={{ minWidth: 150 }}>
                    {register.dealerName || register.dealerCode}
                    {register.dealerLocation && ` (${register.dealerLocation})`}
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.dealerCode}</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{register.brand}</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{register.size}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.sizeCode || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.serialNo || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.obsNo || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.consultantName || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.treadDepth || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.obsDate ? format(new Date(register.obsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>{register.techObs || 'N/A'}</TableCell>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    right: 250, 
                    backgroundColor: 'white',
                    zIndex: 2,
                    minWidth: 150
                  }}>
                    {getStatusChip(register)}
                  </TableCell>
                  <TableCell sx={{ 
                    position: 'sticky', 
                    right: 0, 
                    backgroundColor: 'white',
                    zIndex: 2,
                    minWidth: 250
                  }}>
                    <IconButton onClick={() => setViewRegister(register)} title="View Details">
                      <Visibility color="primary" />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        const registerData = { ...register };
                        delete registerData.dealerName;
                        delete registerData.dealerLocation;
                        setEditRegister(registerData);
                      }} 
                      title="Edit"
                      sx={{ color: '#424242' }}
                    >
                      <Edit />
                    </IconButton>
                    {!register.obsDate && (
                      <IconButton 
                        onClick={() => {
                          const registerData = { ...register };
                          delete registerData.dealerName;
                          delete registerData.dealerLocation;
                          setTechnicalRegister(registerData);
                        }} 
                        title="Add Technical Info"
                        sx={{ color: '#2e7d32' }}
                      >
                        <Add />
                      </IconButton>
                    )}
                    <IconButton onClick={() => setDeleteId(register.id)} title="Delete">
                      <Delete color="error" />
                    </IconButton>
                    <IconButton onClick={() => handlePrint(register)} title="Print">
                      <Print />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={12} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRegisters.length}
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
            Are you sure you want to delete this register? This action cannot be undone.
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
        open={Boolean(viewRegister)}
        onClose={() => setViewRegister(null)}
        maxWidth="md"
        fullWidth
      >
        {viewRegister && (
          <>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
              Register Details - #{viewRegister.id}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Received Date:</Typography>
                    <Typography>{viewRegister.receivedDate ? format(new Date(viewRegister.receivedDate), 'dd/MM/yyyy') : 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Claim No:</Typography>
                    <Typography>{viewRegister.claimNo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer:</Typography>
                    <Typography>{viewRegister.dealerName || viewRegister.dealerCode}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer Location:</Typography>
                    <Typography>{viewRegister.dealerLocation || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Dealer View:</Typography>
                    <Typography>{viewRegister.dealerView}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom>Tyre Information</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Brand:</Typography>
                    <Typography>{viewRegister.brand}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Size:</Typography>
                    <Typography>{viewRegister.size}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Size Code:</Typography>
                    <Typography>{viewRegister.sizeCode || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Serial No & DOT:</Typography>
                    <Typography>{viewRegister.serialNo || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                {viewRegister.obsDate && (
                  <>
                    <Typography variant="h6" gutterBottom>Technical Details</Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Observation Date:</Typography>
                        <Typography>{format(new Date(viewRegister.obsDate), 'dd/MM/yyyy')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Technical Observation:</Typography>
                        <Typography>{viewRegister.techObs || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Remaining Tread Depth:</Typography>
                        <Typography>{viewRegister.treadDepth || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Consultant Name:</Typography>
                        <Typography>{viewRegister.consultantName || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Observation Status:</Typography>
                        <Typography>{viewRegister.obsStatus || 'Pending'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Observation No:</Typography>
                        <Typography>{viewRegister.obsNo || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewRegister(null)} color="primary">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setViewRegister(null);
                  const registerData = { ...viewRegister };
                  delete registerData.dealerName;
                  delete registerData.dealerLocation;
                  setEditRegister(registerData);
                }}
                color="secondary"
              >
                Edit
              </Button>
              <Button 
                onClick={() => handlePrint(viewRegister)}
                startIcon={<Print />}
              >
                Print
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RegisterList;