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
    
    switch (register.obsStatus) {
      case 'Recommended':
        return <Chip label="Recommended" color="success" size="small" />;
      case 'Not Recommended':
        return <Chip label="Not Recommended" color="error" size="small" />;
      case 'Forwarded for Management Decision':
        return <Chip label="Management Decision" color="info" size="small" />;
      case 'Return to Dealer':
        return (
          <Chip
            label="Return to Dealer"
            size="small"
            sx={{ backgroundColor: '#ff9800', color: '#fff' }}
          />
        );
      case 'Sent to CEAT':
        return (
          <Chip
            label="Sent to CEAT"
            size="small"
            sx={{ backgroundColor: '#9c27b0', color: '#fff' }}
          />
        );
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

  // ---------- PRINT FUNCTION (copied from RegisterForm) ----------
  const handlePrint = (register) => {
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

/* =========================================================
   A4 PAGE
   ========================================================= */

@page {
  size: A4 portrait;
  margin: 0;
}


/* =========================================================
   GLOBAL
   ========================================================= */

* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Times New Roman", Times, serif;
  font-size: 15px;
  line-height: 1.15;
  color: #000;
  background: #fff;
}


/* =========================================================
   A4 PAGE CONTAINER
   ========================================================= */

.page {
  position: relative;

  width: 210mm;
  height: 297mm;

  margin: 0 auto;

  padding: 10mm 12mm 27mm 12mm;

  background: #fff;

  overflow: hidden;

  box-sizing: border-box;
}


/* =========================================================
   MAIN CONTAINER
   ========================================================= */

.container {
  width: 100%;

  margin: 0;
  padding: 0;

  border: none;

  box-sizing: border-box;
}


/* =========================================================
   HEADER
   ========================================================= */

.header {
  text-align: right;

  margin-bottom: 3px;

  font-size: 15px;

  line-height: 1.2;
}

.header div {
  margin: 1px 0;
}

.header b {
  font-size: 16px;
}


/* =========================================================
   MAIN TITLE
   ========================================================= */

.title {
  text-align: center;

  font-weight: bold;

  font-size: 28px;

  line-height: 1.1;

  margin: 4px 0 10px;

  text-transform: uppercase;

  text-decoration: underline;
}


/* =========================================================
   ALL TABLES
   ========================================================= */

table {
  border-collapse: collapse;

  width: 100%;

  margin-bottom: 9px;

  font-family: "Times New Roman", Times, serif;

  font-size: 15px;

  page-break-inside: avoid;
}

th,
td {
  border: 1px solid #000;

  padding: 6px 8px;

  text-align: center;

  vertical-align: middle;

  font-family: "Times New Roman", Times, serif;
}

th {
  font-size: 16px;

  font-weight: bold;
}

td {
  font-size: 15px;
}


/* =========================================================
   CLAIM INFORMATION
   ========================================================= */

.claim-info {
  width: 45%;

  margin-left: auto;

  margin-bottom: 10px;
}

.claim-info th {
  height: 32px;

  font-size: 16px;
}

.claim-info td {
  height: 40px;

  font-size: 16px;
}


/* =========================================================
   AGENT / CUSTOMER
   ========================================================= */

.agent-customer {
  width: 100%;

  margin-bottom: 10px;
}

.agent-customer th {
  height: 35px;

  font-size: 16px;
}

.agent-customer td {
  height: 46px;

  font-size: 16px;
}


/* =========================================================
   TYRE DETAILS
   ========================================================= */

.tyre-details {
  width: 100%;

  margin-bottom: 10px;
}

.tyre-details th {
  height: 36px;

  font-size: 16px;
}

.tyre-details td {
  height: 44px;

  font-size: 16px;
}


/* =========================================================
   OBSERVATIONS
   ========================================================= */

.observations {
  width: 100%;

  margin-bottom: 10px;
}

.observations th {
  font-size: 16px;

  font-weight: bold;
}

.observations td {
  font-size: 16px;

  text-align: left;

  padding: 8px 10px;

  line-height: 1.35;
}


/* =========================================================
   TECHNICAL OBSERVATION
   ========================================================= */

.observations:first-of-type th {
  height: 95px;

  vertical-align: top;
}

.observations:first-of-type td {
  height: 95px;

  min-height: 95px;

  vertical-align: top;
}


/* =========================================================
   REMAINING TREAD DEPTH
   ========================================================= */

.observations:nth-of-type(2) th {
  height: 45px;

  text-align: left;

  vertical-align: middle;
}

.observations:nth-of-type(2) td {
  height: 45px;

  text-align: center;

  vertical-align: middle;

  font-size: 16px;
}


/* =========================================================
   REFUND STATUS
   ========================================================= */

.refund-status {
  display: block;

  font-size: 17px;

  font-weight: bold;

  margin-top: 7px;

  margin-bottom: 3px;
}

/* =========================================================
   SIGNATURE SECTION
   ========================================================= */

.signatures {
  display: flex;

  justify-content: center;

  align-items: flex-start;

  width: 100%;

  margin-top: 35px;

  margin-bottom: 10px;

  page-break-inside: avoid;

  /* Move signature slightly to the left */
  transform: translateX(-15px);
}

.signature-box {
  width: 55%;

  text-align: center;

  font-size: 15px;

  line-height: 1.3;

  min-height: 65px;
}

.signature-box b {
  font-size: 15px;
}


/* =========================================================
   SIGNATURE LINE
   ========================================================= */

.signature-line {
  font-size: 15px;

  letter-spacing: 0.5px;
}

/* =========================================================
   DIVIDER
   ========================================================= */

.divider {
  width: 100%;

  border-top: 1px solid #000;

  margin: 8px 0 12px;
}


/* =========================================================
   REFUND TABLE
   ========================================================= */

.refund-table {
  width: 60%;

  margin: 0 0 12px auto;

  font-size: 15px;

  page-break-inside: avoid;
}

.refund-table th {
  height: 32px;

  font-size: 15px;
}

.refund-table td {
  height: 45px;

  font-size: 15px;
}


/* =========================================================
   APPROVAL SECTION
   ========================================================= */

.approval-section {
  width: 100%;

  margin-top: 20px;

  page-break-inside: avoid;
}


/* =========================================================
   APPROVAL ROW
   ========================================================= */

.approval-row {
  display: flex;

  align-items: flex-start;

  width: 100%;

  min-height: 75px;

  page-break-inside: avoid;
}


/* =========================================================
   APPROVED BY
   ========================================================= */

.approved-label {
  width: 42%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;
}


/* =========================================================
   ACCEPTED BY LABEL
   ========================================================= */

.accepted-label {
  width: 16%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;

  white-space: nowrap;
}


/* =========================================================
   ACCEPTED BY BOX
   ========================================================= */

.accepted-box {
  width: 42%;

  height: 75px;

  border: 1px solid #000;

  margin-left: 8px;

  position: relative;

  flex-shrink: 0;
}


/* =========================================================
   ACCEPTED BOX INNER SPACE
   ========================================================= */

.accepted-box-space {
  width: 100%;

  height: 100%;
}


/* =========================================================
   FOOTER NOTE
   ========================================================= */

.page-footer {
  position: absolute;

  left: 12mm;

  right: 12mm;

  bottom: 8mm;

  text-align: center;

  font-family: "Times New Roman", Times, serif;

  font-size: 13px;

  line-height: 1.25;

  font-style: italic;

  page-break-inside: avoid;
}

.page-footer-line {
  width: 100%;

  border-top: 1px solid #000;

  margin-bottom: 7px;
}

.page-footer b {
  font-size: 13px;
}


/* =========================================================
   PRINT BUTTONS
   ========================================================= */

.no-print {
  font-family: Arial, sans-serif;
}


/* =========================================================
   PRINT
   ========================================================= */

@media print {

  @page {
    size: A4 portrait;

    margin: 0;
  }

  html,
  body {
    width: 210mm;

    height: 297mm;

    margin: 0;

    padding: 0;

    font-family: "Times New Roman", Times, serif;

    background: #fff;
  }

  body {
    font-size: 15px;
  }

  .no-print {
    display: none !important;
  }

  .page {
    width: 210mm;

    height: 297mm;

    margin: 0;

    padding: 10mm 12mm 27mm 12mm;

    overflow: hidden;

    page-break-before: avoid;

    page-break-after: avoid;

    page-break-inside: avoid;
  }

  .container {
    width: 100%;

    margin: 0;

    padding: 0;

    border: none;
  }

  table {
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
  }

  .signatures {
    page-break-inside: avoid;
  }

  .refund-table {
    page-break-inside: avoid;
  }

  .approval-section {
    page-break-inside: avoid;
  }

  .approval-row {
    page-break-inside: avoid;
  }

  .accepted-box {
    page-break-inside: avoid;
  }

  .page-footer {
    page-break-inside: avoid;
  }
}

</style>

</head>


<body>


<!-- =====================================================
     PRINT BUTTONS
     ===================================================== -->

<div
  class="no-print"
  style="
    margin-top: 20px;
    margin-bottom: 15px;
    text-align: center;
  "
>

  <button
    onclick="window.print()"
    style="
      padding: 8px 20px;
      font-size: 15px;
      margin-right: 8px;
      cursor: pointer;
    "
  >
    Print
  </button>


  <button
    onclick="window.close()"
    style="
      padding: 8px 20px;
      font-size: 15px;
      cursor: pointer;
    "
  >
    Close
  </button>

</div>


<!-- =====================================================
     A4 PAGE
     ===================================================== -->

<div class="page">


  <!-- ===================================================
       MAIN DOCUMENT
       =================================================== -->

  <div class="container">


    <!-- =================================================
         HEADER
         ================================================= -->

    <div class="header">

      <div>
        Reg. No:
        <b>${register.id}</b>
      </div>


      <div>
        ${noteNumberLabel}:
        <b>${register.obsNo || 'N/A'}</b>
      </div>

    </div>


    <!-- =================================================
         TITLE
         ================================================= -->

    <div class="title">
      ${headerTitle}
    </div>


    <!-- =================================================
         CLAIM INFORMATION
         ================================================= -->

    <table class="claim-info">

      <tr>

        <th style="width: 50%;">
          Claim No
        </th>

        <th>
          Date of Claim
        </th>

      </tr>


      <tr>

        <td>
          ${register.claimNo || ''}
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         AGENT / CUSTOMER
         ================================================= -->

    <table
      class="agent-customer"
      style="width:100%;"
    >

      <tr>

        <th style="width: 50%;">
          AGENT
        </th>

        <th>
          CUSTOMER
        </th>

      </tr>


      <tr>

        <td>
          ${register.dealerView || 'N/A'}
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         TYRE DETAILS
         ================================================= -->

    <table class="tyre-details">

      <tr>

        <th style="width: 22.5%;">
          Brand
        </th>

        <th style="width: 22.5%;">
          Size
        </th>

        <th style="width: 10%;">
          PR
        </th>

        <th style="width: 22.5%;">
          Pattern
        </th>

        <th style="width: 22.5%;">
          Serial No
        </th>

      </tr>


      <tr>

        <td>
          ${register.brand || ''}
        </td>

        <td>
          ${register.size || ''}
        </td>

        <td>
          ${register.pr || ''}
        </td>

        <td>
          ${register.pattern || ''}
        </td>

        <td>
          ${register.serialNo || 'N/A'}
        </td>

      </tr>

    </table>


    <!-- =================================================
         TECHNICAL OBSERVATIONS
         ================================================= -->

    <table class="observations">

      <tr>

        <th
          style="
            width: 25%;
            text-align: left;
            height: 95px;
            vertical-align: top;
          "
        >
          Technical Observations :
        </th>


        <td
          style="
            width: 75%;
            height: 95px;
            text-align: left;
            vertical-align: top;
          "
        >
          ${formattedTechObs}
        </td>

      </tr>

    </table>


    <!-- =================================================
         REMAINING TREAD DEPTH
         ================================================= -->

    <table class="observations">

      <tr>

        <th
          style="
            width: 25%;
            text-align: left;
            height: 45px;
          "
        >
          Remaining Tread Depth :
        </th>


        <td
          style="
            width: 75%;
            height: 45px;
            text-align: center;
          "
        >
          ${register.treadDepth || 'N/A'}
        </td>

      </tr>

    </table>


    <!-- =================================================
         REFUND STATUS
         ================================================= -->

    <div class="refund-status">

      ${
        register.obsStatus === 'Recommended'
          ? 'Refund : Recommended'
          : register.obsStatus === 'Forwarded for Management Decision'
            ? 'Forwarded for Management Decision'
            : register.obsStatus === 'Not Recommended'
              ? 'Refund : Not Recommended'
              : 'Refund : Not Recommended'
      }

    </div>


    <!-- =================================================
         SIGNATURES
         ================================================= -->

    <div class="signatures">


      <!-- DATE -->

      <div class="signature-box">

        ${
          register.obsDate
            ? format(
                new Date(register.obsDate),
                'dd/MM/yyyy'
              )
            : 'N/A'
        }

        <br>
        <br>

        <b>
          Date
        </b>

      </div>


      <!-- CONSULTANT -->

      <div class="signatures">

        <div class="signature-box">

          __________________________________________

          <br>

          <br>

          <b>
            Consultant in Tyre Technology
          </b>

        </div>

      </div>

    </div>


    <!-- =================================================
         DIVIDER
         ================================================= -->

    <div class="divider"></div>


    <!-- =================================================
         REFUND TABLE
         ================================================= -->

    <table class="refund-table">

      <tr>

        <th colspan="2">
          NSD
        </th>

        <th colspan="2">
          Refund
        </th>

      </tr>


      <tr>

        <th>
          Spec
        </th>

        <th>
          Remaining
        </th>

        <th>
          %
        </th>

        <th>
          Rs.
        </th>

      </tr>


      <tr>

        <td style="height: 45px;">
          ${register.originalTread || ''}
        </td>

        <td>
        </td>

        <td>
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         APPROVAL SECTION
         ================================================= -->

    <div class="approval-section">

      <div class="approval-row">


        <!-- APPROVED BY -->

        <div class="approved-label">
          Approved by:
        </div>


        <!-- ACCEPTED BY -->

        <div class="accepted-label">
          Accepted by:
        </div>


        <!-- ACCEPTED BY BOX -->

        <div class="accepted-box">

          <div class="accepted-box-space"></div>

        </div>


      </div>

    </div>


  </div>


  <!-- ===================================================
       BOTTOM A4 PAGE NOTE
       =================================================== -->

  <div class="page-footer">

    <div class="page-footer-line"></div>

    <b>
      <i>
        N.B.A refunded claim tyre becomes the property
        of Wheels (Pvt) Ltd.
      </i>
    </b>

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

  const filteredRegisters = registers.filter(register => {
    const search = searchTerm?.toLowerCase() || '';
    return (
      (regNoSearch ? register.id?.toString().includes(regNoSearch) : true) &&
      (search ? (
        (register.claimNo ?? '').toLowerCase().includes(search) ||
        (register.dealerCode ?? '').toLowerCase().includes(search) ||
        (register.serialNo ?? '').toLowerCase().includes(search) ||
        (register.pr ?? '').toLowerCase().includes(search) ||
        (register.pattern ?? '').toLowerCase().includes(search) ||
        (register.obsNo ?? '').toLowerCase().includes(search) ||
        (register.obsStatus ?? '').toLowerCase().includes(search) ||
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

      {/* Search and Add Section */}
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

      {/* Table */}
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
              
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Dealer</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Dealer Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Brand</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Size</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Size Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>PR</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Pattern</TableCell>
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
                <TableCell colSpan={16} align="center">Loading...</TableCell>
              </TableRow>
            ) : sortedRegisters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} align="center">No registers found</TableCell>
              </TableRow>
            ) : (
              sortedRegisters
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((register) => (
                <TableRow key={register.id} hover>
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
                  
                  <TableCell sx={{ minWidth: 150 }}>
                    {register.dealerName || register.dealerCode}
                    {register.dealerLocation && ` (${register.dealerLocation})`}
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.dealerCode}</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{register.brand}</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>{register.size}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.sizeCode || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.pr || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.pattern || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.serialNo || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>{register.obsNo || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.consultantName || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.treadDepth || 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>{register.obsDate ? format(new Date(register.obsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell sx={{ 
                    minWidth: 200, 
                    whiteSpace: 'pre-line',
                    maxHeight: '120px',
                    overflow: 'auto'
                  }}>
                    {register.techObs || 'N/A'}
                  </TableCell>
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
                <TableCell colSpan={16} />
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
                    <Typography variant="subtitle2">PR:</Typography>
                    <Typography>{viewRegister.pr || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Pattern:</Typography>
                    <Typography>{viewRegister.pattern || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Serial No & DOT:</Typography>
                    <Typography>{viewRegister.serialNo || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                      <Typography variant="subtitle2">Original Tread Depth:</Typography>
                      <Typography>{viewRegister.originalTread || 'N/A'}</Typography>
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
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">Technical Observation:</Typography>
                        <Typography style={{ whiteSpace: 'pre-line' }}>{viewRegister.techObs || 'N/A'}</Typography>
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