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
  TablePagination,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import { Edit, Delete, Print, Visibility, Add, Download, FilterList } from '@mui/icons-material';
import { format } from 'date-fns';
import { getAllRegisters, deleteRegister } from '../services/api';
import RegisterForm from './RegisterForm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // New states for report generation
  const [fromRegNo, setFromRegNo] = useState('');
  const [toRegNo, setToRegNo] = useState('');
  const [selectedColumns, setSelectedColumns] = useState({
    regNo: true,
    receivedDate: true,
    claimNo: true,
    dealer: true,
    dealerCode: true,
    brand: true,
    size: true,
    sizeCode: true,
    serialNo: true,
    obsNo: true,
    consultant: true,
    treadDepth: true,
    obsDate: true,
    techObs: true,
    status: true
  });
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

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

  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const getFilteredRegistersByRange = () => {
    if (!fromRegNo && !toRegNo) return registers;
    
    const from = parseInt(fromRegNo) || 0;
    const to = parseInt(toRegNo) || Number.MAX_SAFE_INTEGER;
    
    return registers.filter(register => {
      const regNo = parseInt(register.id);
      return regNo >= from && regNo <= to;
    });
  };

  const handlePrintReport = () => {
    const filteredByRange = getFilteredRegistersByRange();
    const filteredRegisters = filteredByRange.filter(register => {
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

    // Create printable content
    const columns = [];
    const headers = [];

    if (selectedColumns.regNo) {
      columns.push('id');
      headers.push('Reg No');
    }
    if (selectedColumns.receivedDate) {
      columns.push('receivedDate');
      headers.push('Received Date');
    }
    if (selectedColumns.claimNo) {
      columns.push('claimNo');
      headers.push('Claim No');
    }
    if (selectedColumns.dealer) {
      columns.push('dealer');
      headers.push('Dealer');
    }
    if (selectedColumns.dealerCode) {
      columns.push('dealerCode');
      headers.push('Dealer Code');
    }
    if (selectedColumns.brand) {
      columns.push('brand');
      headers.push('Brand');
    }
    if (selectedColumns.size) {
      columns.push('size');
      headers.push('Size');
    }
    if (selectedColumns.sizeCode) {
      columns.push('sizeCode');
      headers.push('Size Code');
    }
    if (selectedColumns.serialNo) {
      columns.push('serialNo');
      headers.push('Serial No');
    }
    if (selectedColumns.obsNo) {
      columns.push('obsNo');
      headers.push('Observation No');
    }
    if (selectedColumns.consultant) {
      columns.push('consultantName');
      headers.push('Consultant');
    }
    if (selectedColumns.treadDepth) {
      columns.push('treadDepth');
      headers.push('Tread Depth');
    }
    if (selectedColumns.obsDate) {
      columns.push('obsDate');
      headers.push('Observation Date');
    }
    if (selectedColumns.techObs) {
      columns.push('techObs');
      headers.push('Technical Observation');
    }
    if (selectedColumns.status) {
      columns.push('obsStatus');
      headers.push('Status');
    }

    const tableRows = sortedRegisters.map(register => {
      return columns.map(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          return register[col] ? format(new Date(register[col]), 'dd/MM/yyyy') : 'N/A';
        }
        if (col === 'dealer') {
          return register.dealerName || register.dealerCode || 'N/A';
        }
        if (col === 'obsStatus') {
          return register.obsStatus || 'Pending';
        }
        return register[col] || 'N/A';
      });
    });

    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>UC Tyre Register Report</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 18px; }
          .report-info { margin-bottom: 15px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UC Tyre Register Report</h1>
          <div class="report-info">
            <p>Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            ${fromRegNo || toRegNo ? `<p>Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'}</p>` : ''}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    const filteredByRange = getFilteredRegistersByRange();
    const filteredRegisters = filteredByRange.filter(register => {
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

    // Create PDF with landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Title
    doc.setFontSize(16);
    doc.text('UC Tyre Register Report', 14, 15);
    
    // Report info
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
    if (fromRegNo || toRegNo) {
      doc.text(`Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'}`, 14, 28);
    }

    // Prepare table data
    const columns = [];
    const headers = [];

    if (selectedColumns.regNo) {
      columns.push('id');
      headers.push('Reg No');
    }
    if (selectedColumns.receivedDate) {
      columns.push('receivedDate');
      headers.push('Received Date');
    }
    if (selectedColumns.claimNo) {
      columns.push('claimNo');
      headers.push('Claim No');
    }
    if (selectedColumns.dealer) {
      columns.push('dealer');
      headers.push('Dealer');
    }
    if (selectedColumns.dealerCode) {
      columns.push('dealerCode');
      headers.push('Dealer Code');
    }
    if (selectedColumns.brand) {
      columns.push('brand');
      headers.push('Brand');
    }
    if (selectedColumns.size) {
      columns.push('size');
      headers.push('Size');
    }
    if (selectedColumns.sizeCode) {
      columns.push('sizeCode');
      headers.push('Size Code');
    }
    if (selectedColumns.serialNo) {
      columns.push('serialNo');
      headers.push('Serial No');
    }
    if (selectedColumns.obsNo) {
      columns.push('obsNo');
      headers.push('Observation No');
    }
    if (selectedColumns.consultant) {
      columns.push('consultantName');
      headers.push('Consultant');
    }
    if (selectedColumns.treadDepth) {
      columns.push('treadDepth');
      headers.push('Tread Depth');
    }
    if (selectedColumns.obsDate) {
      columns.push('obsDate');
      headers.push('Observation Date');
    }
    if (selectedColumns.techObs) {
      columns.push('techObs');
      headers.push('Technical Observation');
    }
    if (selectedColumns.status) {
      columns.push('obsStatus');
      headers.push('Status');
    }

    const tableData = sortedRegisters.map(register => {
      return columns.map(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          return register[col] ? format(new Date(register[col]), 'dd/MM/yyyy') : 'N/A';
        }
        if (col === 'dealer') {
          return register.dealerName || register.dealerCode || 'N/A';
        }
        if (col === 'obsStatus') {
          return register.obsStatus || 'Pending';
        }
        if (col === 'techObs') {
          return (register[col] || 'N/A').substring(0, 50) + (register[col] && register[col].length > 50 ? '...' : '');
        }
        return register[col] || 'N/A';
      });
    });

    // Add table to PDF using autoTable function directly
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 35,
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [66, 66, 66],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 35 },
      theme: 'grid'
    });

    // Save PDF
    doc.save(`tyre-register-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
  };

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
              <td style="height: 30px;"></td>
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
      
      {/* Report Generation Section */}
      <Card sx={{ mb: 2, ml: 'auto', width: 280 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
            Generate Report
          </Typography>
          
          {/* From and To fields stacked vertically */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <TextField
              label="From Reg No"
              variant="outlined"
              size="small"
              type="number"
              value={fromRegNo}
              onChange={(e) => setFromRegNo(e.target.value)}
              fullWidth
            />
            <TextField
              label="To Reg No"
              variant="outlined"
              size="small"
              type="number"
              value={toRegNo}
              onChange={(e) => setToRegNo(e.target.value)}
              fullWidth
            />
          </Box>

          {/* Column filter */}
          <Tooltip title="Select columns to include in report">
            <Button 
              variant="outlined" 
              startIcon={<FilterList />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              fullWidth
              sx={{ mb: 2 }}
            >
              Select Columns
            </Button>
          </Tooltip>

          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
            PaperProps={{ style: { maxHeight: 400, width: 250 } }}
          >
            <MenuItem disabled>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Select Columns to Include
              </Typography>
            </MenuItem>
            {Object.keys(selectedColumns).map((column) => (
              <MenuItem key={column} dense>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedColumns[column]}
                      onChange={() => handleColumnToggle(column)}
                    />
                  }
                  label={column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Action buttons stacked vertically */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Print />}
              onClick={handlePrintReport}
              fullWidth
            >
              Print Report
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              startIcon={<Download />}
              onClick={handleDownloadPDF}
              fullWidth
            >
              Download PDF
            </Button>
          </Box>
        </CardContent>
      </Card>

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