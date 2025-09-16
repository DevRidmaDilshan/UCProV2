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
  TableRow
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
    dealerView: ''   // ✅ Added dealerView filter
  });

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [dealerViews, setDealerViews] = useState([]); // ✅ New state

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

        // ✅ Assume dealerViews also come from getInitialData
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
      if (filters.obsStatus) {
        filteredData = data.filter(item => item.obsStatus === filters.obsStatus);
      }

      setReportData(filteredData);
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

    // Define worksheet data
    const worksheetData = reportData.map(item => ({
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
      'Dealer View': item.dealerView || 'N/A'  // ✅ Export dealer view also
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 8 },  { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 10 }, { wch: 8 },  { wch: 10 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "UC Tyre Report");
    XLSX.writeFile(wb, `uc_tyre_report_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.xlsx`);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
      {reportData.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small" sx={{ tableLayout: 'auto', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Reg No</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Received Date</TableCell>
                <TableCell>Claim No</TableCell>
                <TableCell>Dealer</TableCell>
                <TableCell>Dealer Code</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Size Code</TableCell>
                <TableCell>Serial No</TableCell>
                <TableCell>Observation Date</TableCell>
                <TableCell>Remaining Tread Depth</TableCell>
                <TableCell>Technical Observation</TableCell>
                <TableCell>Observation No</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Consultant</TableCell>
                <TableCell>Dealer View</TableCell> {/* ✅ Added */}
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((item) => (
                <TableRow key={item.id} sx={{ height: 50 }}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    {item.receivedDate
                      ? format(new Date(item.receivedDate), 'dd/MM/yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{item.claimNo}</TableCell>
                  <TableCell>{item.dealerName || item.dealerCode}</TableCell>
                  <TableCell>{item.dealerCode}</TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.sizeCode}</TableCell>
                  <TableCell>{item.serialNo}</TableCell>
                  <TableCell>
                    {item.obsDate
                      ? format(new Date(item.obsDate), 'dd/MM/yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{item.treadDepth}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {item.techObs}
                  </TableCell>
                  <TableCell>{item.obsNo || 'N/A'}</TableCell>
                  <TableCell>{item.obsStatus}</TableCell>
                  <TableCell>{item.consultantName || 'N/A'}</TableCell>
                  <TableCell>{item.dealerView || 'N/A'}</TableCell> {/* ✅ Added */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ReportGenerator;
