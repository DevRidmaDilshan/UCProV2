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
  TablePagination
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { generateReport, getInitialData, getAllConsultants } from '../services/api';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const ReportGenerator = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brand: '',
    obsStatus: '',
    consultant: '',
    dealerView: ''
  });

  const [reportData, setReportData] = useState([]);
  const [sortedData, setSortedData] = useState([]); // Sorted data for display
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [dealerViews, setDealerViews] = useState([]);
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
        setBrands(data.brands);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data);

        if (data.dealerViews) {
          setDealerViews(data.dealerViews);
        }
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

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const { data } = await generateReport(filters);

      let filteredData = data;
      if (filters.obsStatus && filters.obsStatus !== 'All Observations Status') {
        filteredData = data.filter(item => item.obsStatus === filters.obsStatus);
      }

      // Sort data by receivedDate in ascending order
      const sortedByDate = [...filteredData].sort((a, b) => {
        const dateA = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
        const dateB = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
        return dateA - dateB;
      });

      setReportData(sortedByDate);
      setSortedData(sortedByDate);
      setPage(0); // Reset to first page when new data is loaded
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    // Define worksheet data with S.No column
    const worksheetData = reportData.map((item, index) => ({
      'S.No': index + 1,
      'Reg No': item.id,
      'Received Date': item.receivedDate ? format(new Date(item.receivedDate), 'dd/MM/yyyy') : 'N/A',
      'Claim No': item.claimNo,
      'Dealer': item.dealerName || item.dealerCode,
      'Dealer Code': item.dealerCode,
      'Brand': item.brand,
      'Size': item.size,
      'Size Code': item.sizeCode,
      'Serial No': item.serialNo,
      'Observation Date': item.obsDate ? format(new Date(item.obsDate), 'dd/MM/yyyy') : 'N/A',
      'Remaining Tread Depth': item.treadDepth,
      'Technical Observation': item.techObs,
      'Observation No': item.obsNo || 'N/A',
      'Status': item.obsStatus || 'Pending',
      'Consultant': item.consultantName || 'N/A',
      'Dealer View': item.dealerView || 'N/A'
    }));

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
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "UC Tyre Report");
    XLSX.writeFile(wb, `uc_tyre_report_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.xlsx`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedData.length) : 0;

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Report Generator
      </Typography>

      {/* Filters in one row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Start Date"
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />

        <TextField
          label="End Date"
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />

        <FormControl sx={{ width: 200 }}>
          <InputLabel>Brand</InputLabel>
          <Select
            name="brand"
            value={filters.brand}
            label="Brand"
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Brands</MenuItem>
            {brands.map((brand) => (
              <MenuItem key={brand} value={brand}>
                {brand}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ width: 220 }}>
          <InputLabel>Consultant</InputLabel>
          <Select
            name="consultant"
            value={filters.consultant}
            label="Consultant"
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Consultants</MenuItem>
            {consultants.map((consultant) => (
              <MenuItem
                key={consultant.consultantName}
                value={consultant.consultantName}
              >
                {consultant.consultantName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ width: 240 }}>
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
          options={[{ dealerView: '', dealerName: 'All Dealers' }, ...dealerViews]}
          getOptionLabel={(option) => option.dealerName || option.dealerView || option}
          value={
            dealerViews.find((dealer) => dealer.dealerView === filters.dealerView) ||
            { dealerView: '', dealerName: 'All Dealers' }
          }
          onChange={(e, newValue) => {
            setFilters((prev) => ({
              ...prev,
              dealerView: newValue ? newValue.dealerView : ''
            }));
          }}
          isOptionEqualToValue={(option, value) => option.dealerView === value.dealerView}
          renderInput={(params) => (
            <TextField {...params} label="Dealer View" sx={{ width: 200 }} />
          )}
          sx={{ width: 200 }}
        />
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleExportExcel}
          disabled={reportData.length === 0}
        >
          Export to Excel
        </Button>
      </Box>

      {/* Report Table */}
      {sortedData.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ maxHeight: '60vh', flexGrow: 1, overflow: 'auto' }}>
            <Table 
              stickyHeader 
              size="small" 
              sx={{ 
                tableLayout: 'auto', 
                minWidth: 1600, 
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
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>S.No</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Reg No</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Received Date</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Claim No</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Dealer</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Dealer Code</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Brand</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Size</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Size Code</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Serial No</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Observation No</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Observation Date</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Remaining Tread Depth</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Technical Observation</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Consultant</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : sortedData
                ).map((item, index) => (
                  <TableRow key={item.id} sx={{ height: 50 }}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      {item.receivedDate
                        ? format(new Date(item.receivedDate), 'dd/MM/yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{item.claimNo}</TableCell>
                    <TableCell>{item.dealerView || item.dealerName}</TableCell>
                    <TableCell>{item.dealerCode}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.sizeCode}</TableCell>
                    <TableCell>{item.serialNo}</TableCell>
                    <TableCell>{item.obsNo || 'N/A'}</TableCell>
                    <TableCell>
                      {item.obsDate
                        ? format(new Date(item.obsDate), 'dd/MM/yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{item.treadDepth}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.techObs}
                    </TableCell>
                    <TableCell>{item.obsStatus}</TableCell>
                    <TableCell>{item.consultantName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={17} />
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
    </Paper>
  );
};

export default ReportGenerator;
