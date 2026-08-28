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
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',          // receivedDate start
    endDate: '',            // receivedDate end
    startObsDate: '',       // observation date start
    endObsDate: '',         // observation date end
    brand: '',
    obsStatus: '',
    consultant: '',
    dealer: ''
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
    pr: false,
    pattern: false,
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
    'Forwarded for Management Decision',
    'Return to Dealer',
    'Sent to CEAT'
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

  // === Robust Received Date filter (using date-fns) ===
  const applyReceivedDateFilter = (data) => {
    const { startDate, endDate } = filters;
    if (!startDate && !endDate) return data;
    
    return data.filter(register => {
      if (!register.receivedDate) return false;
      const recDate = parseISO(register.receivedDate);
      const start = startDate ? startOfDay(parseISO(startDate)) : null;
      const end = endDate ? startOfDay(parseISO(endDate)) : null;
      
      if (start && recDate < start) return false;
      if (end && recDate > end) return false;
      return true;
    });
  };

  // === Robust Observation Date filter (using date-fns) ===
  const applyObservationDateFilter = (data) => {
    const { startObsDate, endObsDate } = filters;
    if (!startObsDate && !endObsDate) return data;
    
    return data.filter(register => {
      if (!register.obsDate) return false;
      const obsDate = parseISO(register.obsDate);
      const start = startObsDate ? startOfDay(parseISO(startObsDate)) : null;
      const end = endObsDate ? startOfDay(parseISO(endObsDate)) : null;
      
      if (start && obsDate < start) return false;
      if (end && obsDate > end) return false;
      return true;
    });
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let filteredData = [];

      // API filters (only those supported by the backend)
      const apiFilters = {};
      if (filters.brand) apiFilters.brand = filters.brand;
      if (filters.consultant) apiFilters.consultant = filters.consultant;
      if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') apiFilters.obsStatus = filters.obsStatus;
      
      if (Object.keys(apiFilters).length > 0) {
        const serverFiltered = await generateReport(apiFilters);
        filteredData = serverFiltered.data || [];
      } else {
        const { data } = await getAllRegisters();
        filteredData = data || [];
      }

      // Apply all client‑side filters in a consistent order
      filteredData = applyReceivedDateFilter(filteredData);
      filteredData = applyObservationDateFilter(filteredData);
      filteredData = applyDealerFilter(filteredData);
      filteredData = getFilteredRegistersByRange(filteredData);
      
      // Ensure obsStatus filter is also applied (in case server didn't get it)
      if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
        filteredData = filteredData.filter(item => item.obsStatus === filters.obsStatus);
      }

      // Sort by receivedDate ascending
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

    // Re‑apply all filters to get the final dataset for print
    let data = [...reportData];
    data = applyReceivedDateFilter(data);
    data = applyObservationDateFilter(data);
    data = applyDealerFilter(data);
    data = getFilteredRegistersByRange(data);
    if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
      data = data.filter(item => item.obsStatus === filters.obsStatus);
    }

    const columns = [];
    const headers = ['S.No'];

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
    if (selectedColumns.pr) {
      columns.push('pr');
      headers.push('PR');
    }
    if (selectedColumns.pattern) {
      columns.push('pattern');
      headers.push('Pattern');
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

    const tableRows = data.map((register, index) => {
      const rowData = [index + 1];
      
      columns.forEach(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          rowData.push(register[col] ? format(parseISO(register[col]), 'dd/MM/yyyy') : 'N/A');
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
            ${filters.startDate ? `<p>Received Date From: ${filters.startDate}</p>` : ''}
            ${filters.endDate ? `<p>Received Date To: ${filters.endDate}</p>` : ''}
            ${filters.startObsDate ? `<p>Observation Date From: ${filters.startObsDate}</p>` : ''}
            ${filters.endObsDate ? `<p>Observation Date To: ${filters.endObsDate}</p>` : ''}
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

    // Re‑apply filters to ensure PDF matches the displayed data
    let data = [...reportData];
    data = applyReceivedDateFilter(data);
    data = applyObservationDateFilter(data);
    data = applyDealerFilter(data);
    data = getFilteredRegistersByRange(data);
    if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
      data = data.filter(item => item.obsStatus === filters.obsStatus);
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    doc.text('UC Tyre Register Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
    let yOffset = 28;
    
    if (fromRegNo || toRegNo) {
      doc.text(`Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.startDate) {
      doc.text(`Received Date From: ${filters.startDate}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.endDate) {
      doc.text(`Received Date To: ${filters.endDate}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.startObsDate) {
      doc.text(`Observation Date From: ${filters.startObsDate}`, 14, yOffset);
      yOffset += 6;
    }
    if (filters.endObsDate) {
      doc.text(`Observation Date To: ${filters.endObsDate}`, 14, yOffset);
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

    const columns = [];
    const headers = ['S.No'];

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
    if (selectedColumns.pr) {
      columns.push('pr');
      headers.push('PR');
    }
    if (selectedColumns.pattern) {
      columns.push('pattern');
      headers.push('Pattern');
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

    const tableData = data.map((register, index) => {
      const rowData = [index + 1];
      
      columns.forEach(col => {
        if (col === 'receivedDate' || col === 'obsDate') {
          rowData.push(register[col] ? format(parseISO(register[col]), 'dd/MM/yyyy') : 'N/A');
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

    doc.save(`UC-Tyre-register-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.pdf`);
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    // Re‑apply filters to ensure Excel matches the displayed data
    let data = [...reportData];
    data = applyReceivedDateFilter(data);
    data = applyObservationDateFilter(data);
    data = applyDealerFilter(data);
    data = getFilteredRegistersByRange(data);
    if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
      data = data.filter(item => item.obsStatus === filters.obsStatus);
    }

    const worksheetData = data.map((item, index) => {
      const rowData = {
        'S.No': index + 1
      };

      if (selectedColumns.regNo) rowData['Reg No'] = item.id;
      if (selectedColumns.receivedDate) rowData['Received Date'] = item.receivedDate ? format(parseISO(item.receivedDate), 'dd/MM/yyyy') : 'N/A';
      if (selectedColumns.claimNo) rowData['Claim No'] = item.claimNo;
      if (selectedColumns.dealer) rowData['Dealer'] = item.dealerName || item.dealerCode;
      if (selectedColumns.dealerCode) rowData['Dealer Code'] = item.dealerCode;
      if (selectedColumns.brand) rowData['Brand'] = item.brand;
      if (selectedColumns.size) rowData['Size'] = item.size;
      if (selectedColumns.sizeCode) rowData['Size Code'] = item.sizeCode;
      if (selectedColumns.pr) rowData['PR'] = item.pr;
      if (selectedColumns.pattern) rowData['Pattern'] = item.pattern;
      if (selectedColumns.serialNo) rowData['Serial No'] = item.serialNo;
      if (selectedColumns.obsNo) rowData['Observation No'] = item.obsNo || 'N/A';
      if (selectedColumns.obsDate) rowData['Observation Date'] = item.obsDate ? format(parseISO(item.obsDate), 'dd/MM/yyyy') : 'N/A';
      if (selectedColumns.treadDepth) rowData['Remaining Tread Depth'] = item.treadDepth;
      if (selectedColumns.techObs) rowData['Technical Observation'] = item.techObs;
      if (selectedColumns.status) rowData['Status'] = item.obsStatus || 'Pending';
      if (selectedColumns.consultant) rowData['Consultant'] = item.consultantName || 'N/A';

      return rowData;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(worksheetData);

    // Auto column widths (approximate)
    const colCount = Object.keys(worksheetData[0] || {}).length;
    ws['!cols'] = Array(colCount).fill({ wch: 15 });

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

  const getVisibleColumns = () => {
    const columns = [];
    columns.push({ key: 'sNo', label: 'S.No', width: 80 });
    if (selectedColumns.regNo) columns.push({ key: 'id', label: 'Reg No', width: 100 });
    if (selectedColumns.receivedDate) columns.push({ key: 'receivedDate', label: 'Received Date', width: 120 });
    if (selectedColumns.claimNo) columns.push({ key: 'claimNo', label: 'Claim No', width: 120 });
    if (selectedColumns.dealer) columns.push({ key: 'dealer', label: 'Dealer', width: 150 });
    if (selectedColumns.dealerCode) columns.push({ key: 'dealerCode', label: 'Dealer Code', width: 120 });
    if (selectedColumns.brand) columns.push({ key: 'brand', label: 'Brand', width: 100 });
    if (selectedColumns.size) columns.push({ key: 'size', label: 'Size', width: 100 });
    if (selectedColumns.sizeCode) columns.push({ key: 'sizeCode', label: 'Size Code', width: 120 });
    if (selectedColumns.pr) columns.push({ key: 'pr', label: 'PR', width: 80 });
    if (selectedColumns.pattern) columns.push({ key: 'pattern', label: 'Pattern', width: 120 });
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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {/* First row: Date filters */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 2,
          '& > *': { minWidth: 180, flex: '1 1 180px' }
        }}>
          <TextField
            label="Received Date From"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Received Date To"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Observation Date From"
            type="date"
            name="startObsDate"
            value={filters.startObsDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Observation Date To"
            type="date"
            name="endObsDate"
            value={filters.endObsDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Second row: Other filters */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 2,
          '& > *': { minWidth: 200, flex: '1 1 200px' }
        }}>
          <FormControl>
            <InputLabel>Brand</InputLabel>
            <Select name="brand" value={filters.brand} label="Brand" onChange={handleFilterChange}>
              <MenuItem value="">All Brands</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand} value={brand}>{brand}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <InputLabel>Consultant</InputLabel>
            <Select name="consultant" value={filters.consultant} label="Consultant" onChange={handleFilterChange}>
              <MenuItem value="">All Consultants</MenuItem>
              {consultants.map((consultant) => (
                <MenuItem key={consultant.consultantName} value={consultant.consultantName}>
                  {consultant.consultantName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <InputLabel>Observation Status</InputLabel>
            <Select name="obsStatus" value={filters.obsStatus} label="Observation Status" onChange={handleFilterChange}>
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
            renderInput={(params) => <TextField {...params} label="Dealer" />}
          />
        </Box>

        {/* Third row: Reg No range & column selection */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="From Reg No"
              type="number"
              value={fromRegNo}
              onChange={(e) => setFromRegNo(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="To Reg No"
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

        {/* Fourth row: Action buttons */}
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
            >
              Export to Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary */}
      {sortedData.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" color="text.secondary">
            Total Records: {sortedData.length} | 
            {fromRegNo || toRegNo ? ` Reg No Range: ${fromRegNo || 'Start'} - ${toRegNo || 'End'} |` : ''} 
            {filters.startDate ? ` Received Date From: ${filters.startDate} |` : ''}
            {filters.endDate ? ` Received Date To: ${filters.endDate} |` : ''}
            {filters.startObsDate ? ` Obs Date From: ${filters.startObsDate} |` : ''}
            {filters.endObsDate ? ` Obs Date To: ${filters.endObsDate} |` : ''}
            {filters.brand ? ` Brand: ${filters.brand} |` : '| All Brands |'}
            {filters.dealer ? ` Dealer: ${filters.dealer} |` : '| All Dealers |'}
            {filters.consultant ? ` Consultant: ${filters.consultant} |` : '| All Consultants |'}
            {filters.obsStatus ? ` Observation Status: ${filters.obsStatus} |` : '| All Observation Status |'}
          </Typography>
        </Paper>
      )}

      {/* Report Table */}
      {sortedData.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', flexGrow: 1 }}>
          <TableContainer sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader size="small" sx={{ 
              tableLayout: 'auto', 
              minWidth: visibleColumns.length * 150,
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiTableCell-root': { border: '1px solid', borderColor: 'divider', padding: '8px' }
            }}>
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.key} sx={{ 
                      whiteSpace: 'nowrap', 
                      fontWeight: 'bold', 
                      backgroundColor: '#f5f5f5',
                      minWidth: column.width
                    }}>
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
                  <TableRow key={item.id}>
                    {visibleColumns.map((column) => {
                      let cellContent = '';
                      if (column.key === 'sNo') {
                        cellContent = page * rowsPerPage + index + 1;
                      } else if (column.key === 'receivedDate' || column.key === 'obsDate') {
                        cellContent = item[column.key] ? format(parseISO(item[column.key]), 'dd/MM/yyyy') : 'N/A';
                      } else if (column.key === 'dealer') {
                        cellContent = item.dealerName || item.dealerView || item.dealerCode || 'N/A';
                      } else {
                        cellContent = item[column.key] || 'N/A';
                      }
                      return (
                        <TableCell key={column.key} sx={{ 
                          whiteSpace: column.key === 'techObs' ? 'normal' : 'nowrap',
                          wordBreak: column.key === 'techObs' ? 'break-word' : 'normal'
                        }}>
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