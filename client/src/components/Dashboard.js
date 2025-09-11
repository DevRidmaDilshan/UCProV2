import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
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
  Paper
} from '@mui/material';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/api/dashboard?startDate=${startDate}&endDate=${endDate}`
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error fetching data');
    }
  };

  const downloadExcel = () => {
    if (!data.length) return alert('No data to download');

    const customHeaders = {
      brand: 'Brand',
      total_received: 'Total Received',
      total_received_percent: 'Total Received %',
      pending: 'Pending',
      pending_percent: 'Pending %',
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
    XLSX.utils.book_append_sheet(wb, ws, "Brand Report");
    XLSX.writeFile(wb, `dashboard_${startDate}_to_${endDate}.xlsx`);
  };

  // ✅ Calculate grand totals
  const totals = {
    total_received: data.reduce((sum, row) => sum + (Number(row.total_received) || 0), 0),
    pending: data.reduce((sum, row) => sum + (Number(row.pending) || 0), 0),
    recommended: data.reduce((sum, row) => sum + (Number(row.recommended) || 0), 0),
    nr_count: data.reduce((sum, row) => sum + (Number(row.nr_count) || 0), 0),
    scn_count: data.reduce((sum, row) => sum + (Number(row.scn_count) || 0), 0),
  };

  // ✅ Download PDF
    const downloadPDF = () => {
    if (!data.length) return alert('No data to download');

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Dashboard Report (${startDate} to ${endDate})`, 14, 15);

    const tableColumn = [
      "Brand","Total Received","Total Received %","Pending","Pending %","R","R %","NR","NR %","SCN","SCN %"
    ];

    const tableRows = data.map(row => [
      row.brand,
      row.total_received,
      `${row.total_received_percent}%`,
      row.pending,
      `${row.pending_percent}%`,
      row.recommended,
      `${row.recommended_percent}%`,
      row.nr_count,
      `${row.nr_percent}%`,
      row.scn_count,
      `${row.scn_percent}%`
    ]);

    // ✅ Add grand totals
    if (data.length > 0) {
      tableRows.push([
        "Grand Total Tyre",
        totals.total_received,
        "100%",
        totals.pending,
        `${((totals.pending / totals.total_received) * 100).toFixed(2)}%`,
        totals.recommended,
        `${((totals.recommended / totals.total_received) * 100).toFixed(2)}%`,
        totals.nr_count,
        `${((totals.nr_count / totals.total_received) * 100).toFixed(2)}%`,
        totals.scn_count,
        `${((totals.scn_count / totals.total_received) * 100).toFixed(2)}%`
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

    doc.save(`dashboard_${startDate}_to_${endDate}.pdf`);
  };


  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <div style={{ marginBottom: 20 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          style={{ marginRight: 10 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          style={{ marginRight: 10 }}
        />
        <Button variant="contained" color="primary" onClick={fetchData}>
          Generate Brand Report
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={downloadExcel}
          sx={{ ml: 2 }}
        >
          Download Excel
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={downloadPDF}
          sx={{ ml: 2 }}
        >
          Download PDF
        </Button>
      </div>

      {/* ✅ Table with strong borders */}
      <TableContainer component={Paper} sx={{ border: '2px solid black' }}>
        <Table sx={{ border: '2px solid black' }}>
          <TableHead>
            <TableRow>
              {[
                "Brand","Total Received","Total Received %","Pending","Pending %","R","R %","NR","NR %","SCN","SCN %"
              ].map((head) => (
                <TableCell key={head} sx={{ border: '2px solid black', fontWeight: 'bold' }}>{head}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: '2px solid black' }}>{row.brand}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.total_received}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.total_received_percent}%</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.pending}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.pending_percent}%</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.recommended}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.recommended_percent}%</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.nr_count}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.nr_percent}%</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.scn_count}</TableCell>
                <TableCell sx={{ border: '2px solid black' }}>{row.scn_percent}%</TableCell>
              </TableRow>
            ))}

            {/* ✅ Grand Total Row */}
            {data.length > 0 && (
              <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>Grand Total Tyre</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>{totals.total_received}</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>100%</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>{totals.pending}</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>
                  {((totals.pending / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>{totals.recommended}</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>
                  {((totals.recommended / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>{totals.nr_count}</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>
                  {((totals.nr_count / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>{totals.scn_count}</TableCell>
                <TableCell sx={{ border: '2px solid black', fontWeight: 'bold' }}>
                  {((totals.scn_count / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default Dashboard;

