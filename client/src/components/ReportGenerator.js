import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  FormControlLabel,
  Menu,
  Tooltip,
  Grid
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { FilterList, Print, Download } from '@mui/icons-material';
import { generateReport, getInitialData, getAllConsultants, getAllRegisters } from '../services/api';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brand: '',
    obsStatus: '',
    consultant: '',
    dealer: '' // Changed from dealerView to dealer
  });

  const [fromRegNo, setFromRegNo] = useState('');
  const [toRegNo, setToRegNo] = useState('');
  const [selectedColumns, setSelectedColumns] = useState({
    sNo: true,
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

  const [reportData, setReportData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [allDealers, setAllDealers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const observationStatusOptions = [
    'All Observations Status',
    'Pending',
    'Recommended',
    'Not Recommended',
    'Forwarded for Management Decision'
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setBrands(data.brands || []);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data || []);

        // Fetch all registers to get unique dealers
        const registersRes = await getAllRegisters();
        const registers = registersRes.data || [];
        
        // Extract unique dealers from dealerName and dealerView
        const uniqueDealers = new Set();
        const dealerOptions = [];
        
        // Add "All Dealers" option first
        dealerOptions.push('All Dealers');
        
        registers.forEach(register => {
          if (register.dealerName && !uniqueDealers.has(register.dealerName)) {
            uniqueDealers.add(register.dealerName);
            dealerOptions.push(register.dealerName);
          }
          if (register.dealerView && !uniqueDealers.has(register.dealerView)) {
            uniqueDealers.add(register.dealerView);
            dealerOptions.push(register.dealerView);
          }
        });
        
        setAllDealers(dealerOptions);

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

  const handleDealerChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      dealer: newValue === 'All Dealers' ? '' : newValue
    }));
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const getFilteredRegistersByRange = (data) => {
    if (!fromRegNo && !toRegNo) return data;
    
    const from = parseInt(fromRegNo) || 0;
    const to = parseInt(toRegNo) || Number.MAX_SAFE_INTEGER;
    
    return data.filter(register => {
      const regNo = parseInt(register.id);
      return regNo >= from && regNo <= to;
    });
  };

  const applyDealerFilter = (data) => {
    if (!filters.dealer) return data;
    
    return data.filter(register => {
      return register.dealerName === filters.dealer || register.dealerView === filters.dealer;
    });
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let filteredData = [];

      // If any filter is applied, use generateReport API, otherwise use getAllRegisters
      if (filters.startDate || filters.endDate || filters.brand || filters.consultant || filters.obsStatus) {
        const serverFiltered = await generateReport(filters);
        filteredData = serverFiltered.data || [];
      } else {
        const { data } = await getAllRegisters();
        filteredData = data || [];
      }

      // Apply dealer filter (client-side)
      filteredData = applyDealerFilter(filteredData);

      // Apply Reg No range filter
      filteredData = getFilteredRegistersByRange(filteredData);

      // Apply observation status filter if not already applied by server
      if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
        filteredData = filteredData.filter(item => item.obsStatus === filters.obsStatus);
      }

      // Sort data by receivedDate in ascending order
      const sortedByDate = [...filteredData].sort((a, b) => {
        const dateA = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
        const dateB = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
        return dateA - dateB;
      });

      setReportData(sortedByDate);
      setSortedData(sortedByDate);
      setPage(0);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (reportData.length === 0) {
      alert('No data to print');
      return;
    }

    const filteredByRange = getFilteredRegistersByRange(reportData);
    const filteredByDealer = applyDealerFilter(filteredByRange);
    
    // Create printable content
    const columns = [];
    const headers = ['S.No'];

    // Add selected columns
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

    const tableRows = filteredByDealer.map((register, index) => {
      const rowData = [index + 1];
      
      columns.forEach(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          rowData.push(register[col] ? format(new Date(register[col]), 'dd/MM/yyyy') : 'N/A');
        } else if (col === 'dealer') {
          rowData.push(register.dealerName || register.dealerCode || 'N/A');
        } else if (col === 'obsStatus') {
          rowData.push(register.obsStatus || 'Pending');
        } else {
          rowData.push(register[col] || 'N/A');
        }
      });
      
      return rowData;
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
            ${filters.startDate ? `<p>Start Date: ${filters.startDate}</p>` : ''}
            ${filters.endDate ? `<p>End Date: ${filters.endDate}</p>` : ''}
            ${filters.brand ? `<p>Brand: ${filters.brand}</p>` : ''}
            ${filters.dealer ? `<p>Dealer: ${filters.dealer}</p>` : ''}
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
    if (reportData.length === 0) {
      alert('No data to download');
      return;
    }

    const filteredByRange = getFilteredRegistersByRange(reportData);
    const filteredByDealer = applyDealerFilter(filteredByRange);

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
    let yOffset = 28;
    
    if (fromRegNo || toRegNo) {
      doc.text(`Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.startDate) {
      doc.text(`Start Date: ${filters.startDate}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.endDate) {
      doc.text(`End Date: ${filters.endDate}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.brand) {
      doc.text(`Brand: ${filters.brand}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.dealer) {
      doc.text(`Dealer: ${filters.dealer}`, 14, yOffset);
      yOffset += 6;
    }

    // Prepare table data
    const columns = [];
    const headers = ['S.No'];

    // Add selected columns
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

    const tableData = filteredByDealer.map((register, index) => {
      const rowData = [index + 1];
      
      columns.forEach(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          rowData.push(register[col] ? format(new Date(register[col]), 'dd/MM/yyyy') : 'N/A');
        } else if (col === 'dealer') {
          rowData.push(register.dealerName || register.dealerCode || 'N/A');
        } else if (col === 'obsStatus') {
          rowData.push(register.obsStatus || 'Pending');
        } else if (col === 'techObs') {
          rowData.push((register[col] || 'N/A').substring(0, 50) + (register[col] && register[col].length > 50 ? '...' : ''));
        } else {
          rowData.push(register[col] || 'N/A');
        }
      });
      
      return rowData;
    });

    // Add table to PDF using autoTable function directly
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: yOffset + 10,
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
      margin: { top: yOffset + 10 },
      theme: 'grid'
    });

    // Save PDF
    doc.save(`UC-Tyre-register-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const filteredByRange = getFilteredRegistersByRange(reportData);
    const filteredByDealer = applyDealerFilter(filteredByRange);

    // Define worksheet data with S.No column as first column
    const worksheetData = filteredByDealer.map((item, index) => {
      const rowData = {
        'S.No': index + 1
      };

      // Add selected columns
      if (selectedColumns.regNo) rowData['Reg No'] = item.id;
      if (selectedColumns.receivedDate) rowData['Received Date'] = item.receivedDate ? format(new Date(item.receivedDate), 'dd/MM/yyyy') : 'N/A';
      if (selectedColumns.claimNo) rowData['Claim No'] = item.claimNo;
      if (selectedColumns.dealer) rowData['Dealer'] = item.dealerName || item.dealerCode;
      if (selectedColumns.dealerCode) rowData['Dealer Code'] = item.dealerCode;
      if (selectedColumns.brand) rowData['Brand'] = item.brand;
      if (selectedColumns.size) rowData['Size'] = item.size;
      if (selectedColumns.sizeCode) rowData['Size Code'] = item.sizeCode;
      if (selectedColumns.serialNo) rowData['Serial No'] = item.serialNo;
      if (selectedColumns.obsNo) rowData['Observation No'] = item.obsNo || 'N/A';
      if (selectedColumns.obsDate) rowData['Observation Date'] = item.obsDate ? format(new Date(item.obsDate), 'dd/MM/yyyy') : 'N/A';
      if (selectedColumns.treadDepth) rowData['Remaining Tread Depth'] = item.treadDepth;
      if (selectedColumns.techObs) rowData['Technical Observation'] = item.techObs;
      if (selectedColumns.status) rowData['Status'] = item.obsStatus || 'Pending';
      if (selectedColumns.consultant) rowData['Consultant'] = item.consultantName || 'N/A';

      return rowData;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // S.No
      { wch: 8 },   { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 10 }, { wch: 8 },  { wch: 10 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
    ].slice(0, Object.keys(worksheetData[0] || {}).length);
    
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "UC Tyre Report");
    XLSX.writeFile(wb, `uc_tyre_report_${format(new Date(), 'yyyy-MM-dd-HH-mm')}.xlsx`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedData.length) : 0;

  // Get visible columns for the table
  const getVisibleColumns = () => {
    const columns = [];
    
    // Always include S.No
    columns.push({ key: 'sNo', label: 'S.No', width: 80 });
    
    // Add selected columns
    if (selectedColumns.regNo) columns.push({ key: 'id', label: 'Reg No', width: 100 });
    if (selectedColumns.receivedDate) columns.push({ key: 'receivedDate', label: 'Received Date', width: 120 });
    if (selectedColumns.claimNo) columns.push({ key: 'claimNo', label: 'Claim No', width: 120 });
    if (selectedColumns.dealer) columns.push({ key: 'dealer', label: 'Dealer', width: 150 });
    if (selectedColumns.dealerCode) columns.push({ key: 'dealerCode', label: 'Dealer Code', width: 120 });
    if (selectedColumns.brand) columns.push({ key: 'brand', label: 'Brand', width: 100 });
    if (selectedColumns.size) columns.push({ key: 'size', label: 'Size', width: 100 });
    if (selectedColumns.sizeCode) columns.push({ key: 'sizeCode', label: 'Size Code', width: 120 });
    if (selectedColumns.serialNo) columns.push({ key: 'serialNo', label: 'Serial No', width: 150 });
    if (selectedColumns.obsNo) columns.push({ key: 'obsNo', label: 'Observation No', width: 150 });
    if (selectedColumns.consultant) columns.push({ key: 'consultantName', label: 'Consultant', width: 120 });
    if (selectedColumns.treadDepth) columns.push({ key: 'treadDepth', label: 'Tread Depth', width: 120 });
    if (selectedColumns.obsDate) columns.push({ key: 'obsDate', label: 'Observation Date', width: 120 });
    if (selectedColumns.techObs) columns.push({ key: 'techObs', label: 'Technical Observation', width: 200 });
    if (selectedColumns.status) columns.push({ key: 'obsStatus', label: 'Status', width: 150 });
    
    return columns;
  };

  const visibleColumns = getVisibleColumns();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Report Generator
      </Typography>

      {/* Filters Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {/* First Line: Start Date, End Date, Brand, Consultant, Observation Status, Dealer */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 2,
          '& > *': { 
            minWidth: 200,
            flex: '1 1 200px'
          }
        }}>
          <TextField
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          
          <TextField
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Brand</InputLabel>
            <Select
              name="brand"
              value={filters.brand}
              label="Brand"
              onChange={handleFilterChange}
            >
              <MenuItem value="">All Brands</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
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
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Observation Status</InputLabel>
            <Select
              name="obsStatus"
              value={filters.obsStatus}
              label="Observation Status"
              onChange={handleFilterChange}
            >
              {observationStatusOptions.map((status) => (
                <MenuItem key={status} value={status === 'All Observations Status' ? '' : status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Autocomplete
            options={allDealers}
            value={filters.dealer || null}
            onChange={handleDealerChange}
            renderInput={(params) => (
              <TextField {...params} label="Dealer" />
            )}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {/* Second Line: From Reg No, To Reg No, Select Columns */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="From Reg No"
              variant="outlined"
              size="small"
              type="number"
              value={fromRegNo}
              onChange={(e) => setFromRegNo(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="To Reg No"
              variant="outlined"
              size="small"
              type="number"
              value={toRegNo}
              onChange={(e) => setToRegNo(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Tooltip title="Select columns to include in report">
              <Button 
                variant="outlined" 
                startIcon={<FilterList />}
                onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                fullWidth
                sx={{ height: '40px' }}
              >
                Select Columns ({Object.values(selectedColumns).filter(Boolean).length} selected)
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
                        disabled={column === 'sNo'}
                      />
                    }
                    label={column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>

        {/* Third Line: Buttons */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              fullWidth
              sx={{ py: 1 }}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Print />}
              onClick={handlePrintReport}
              fullWidth
              sx={{ py: 1 }}
              disabled={reportData.length === 0}
            >
              Print Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="secondary"
              startIcon={<Download />}
              onClick={handleDownloadPDF}
              fullWidth
              sx={{ py: 1 }}
              disabled={reportData.length === 0}
            >
              Download PDF
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              disabled={reportData.length === 0}
              fullWidth
              sx={{ py: 1 }}
            >
              Export to Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Selected Columns Info */}
      {sortedData.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          {/* <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Visible Columns: {visibleColumns.map(col => col.label).join(', ')}
          </Typography> */}
          <Typography variant="body2" color="text.secondary">
            Total Records: {sortedData.length} | 
            {fromRegNo || toRegNo ? ` Reg No Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'} |` : ''} 
            {filters.startDate ? ` Start Date: ${filters.startDate} |` : ''}
            {filters.endDate ? ` End Date: ${filters.endDate} |` : ''}
            {filters.brand ? ` Brand: ${filters.brand} |` : '| All Brands |'}
            {filters.dealer ? ` Dealer: ${filters.dealer} |` : '| All Dealers |'}
            {filters.consultant ? ` Consultant: ${filters.consultant} |` : '| All Consultants |'}
            {filters.obsStatus ? ` Observation Status: ${filters.obsStatus} |` : '| All Observation Status |'}
          </Typography>
        </Paper>
      )}

      {/* Report Table */}
      {sortedData.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ maxHeight: '60vh', flexGrow: 1, overflow: 'auto' }}>
            <Table 
              stickyHeader 
              size="small" 
              sx={{ 
                tableLayout: 'auto', 
                minWidth: visibleColumns.length * 150,
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiTableCell-root': {
                  border: '1px solid',
                  borderColor: 'divider',
                  padding: '8px'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableCell 
                      key={column.key}
                      sx={{ 
                        whiteSpace: 'nowrap', 
                        fontWeight: 'bold', 
                        backgroundColor: '#f5f5f5',
                        minWidth: column.width
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : sortedData
                ).map((item, index) => (
                  <TableRow key={item.id} sx={{ height: 50 }}>
                    {visibleColumns.map((column) => {
                      let cellContent = '';
                      
                      if (column.key === 'sNo') {
                        cellContent = page * rowsPerPage + index + 1;
                      } else if (column.key === 'receivedDate' || column.key === 'obsDate') {
                        cellContent = item[column.key] ? format(new Date(item[column.key]), 'dd/MM/yyyy') : 'N/A';
                      } else if (column.key === 'dealer') {
                        cellContent = item.dealerName || item.dealerView || item.dealerCode || 'N/A';
                      } else if (column.key === 'techObs') {
                        cellContent = item[column.key] || 'N/A';
                      } else {
                        cellContent = item[column.key] || 'N/A';
                      }
                      
                      return (
                        <TableCell 
                          key={column.key}
                          sx={{ 
                            whiteSpace: column.key === 'techObs' ? 'normal' : 'nowrap',
                            wordBreak: column.key === 'techObs' ? 'break-word' : 'normal'
                          }}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={visibleColumns.length} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, { value: -1, label: 'All' }]}
            component="div"
            count={sortedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ReportGenerator;