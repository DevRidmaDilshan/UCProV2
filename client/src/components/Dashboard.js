import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

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
      const res = await axios.get(`http://localhost:5000/dashboard?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error fetching data');
    }
  };

  const downloadCSV = () => {
    if (!data.length) return alert('No data to download');
    const header = ['Brand','Total Received','Pending','R','NR','SCN'];
    const rows = data.map(d => [d.brand, d.total_received, d.pending, d.r_count, d.nr_count, d.scn_count]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_${startDate}_to_${endDate}.csv`;
    link.click();
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
        <Button variant="contained" color="primary" onClick={fetchData}>Fetch</Button>
        <Button variant="outlined" color="secondary" onClick={downloadCSV} style={{ marginLeft: 10 }}>Download CSV</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Brand</TableCell>
            <TableCell>Total Received</TableCell>
            <TableCell>Pending</TableCell>
            <TableCell>R</TableCell>
            <TableCell>NR</TableCell>
            <TableCell>SCN</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.brand}</TableCell>
              <TableCell>{row.total_received}</TableCell>
              <TableCell>{row.pending}</TableCell>
              <TableCell>{row.r_count}</TableCell>
              <TableCell>{row.nr_count}</TableCell>
              <TableCell>{row.scn_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Dashboard;
