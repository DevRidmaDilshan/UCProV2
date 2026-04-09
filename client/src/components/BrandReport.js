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

  // Build compact, one‑page flowchart HTML
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

    // Build R breakdown tree HTML (compact)
    const buildRTree = () => {
      const breakdown = recommended.breakdown || [];
      if (breakdown.length === 0) return '<div style="text-align:center;">No R breakdown</div>';
      
      let html = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">';
      breakdown.forEach(defect => {
        const defectPercent = totalR ? ((defect.total / totalR) * 100).toFixed(1) : '0.0';
        html += `
          <div style="text-align: center; min-width: 120px;">
            <div style="background: #f8c471; padding: 8px 12px; border-radius: 8px; border-left: 4px solid #e67e22;">
              <strong>${defect.obsCategory}</strong><br/>
              ${defect.total} (${defectPercent}%)
            </div>
            <div style="margin-top: 8px;">
              ${defect.sizeCategories.map(size => {
                const sizePercent = defect.total ? ((size.count / defect.total) * 100).toFixed(1) : '0.0';
                return `<div style="background: #d5f5e3; margin-top: 4px; padding: 4px 8px; border-radius: 6px; border-left: 3px solid #27ae60;">
                          ${size.name}<br/>
                          ${size.count} (${sizePercent}%)
                        </div>`;
              }).join('')}
            </div>
          </div>
        `;
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
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            padding: 15px;
            font-size: 11px;
          }
          .report {
            max-width: 1100px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 20px;
            margin: 0;
          }
          .header h2 {
            font-size: 14px;
            color: #555;
          }
          .date-range {
            text-align: center;
            font-size: 11px;
            margin-bottom: 20px;
          }
          .flowchart {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .root-box {
            background: #3498db;
            color: white;
            padding: 8px 16px;
            border-radius: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 5px;
          }
          .arrow-down {
            font-size: 20px;
            margin: 5px 0;
            text-align: center;
          }
          .branches {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 15px;
            margin: 10px 0 15px;
            width: 100%;
          }
          .branch {
            text-align: center;
            flex: 1;
            min-width: 80px;
          }
          .branch-box {
            padding: 6px 10px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 12px;
          }
          .branch-box.r { background-color: #2ecc71; }
          .branch-box.nr { background-color: #e74c3c; }
          .branch-box.scn { background-color: #f39c12; }
          .branch-box.pending { background-color: #95a5a6; }
          .branch-value {
            font-size: 14px;
            font-weight: bold;
            margin-top: 4px;
          }
          .branch-percent {
            font-size: 10px;
            color: #555;
          }
          .r-section {
            margin-top: 15px;
            border-top: 1px dashed #ccc;
            padding-top: 15px;
            width: 100%;
          }
          .r-title {
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 12px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>${brand}</h1>
            <h2>SUMMARIZED REPORT</h2>
          </div>
          <div class="date-range">
            ${period.startDate} - ${period.endDate}
          </div>

          <div class="flowchart">
            <!-- Root -->
            <div class="root-box">
              Received During The Month<br/>
              <span style="font-size: 20px;">${totalReceived}</span><br/>
              100%
            </div>
            <div class="arrow-down">▼</div>

            <!-- Main branches -->
            <div class="branches">
              <div class="branch">
                <div class="branch-box r">R</div>
                <div class="branch-value">${totalR}</div>
                <div class="branch-percent">${rPercent}%</div>
              </div>
              <div class="branch">
                <div class="branch-box nr">NR</div>
                <div class="branch-value">${totalNR}</div>
                <div class="branch-percent">${nrPercent}%</div>
              </div>
              <div class="branch">
                <div class="branch-box scn">SCN</div>
                <div class="branch-value">${totalSCN}</div>
                <div class="branch-percent">${scnPercent}%</div>
              </div>
              <div class="branch">
                <div class="branch-box pending">Pending</div>
                <div class="branch-value">${totalPending}</div>
                <div class="branch-percent">${pendingPercent}%</div>
              </div>
            </div>

            <!-- R Breakdown -->
            ${totalR > 0 ? `
              <div class="r-section">
                <div class="arrow-down">▼</div>
                <div class="r-title">Breakdown of R (Recommended)</div>
                ${buildRTree()}
              </div>
            ` : ''}
          </div>

          <div class="footer">
            Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Download PDF – scaled to fit one page
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
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If image height is larger than page height, we scale it down to fit
      let finalHeight = imgHeight;
      let yOffset = 10;
      if (imgHeight > pageHeight - 20) {
        // Scale to fit height
        const scale = (pageHeight - 20) / imgHeight;
        finalHeight = pageHeight - 20;
        // We'll add the image scaled; width adjusts accordingly
        const scaledWidth = imgWidth * scale;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, finalHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, finalHeight);
      }

      pdf.save(`${selectedBrand}_flowchart_${startDate}_to_${endDate}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Excel download (tabular)
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