import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const DailyReport = () => {
  const [data, setData] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    consultant: ''
  });

  // ✅ Fetch consultant list
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dailyReport/consultants');
        setConsultants(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConsultants();
  }, []);

  const fetchData = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select start and end dates');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/dailyReport`, {
        params: filters
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error fetching data');
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // ✅ Excel Download
  const downloadExcel = () => {
    if (!data.length) return alert('No data to download');

    const customHeaders = {
      brand: 'Brand',
      total_observed: 'Total Observed',
      total_observed_percent: 'Total Observed %',
      recommended: 'R',
      recommended_percent: 'R %',
      nr_count: 'NR',
      nr_percent: 'NR %',
      scn_count: 'SCN',
      scn_percent: 'SCN %'
    };

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, { header: Object.keys(customHeaders) });

    XLSX.utils.sheet_add_aoa(ws, [Object.values(customHeaders)], { origin: 'A1' });
    XLSX.utils.book_append_sheet(wb, ws, "Observation Summarize Report");
    XLSX.writeFile(wb, `Observation Summarize Report ${filters.startDate} to ${filters.endDate} by ${filters.consultant}.xlsx`);
  };

  // ✅ Calculate totals
  const totals = {
    total_observed: data.reduce((sum, row) => sum + (Number(row.total_observed) || 0), 0),
    recommended: data.reduce((sum, row) => sum + (Number(row.recommended) || 0), 0),
    nr_count: data.reduce((sum, row) => sum + (Number(row.nr_count) || 0), 0),
    scn_count: data.reduce((sum, row) => sum + (Number(row.scn_count) || 0), 0),
  };

  // ✅ PDF Download
  const downloadPDF = () => {
    if (!data.length) return alert('No data to download');

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Observation Summarize Report ${filters.startDate} to ${filters.endDate} by ${filters.consultant}`, 14, 15);

    const tableColumn = [
      "Brand","Total Observed","Total Observed %","R","R %","NR","NR %","SCN","SCN %"
    ];

    const tableRows = data.map(row => [
      row.brand,
      row.total_observed,
      `${row.total_observed_percent}%`,
      row.recommended,
      `${row.recommended_percent}%`,
      row.nr_count,
      `${row.nr_percent}%`,
      row.scn_count,
      `${row.scn_percent}%`
    ]);

    if (data.length > 0) {
      tableRows.push([
        "Grand Total Tyre",
        totals.total_observed,
        "100%",
        totals.recommended,
        `${((totals.recommended / totals.total_observed) * 100).toFixed(2)}%`,
        totals.nr_count,
        `${((totals.nr_count / totals.total_observed) * 100).toFixed(2)}%`,
        totals.scn_count,
        `${((totals.scn_count / totals.total_observed) * 100).toFixed(2)}%`
      ]);
    }

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10, halign: "center", valign: "middle" },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, halign: "center" },
      bodyStyles: { lineWidth: 0.2, lineColor: [0, 0, 0] },
    });

    doc.save(`Observation Summarize Report ${filters.startDate} to ${filters.endDate} by ${filters.consultant}.pdf`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Observation Summarize Report</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
        <TextField
          label="Start Date"
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
        />
        {/* ✅ Consultant dropdown */}
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

        <Button variant="contained" color="primary" onClick={fetchData}>
          Generate Report
        </Button>
        <Button variant="outlined" color="primary" onClick={downloadExcel}>
          Download Excel
        </Button>
        <Button variant="outlined" color="primary" onClick={downloadPDF}>
          Download PDF
        </Button>
      </div>

      {/* Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid black' }}>
        <Table sx={{ border: '1px solid black' }}>
          <TableHead>
            <TableRow>
              {[
                "Brand","Total Observed","Total Observed %","R","R %","NR","NR %","SCN","SCN %"
              ].map((head) => (
                <TableCell key={head} sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: '1px solid black' }}>{row.brand}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.total_observed}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.total_observed_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.recommended}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.recommended_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.nr_count}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.nr_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.scn_count}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.scn_percent}%</TableCell>
              </TableRow>
            ))}

            {data.length > 0 && (
              <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Grand Total Tyre</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.total_observed}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>100%</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.recommended}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.recommended / totals.total_observed) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.nr_count}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.nr_count / totals.total_observed) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.scn_count}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.scn_count / totals.total_observed) * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default DailyReport;


