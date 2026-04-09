import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, PictureAsPdf, TableChart } from '@mui/icons-material';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api';

const BrandReport = () => {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/registers/initial-data`);
        setBrands(res.data.brands || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBrands();
  }, []);

  const handleGenerate = async () => {
    if (!selectedBrand) {
      setError('Please select a brand');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/registers/brand-report`, {
        params: { brand: selectedBrand, startDate, endDate }
      });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Build flowchart HTML with arrows
  const buildFlowchartHTML = () => {
    if (!reportData) return '';
    const { brand, period, totalReceived, recommended, nr, scn, pending } = reportData;
    const totalR = recommended.total;
    const totalNR = nr;
    const totalSCN = scn;
    const totalPending = pending;

    const rPercent = totalReceived ? ((totalR / totalReceived) * 100).toFixed(1) : '0.0';
    const nrPercent = totalReceived ? ((totalNR / totalReceived) * 100).toFixed(1) : '0.0';
    const scnPercent = totalReceived ? ((totalSCN / totalReceived) * 100).toFixed(1) : '0.0';
    const pendingPercent = totalReceived ? ((totalPending / totalReceived) * 100).toFixed(1) : '0.0';

    // Build R breakdown HTML for the flowchart (nested lists with lines)
    const buildRTree = () => {
      const breakdown = recommended.breakdown || [];
      if (breakdown.length === 0) return '<div>No R breakdown</div>';
      let html = '<div class="tree">';
      breakdown.forEach(defect => {
        const defectPercent = totalR ? ((defect.total / totalR) * 100).toFixed(1) : '0.0';
        html += `
          <div class="tree-node">
            <div class="node-box defect-node">
              <strong>${defect.obsCategory}</strong><br/>
              ${defect.total} (${defectPercent}%)
            </div>
            <div class="children">
        `;
        defect.sizeCategories.forEach(size => {
          const sizePercent = defect.total ? ((size.count / defect.total) * 100).toFixed(1) : '0.0';
          html += `
            <div class="tree-node">
              <div class="node-box size-node">
                ${size.name}<br/>
                ${size.count} (${sizePercent}%)
              </div>
            </div>
          `;
        });
        html += `</div></div>`;
      });
      html += '</div>';
      return html;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${brand} - Flowchart Report</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            padding: 30px 20px;
            margin: 0;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #2c3e50;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
            color: #7f8c8d;
          }
          .date-range {
            text-align: center;
            font-size: 14px;
            margin-bottom: 40px;
            color: #2c3e50;
          }
          /* Flowchart tree styles */
          .tree {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          .tree-root {
            display: flex;
            justify-content: center;
            margin-bottom: 40px;
          }
          .root-box {
            background: #3498db;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            min-width: 200px;
          }
          .main-branches {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 30px;
            margin: 30px 0 40px;
            position: relative;
          }
          .branch {
            text-align: center;
            flex: 1;
            min-width: 120px;
          }
          .branch-box {
            padding: 12px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .branch-box.r { background-color: #2ecc71; }
          .branch-box.nr { background-color: #e74c3c; }
          .branch-box.scn { background-color: #f39c12; }
          .branch-box.pending { background-color: #95a5a6; }
          .arrow-down {
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 20px solid #7f8c8d;
            margin: 10px auto;
          }
          .r-breakdown {
            margin-top: 30px;
            border-top: 2px dashed #bdc3c7;
            padding-top: 30px;
          }
          .r-breakdown-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
          }
          .tree {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 40px;
          }
          .tree-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }
          .node-box {
            background: #ecf0f1;
            border-radius: 8px;
            padding: 10px 15px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            min-width: 140px;
          }
          .defect-node {
            background: #f8c471;
            border-left: 5px solid #e67e22;
          }
          .size-node {
            background: #d5f5e3;
            border-left: 5px solid #27ae60;
          }
          .children {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            position: relative;
          }
          /* Draw connecting lines (simple) */
          .tree-node:not(:only-child)::before {
            content: '';
            position: absolute;
            top: -15px;
            left: 50%;
            width: 2px;
            height: 20px;
            background: #7f8c8d;
            transform: translateX(-50%);
          }
          .children {
            position: relative;
          }
          .children::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            height: 2px;
            background: #7f8c8d;
          }
          .tree-node .children .tree-node::before {
            top: -10px;
            height: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #95a5a6;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>${brand}</h1>
            <h2>SUMMARIZED REPORT (Flowchart)</h2>
          </div>
          <div class="date-range">
            Date Range : ${period.startDate} - ${period.endDate}
          </div>

          <!-- Root -->
          <div class="tree-root">
            <div class="root-box">
              Received During the Month<br/>
              <span style="font-size: 32px;">${totalReceived}</span><br/>
              100%
            </div>
          </div>

          <!-- Arrow from root to branches -->
          <div class="arrow-down"></div>

          <!-- Main branches: R, NR, SCN, Pending -->
          <div class="main-branches">
            <div class="branch">
              <div class="branch-box r">R (Recommended)</div>
              <div>${totalR}</div>
              <div>${rPercent}%</div>
            </div>
            <div class="branch">
              <div class="branch-box nr">NR</div>
              <div>${totalNR}</div>
              <div>${nrPercent}%</div>
            </div>
            <div class="branch">
              <div class="branch-box scn">SCN</div>
              <div>${totalSCN}</div>
              <div>${scnPercent}%</div>
            </div>
            <div class="branch">
              <div class="branch-box pending">Pending</div>
              <div>${totalPending}</div>
              <div>${pendingPercent}%</div>
            </div>
          </div>

          <!-- R Breakdown with arrows -->
          ${totalR > 0 ? `
            <div class="r-breakdown">
              <div class="arrow-down"></div>
              <div class="r-breakdown-title">▼ Breakdown of R (Recommended) ▼</div>
              ${buildRTree()}
            </div>
          ` : ''}

          <div class="footer">
            Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download PDF (flowchart style)
  const handleDownloadPDF = async () => {
    if (!reportData) {
      alert('No report data to download');
      return;
    }
    setDownloading(true);
    try {
      const htmlContent = buildFlowchartHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // mm
      const pageHeight = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${selectedBrand}_flowchart_${startDate}_to_${endDate}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Excel download (tabular, hierarchical)
  const handleDownloadExcel = () => {
    if (!reportData) {
      alert('No report data to download');
      return;
    }
    const { brand, period, totalReceived, recommended, nr, scn, pending } = reportData;
    const totalR = recommended.total;
    const rPercent = totalReceived ? ((totalR / totalReceived) * 100).toFixed(1) : '0.0';
    const nrPercent = totalReceived ? ((nr / totalReceived) * 100).toFixed(1) : '0.0';
    const scnPercent = totalReceived ? ((scn / totalReceived) * 100).toFixed(1) : '0.0';
    const pendingPercent = totalReceived ? ((pending / totalReceived) * 100).toFixed(1) : '0.0';

    const rows = [
      [`${brand} - SUMMARIZED REPORT`],
      [`Date Range: ${period.startDate} to ${period.endDate}`],
      [],
      ['Category', 'Count', 'Percentage (%)'],
      ['Received During the Month', totalReceived, '100%'],
      ['  R (Recommended)', totalR, rPercent],
      ['  NR', nr, nrPercent],
      ['  SCN', scn, scnPercent],
      ['  Pending', pending, pendingPercent],
      []
    ];

    if (recommended.breakdown && recommended.breakdown.length > 0) {
      rows.push(['Breakdown of R (Recommended) by Defect and Size Category']);
      rows.push(['Defect / Size Category', 'Count', 'Percentage (%)']);
      recommended.breakdown.forEach(defect => {
        const defectPercent = totalR ? ((defect.total / totalR) * 100).toFixed(1) : '0.0';
        rows.push([`    ${defect.obsCategory}`, defect.total, defectPercent]);
        defect.sizeCategories.forEach(size => {
          const sizePercent = defect.total ? ((size.count / defect.total) * 100).toFixed(1) : '0.0';
          rows.push([`        |-- ${size.name}`, size.count, sizePercent]);
        });
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Brand Report');
    XLSX.writeFile(wb, `${selectedBrand}_report_${startDate}_to_${endDate}.xlsx`);
  };

  // Screen view (accordion)
  const renderRecommendedBreakdown = () => {
    const { breakdown } = reportData.recommended;
    if (!breakdown || breakdown.length === 0) {
      return <Typography>No Recommended claims in this period.</Typography>;
    }
    return (
      <Box sx={{ mt: 2 }}>
        {breakdown.map((item, idx) => (
          <Accordion key={idx} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                {item.obsCategory} &nbsp; <strong>({item.total} tyres)</strong>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Size Category</strong></TableCell>
                      <TableCell align="right"><strong>Count</strong></TableCell>
                      <TableCell align="right"><strong>% within this defect</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.sizeCategories.map((size, i) => (
                      <TableRow key={i}>
                        <TableCell>{size.name}</TableCell>
                        <TableCell align="right">{size.count}</TableCell>
                        <TableCell align="right">
                          {((size.count / item.total) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  if (!reportData) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Brand Report
        </Typography>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Select Brand</InputLabel>
                <Select
                  value={selectedBrand}
                  label="Select Brand"
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="From Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="To Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Brand Report
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Select Brand</InputLabel>
              <Select
                value={selectedBrand}
                label="Select Brand"
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="From Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="To Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="contained" onClick={handleGenerate} disabled={loading} fullWidth>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#1976d2', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Total Received</Typography>
              <Typography variant="h3">{reportData.totalReceived}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#4caf50', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">R (Recommended)</Typography>
              <Typography variant="h3">{reportData.recommended.total}</Typography>
              <Typography variant="body2">
                {((reportData.recommended.total / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f44336', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">NR</Typography>
              <Typography variant="h3">{reportData.nr}</Typography>
              <Typography variant="body2">
                {((reportData.nr / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ff9800', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">SCN</Typography>
              <Typography variant="h3">{reportData.scn}</Typography>
              <Typography variant="body2">
                {((reportData.scn / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#9e9e9e', color: 'white' }}>
            <CardContent>
              <Typography variant="h6">Pending</Typography>
              <Typography variant="h3">{reportData.pending}</Typography>
              <Typography variant="body2">
                {((reportData.pending / reportData.totalReceived) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Download Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PictureAsPdf />}
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? 'Generating PDF...' : 'Download Flowchart PDF'}
        </Button>
        <Button
          variant="contained"
          startIcon={<TableChart />}
          onClick={handleDownloadExcel}
          disabled={downloading}
        >
          Download Excel Report
        </Button>
      </Box>

      {/* Recommended Breakdown (Screen View) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Recommended Breakdown by Defect Category and Size Category
      </Typography>
      {renderRecommendedBreakdown()}
    </Box>
  );
};

export default BrandReport;