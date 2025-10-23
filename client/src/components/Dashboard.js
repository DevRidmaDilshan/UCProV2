import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
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
  Box,
  Typography
} from '@mui/material';

// Register ChartJS components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [sizesData, setSizesData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showChart, setShowChart] = useState(false);
  const chartRef = useRef();

  const fetchData = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }
    try {
      const [res, sizesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/dashboard?startDate=${startDate}&endDate=${endDate}`),
        axios.get('http://localhost:5000/api/sizes') // Fetch sizes data
      ]);
      setData(res.data);
      setSizesData(sizesRes.data);
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
    doc.text(`Brand Wise Summarize Report (${startDate} to ${endDate})`, 14, 15);

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

  // ✅ FIXED: Enhanced function to organize brands by category with correct counts for each section
  const organizeBrandsByCategory = (brands, countField) => {
    if (!brands.length || !sizesData.length) return {};
    
    // Create brand to category mapping
    const brandCategoryMap = {};
    sizesData.forEach(size => {
      if (size.brand && size.category) {
        brandCategoryMap[size.brand] = size.category;
      }
    });
    
    // Group brands by category and calculate counts based on specific field
    const categories = {};
    brands.forEach(brand => {
      const category = brandCategoryMap[brand.name || brand.brand] || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = {
          brands: [],
          count: 0
        };
      }
      
      // Calculate count based on the specific field for this section
      let brandCount = 0;
      if (countField === 'manufacturingDefect') {
        brandCount = brand.manufacturingDefect || 0;
      } else if (countField === 'nrCount') {
        brandCount = brand.nrCount || 0;
      } else if (countField === 'scnCount') {
        brandCount = brand.scnCount || 0;
      }
      
      // Only add brand if it has a count in this section
      if (brandCount > 0) {
        categories[category].brands.push({
          ...brand,
          displayCount: brandCount
        });
        categories[category].count += brandCount;
      }
    });
    
    // ✅ FIXED: Filter out categories with zero count
    const filteredCategories = {};
    Object.entries(categories).forEach(([category, categoryData]) => {
      if (categoryData.count > 0) {
        filteredCategories[category] = categoryData;
      }
    });
    
    return filteredCategories;
  };

  // Flow chart data calculation
  const getFlowChartData = () => {
    if (!data.length) return null;

    const totalReceived = totals.total_received;
    const manufacturingDefect = totals.recommended;
    const withoutManufacturingDefect = totals.nr_count + totals.scn_count;

    // Calculate percentages
    const mdPercentage = ((manufacturingDefect / totalReceived) * 100).toFixed(2);
    const wmdPercentage = ((withoutManufacturingDefect / totalReceived) * 100).toFixed(2);
    const nrPercentage = ((totals.nr_count / withoutManufacturingDefect) * 100).toFixed(2);
    const scnPercentage = ((totals.scn_count / withoutManufacturingDefect) * 100).toFixed(2);

    // Brand breakdowns
    const brandBreakdown = data.map(brand => ({
      name: brand.brand,
      manufacturingDefect: brand.recommended,
      mdPercentage: ((brand.recommended / manufacturingDefect) * 100).toFixed(2),
      nrCount: brand.nr_count,
      nrPercentage: ((brand.nr_count / totals.nr_count) * 100).toFixed(2),
      scnCount: brand.scn_count,
      scnPercentage: ((brand.scn_count / totals.scn_count) * 100).toFixed(2)
    }));

    return {
      totalReceived,
      manufacturingDefect: {
        count: manufacturingDefect,
        percentage: mdPercentage,
        brands: brandBreakdown
      },
      withoutManufacturingDefect: {
        count: withoutManufacturingDefect,
        percentage: wmdPercentage,
        nr: {
          count: totals.nr_count,
          percentage: nrPercentage,
          brands: brandBreakdown
        },
        scn: {
          count: totals.scn_count,
          percentage: scnPercentage,
          brands: brandBreakdown
        }
      }
    };
  };

  // ✅ Fixed: Download Flow Chart as PDF using html2canvas
  const downloadFlowChartAsPDF = async () => {
    if (!chartRef.current) return;
    
    const canvas = await html2canvas(chartRef.current, {
      scale: 2, // Increase quality
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY, // Capture full content
      width: chartRef.current.scrollWidth,
      height: chartRef.current.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
    // Add image and save
    doc.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    doc.save(`flow_chart_${startDate}_to_${endDate}.pdf`);
  };

  // Flow Chart Component with corrected category organization
  const FlowChart = () => {
    const flowData = getFlowChartData();
    if (!flowData) return null;

    // ✅ FIXED: Organize brands by category with correct count fields for each section
    const manufacturingDefectByCategory = organizeBrandsByCategory(
      flowData.manufacturingDefect.brands, 
      'manufacturingDefect'
    );
    const nrByCategory = organizeBrandsByCategory(
      flowData.withoutManufacturingDefect.nr.brands, 
      'nrCount'
    );
    const scnByCategory = organizeBrandsByCategory(
      flowData.withoutManufacturingDefect.scn.brands, 
      'scnCount'
    );

    // Category Box Component with Arrow
    const CategoryBox = ({ category, categoryData, color, bgColor, countField }) => (
      <Box sx={{ mb: 2, p: 1, backgroundColor: 'white', borderRadius: 1, boxShadow: 1 }}>
        {/* Category Header with Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color }}>
            {category}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#666', 
            backgroundColor: `${bgColor}20`, 
            px: 1, 
            borderRadius: 1,
            fontWeight: 'bold'
          }}>
            Total: {categoryData.count}
          </Typography>
        </Box>
        
        {/* Down Arrow for Category */}
        <Box sx={{ position: 'relative', width: '100%', height: 20, display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box sx={{ position: 'relative', width: 2, height: 15, backgroundColor: '#666' }}>
            <Box sx={{ 
              position: 'absolute', 
              top: '100%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: 0, 
              height: 0, 
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid #666'
            }} />
          </Box>
        </Box>

        {/* Brands in this Category */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {categoryData.brands.map((brand, index) => (
            <Box
              key={`${category}-${index}`}
              sx={{
                p: 1,
                backgroundColor: bgColor,
                borderRadius: 1,
                textAlign: 'center',
                border: '1px solid transparent'
              }}
            >
              <Typography variant="body2" fontWeight="bold">{brand.name}</Typography>
              <Typography variant="body2">
                {brand.displayCount} (
                {countField === 'manufacturingDefect' ? brand.mdPercentage :
                 countField === 'nrCount' ? brand.nrPercentage :
                 brand.scnPercentage}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );

    return (
      <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center">
          Tyre Analysis Flow Chart
        </Typography>
        
        {/* Main Flow Container */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>

          {/* Level 1: Total Received */}
          <Box
            sx={{
              p: 3,
              backgroundColor: '#4CAF50',
              color: 'white',
              borderRadius: 2,
              textAlign: 'center',
              minWidth: 200,
              boxShadow: 3
            }}
          >
            <Typography variant="h6">Total Received Tyres</Typography>
            <Typography variant="h4">{flowData.totalReceived}</Typography>
            <Typography variant="body2">100%</Typography>
          </Box>

          {/* Down Arrow */}
          <Box sx={{ position: 'relative', width: 2, height: 40, backgroundColor: '#666' }}>
            <Box sx={{ 
              position: 'absolute', 
              top: '100%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: 0, 
              height: 0, 
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '12px solid #666'
            }} />
          </Box>

          {/* Level 2: Main Categories */}
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            
            {/* Manufacturing Defect */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center',
                  minWidth: 180,
                  boxShadow: 2
                }}
              >
                <Typography variant="h6">Manufacturing Defect</Typography>
                <Typography variant="h5">{flowData.manufacturingDefect.count}</Typography>
                <Typography variant="body2">{flowData.manufacturingDefect.percentage}%</Typography>
              </Box>

              {/* Down Arrow */}
              <Box sx={{ position: 'relative', width: 2, height: 30, backgroundColor: '#666', mt: 1 }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  width: 0, 
                  height: 0, 
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '10px solid #666'
                }} />
              </Box>

              {/* Category Sections for Manufacturing Defect */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, maxWidth: 300 }}>
                {Object.entries(manufacturingDefectByCategory).map(([category, categoryData]) => (
                  <CategoryBox
                    key={category}
                    category={category}
                    categoryData={categoryData}
                    color="#d32f2f"
                    bgColor="#FFB8B8"
                    countField="manufacturingDefect"
                  />
                ))}
                {/* ✅ FIXED: Show message when no categories have data */}
                {Object.keys(manufacturingDefectByCategory).length === 0 && (
                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No manufacturing defect data available
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Without Manufacturing Defect */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center',
                  minWidth: 220,
                  boxShadow: 2
                }}
              >
                <Typography variant="h6">Without Manufacturing Defect</Typography>
                <Typography variant="h5">{flowData.withoutManufacturingDefect.count}</Typography>
                <Typography variant="body2">{flowData.withoutManufacturingDefect.percentage}%</Typography>
              </Box>

              {/* Down Arrow */}
              <Box sx={{ position: 'relative', width: 2, height: 30, backgroundColor: '#666', mt: 1 }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  width: 0, 
                  height: 0, 
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '10px solid #666'
                }} />
              </Box>

              {/* Level 3: NR and SCN */}
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>

                {/* NR Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#45B7D1',
                      color: 'white',
                      borderRadius: 2,
                      textAlign: 'center',
                      minWidth: 150,
                      boxShadow: 2
                    }}
                  >
                    <Typography variant="h6">NR</Typography>
                    <Typography variant="h5">{flowData.withoutManufacturingDefect.nr.count}</Typography>
                    <Typography variant="body2">{flowData.withoutManufacturingDefect.nr.percentage}%</Typography>
                  </Box>

                  {/* Down Arrow */}
                  <Box sx={{ position: 'relative', width: 2, height: 25, backgroundColor: '#666', mt: 1 }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      width: 0, 
                      height: 0, 
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '8px solid #666'
                    }} />
                  </Box>

                  {/* Category Sections for NR */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, maxWidth: 300 }}>
                    {Object.entries(nrByCategory).map(([category, categoryData]) => (
                      <CategoryBox
                        key={category}
                        category={category}
                        categoryData={categoryData}
                        color="#0288d1"
                        bgColor="#A7E0E9"
                        countField="nrCount"
                      />
                    ))}
                    {Object.keys(nrByCategory).length === 0 && (
                      <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        No NR data available
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* SCN Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#96CEB4',
                      color: 'white',
                      borderRadius: 2,
                      textAlign: 'center',
                      minWidth: 150,
                      boxShadow: 2
                    }}
                  >
                    <Typography variant="h6">SCN</Typography>
                    <Typography variant="h5">{flowData.withoutManufacturingDefect.scn.count}</Typography>
                    <Typography variant="body2">{flowData.withoutManufacturingDefect.scn.percentage}%</Typography>
                  </Box>

                  {/* Down Arrow */}
                  <Box sx={{ position: 'relative', width: 2, height: 25, backgroundColor: '#666', mt: 1 }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      width: 0, 
                      height: 0, 
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '8px solid #666'
                    }} />
                  </Box>

                  {/* Category Sections for SCN */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, maxWidth: 300 }}>
                    {Object.entries(scnByCategory).map(([category, categoryData]) => (
                      <CategoryBox
                        key={category}
                        category={category}
                        categoryData={categoryData}
                        color="#388e3c"
                        bgColor="#C7E9D4"
                        countField="scnCount"
                      />
                    ))}
                    {Object.keys(scnByCategory).length === 0 && (
                      <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        No SCN data available
                      </Typography>
                    )}
                  </Box>
                </Box>

              </Box>
            </Box>

          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
          <Typography variant="h6" gutterBottom>Legend</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#4CAF50', borderRadius: 1 }} />
              <Typography variant="body2">Total Received</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#FF6B6B', borderRadius: 1 }} />
              <Typography variant="body2">Manufacturing Defect</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#4ECDC4', borderRadius: 1 }} />
              <Typography variant="body2">Without Manufacturing Defect</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#45B7D1', borderRadius: 1 }} />
              <Typography variant="body2">NR (Not Recommended)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#96CEB4', borderRadius: 1 }} />
              <Typography variant="body2">SCN (Special Case Note)</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Brand Wise Summarize Report</h2>
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
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowChart(!showChart)}
          sx={{ ml: 2 }}
        >
          {showChart ? 'Hide Flow Chart' : 'View Flow Chart'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={downloadFlowChartAsPDF}
          disabled={!showChart || !data.length}
          sx={{ ml: 2 }}
        >
          Download Flow Chart PDF
        </Button>
      </div>

      {/* ✅ Table with strong borders */}
      <TableContainer component={Paper} sx={{ border: '1px solid black' }}>
        <Table sx={{ border: '1px solid black' }}>
          <TableHead>
            <TableRow>
              {[
                "Brand","Total Received","Total Received %","Pending","Pending %","R","R %","NR","NR %","SCN","SCN %"
              ].map((head) => (
                <TableCell key={head} sx={{ border: '1px solid black', fontWeight: 'bold' }}>{head}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ border: '1px solid black' }}>{row.brand}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.total_received}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.total_received_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.pending}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.pending_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.recommended}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.recommended_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.nr_count}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.nr_percent}%</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.scn_count}</TableCell>
                <TableCell sx={{ border: '1px solid black' }}>{row.scn_percent}%</TableCell>
              </TableRow>
            ))}

            {/* ✅ Grand Total Row */}
            {data.length > 0 && (
              <TableRow sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>Grand Total Tyre</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.total_received}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>100%</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.pending}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.pending / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.recommended}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.recommended / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.nr_count}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.nr_count / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>{totals.scn_count}</TableCell>
                <TableCell sx={{ border: '1px solid black', fontWeight: 'bold' }}>
                  {((totals.scn_count / totals.total_received) * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ Fixed: Flow Chart Section with ref attached */}
      {showChart && data.length > 0 && (
        <Paper 
          sx={{ p: 2, mt: 3, width: 'fit-content', minWidth: '100%' }} 
          ref={chartRef}
        >
          <FlowChart />
        </Paper>
      )}
    </div>
  );
};

export default Dashboard;