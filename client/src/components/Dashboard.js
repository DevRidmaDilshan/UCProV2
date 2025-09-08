// Frontend/src/pages/Dashboard.js

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { format } from "date-fns";

const Dashboard = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);

  // Fetch data from backend
  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/dashboard?startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Brand",
      "Total Received",
      "Pending",
      "R Count",
      "NR Count",
      "SCN Count",
    ];

    const csvData = data.map((item) =>
      [
        item.brand,
        item.totalReceived,
        item.pending,
        item.rCount,
        item.nrCount,
        item.scnCount,
      ].join(",")
    );

    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tyre_dashboard_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Tyre Dashboard Report
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleGenerate}
              >
                Generate
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Box mt={3}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleExportCSV}
            sx={{ mb: 2 }}
          >
            Download CSV
          </Button>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>Total Received</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>R Count</TableCell>
                  <TableCell>NR Count</TableCell>
                  <TableCell>SCN Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell>{row.totalReceived}</TableCell>
                    <TableCell>{row.pending}</TableCell>
                    <TableCell>{row.rCount}</TableCell>
                    <TableCell>{row.nrCount}</TableCell>
                    <TableCell>{row.scnCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;

