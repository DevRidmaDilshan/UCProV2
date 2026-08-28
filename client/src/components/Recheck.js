// components/Recheck.js
import React, { useState, useEffect } from 'react';
import {
  getRegisterListForRecheck,
  getAllRechecks as fetchAllRechecksApi,
  getAllObservations,
  getRegisterDetailsForRecheck,
  updateRecheck,
  saveRecheck,
  deleteRecheck
} from '../services/api';
import {
  Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Box, Grid, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Autocomplete, Card, CardContent, IconButton, List, ListItem,
  ListItemText, ListItemSecondaryAction, Checkbox, FormControlLabel, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Save, Print, Refresh, Edit, Delete, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const Recheck = () => {
  const [searchType, setSearchType] = useState('id');
  const [registerList, setRegisterList] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [registerDetails, setRegisterDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rechecks, setRechecks] = useState([]);
  const [message, setMessage] = useState('');
  const [observations, setObservations] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [customObservation, setCustomObservation] = useState('');
  const [manufacturingDefect, setManufacturingDefect] = useState(false);
  const [noManufacturingDefect, setNoManufacturingDefect] = useState(false);
  const [currentObservation, setCurrentObservation] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    reObsDate: format(new Date(), 'yyyy-MM-dd'),
    reObsStatus: '',
    reObs: '',
    reTreadDepth: ''
  });

  useEffect(() => {
    fetchRegisterList();
    fetchAllRechecks();
    fetchObservations();
  }, []);

  const fetchRegisterList = async () => {
    try {
      const res = await getRegisterListForRecheck();
      setRegisterList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllRechecks = async () => {
    try {
      const res = await fetchAllRechecksApi();
      setRechecks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await getAllObservations();
      setObservations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSelect = async (event, newValue) => {
    setSelectedRegister(newValue);
    if (newValue) {
      setLoading(true);
      try {
        const res = await getRegisterDetailsForRecheck(searchType, newValue[searchType]);
        setRegisterDetails(res.data);
        // Reset form
        setFormData({
          reObsDate: format(new Date(), 'yyyy-MM-dd'),
          reObsStatus: '',
          reObs: '',
          reTreadDepth: ''
        });
        setSelectedObservations([]);
        setManufacturingDefect(false);
        setNoManufacturingDefect(false);
        setEditMode(false);
      } catch (err) {
        console.error(err);
        setRegisterDetails(null);
      } finally {
        setLoading(false);
      }
    } else {
      setRegisterDetails(null);
    }
  };

  // Build techObs string from selections
  const buildTechObs = () => {
    let text = '';
    selectedObservations.forEach((obs, i) => {
      text += `${i + 1}) ${obs.observation}\n`;
    });
    if (manufacturingDefect) text += '(Manufacturing Defect)\n';
    if (noManufacturingDefect) text += '(No Manufacturing Defect)\n';
    return text.trim();
  };

  const addObservation = () => {
    if (currentObservation && !selectedObservations.find(obs => obs.id === currentObservation.obId)) {
      setSelectedObservations(prev => [
        ...prev,
        { id: currentObservation.obId, observation: currentObservation.observation, isCustom: false }
      ]);
      setCurrentObservation(null);
    }
  };

  const removeObservation = (id) => {
    setSelectedObservations(prev => prev.filter(obs => obs.id !== id));
  };

  const addCustomObservation = () => {
    if (customObservation.trim()) {
      setSelectedObservations(prev => [
        ...prev,
        { id: `CUSTOM-${Date.now()}`, observation: customObservation.trim(), isCustom: true }
      ]);
      setCustomObservation('');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!selectedRegister) {
      setMessage('Please select a register');
      return;
    }
    if (!formData.reObsDate || !formData.reObsStatus) {
      setMessage('Recheck date and status are required');
      return;
    }
    const techObsString = buildTechObs();
    setSaving(true);
    setMessage('');
    try {
      if (editMode) {
        await updateRecheck(editId, {
          reObsDate: formData.reObsDate,
          reObsStatus: formData.reObsStatus,
          reObs: techObsString,
          reTreadDepth: formData.reTreadDepth
        });
        setMessage('Recheck updated successfully');
      } else {
        await saveRecheck({
          id: selectedRegister.id,
          reObsDate: formData.reObsDate,
          reObsStatus: formData.reObsStatus,
          reObs: techObsString,
          reTreadDepth: formData.reTreadDepth
        });
        setMessage('Recheck saved successfully');
      }
      // Reset form
      setFormData({
        reObsDate: format(new Date(), 'yyyy-MM-dd'),
        reObsStatus: '',
        reObs: '',
        reTreadDepth: ''
      });
      setSelectedObservations([]);
      setManufacturingDefect(false);
      setNoManufacturingDefect(false);
      setSelectedRegister(null);
      setRegisterDetails(null);
      setEditMode(false);
      fetchAllRechecks();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error saving recheck');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (recheck) => {
    setEditMode(true);
    setEditId(recheck.id);
    setSelectedRegister({ id: recheck.id, obsNo: recheck.obsNo });
    setRegisterDetails({
      claimNo: recheck.claimNo,
      dealerView: recheck.dealerView,
      brand: recheck.brand,
      size: recheck.size,
      pr: recheck.pr,
      pattern: recheck.pattern,
      serialNo: recheck.serialNo,
      obsNo: recheck.obsNo,
      obsDate: recheck.obsDate,
      obsStatus: recheck.obsStatus,
      techObs: recheck.techObs,
      treadDepth: recheck.treadDepth
    });
    setFormData({
      reObsDate: recheck.reObsDate ? format(new Date(recheck.reObsDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      reObsStatus: recheck.reObsStatus || '',
      reObs: recheck.reObs || '',
      reTreadDepth: recheck.reTreadDepth || ''
    });
    // Parse existing reObs into selectedObservations
    if (recheck.reObs) {
      const lines = recheck.reObs.split('\n').filter(l => l.trim());
      const newSelected = [];
      lines.forEach(line => {
        if (line.includes('(Manufacturing Defect)')) {
          setManufacturingDefect(true);
        } else if (line.includes('(No Manufacturing Defect)')) {
          setNoManufacturingDefect(true);
        } else {
          const match = line.match(/^\d+\)\s+(.+)$/);
          const obsText = match ? match[1] : line;
          const found = observations.find(o => obsText.includes(o.observation) || o.observation === obsText);
          if (found) {
            newSelected.push({ id: found.obId, observation: found.observation, isCustom: false });
          } else {
            newSelected.push({ id: `CUSTOM-${Date.now()}`, observation: obsText, isCustom: true });
          }
        }
      });
      setSelectedObservations(newSelected);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecheck(deleteId);
      fetchAllRechecks();
      setDeleteId(null);
      setMessage('Recheck deleted successfully');
    } catch (err) {
      console.error(err);
      setMessage('Error deleting recheck');
    }
  };

  // ---------- UPDATED PRINT FUNCTION WITH LOGO ----------
  const handlePrint = (recheck) => {
    let headerTitle = "RECHECK NOTE";
    let noteNumberLabel = "Recheck No";

    const recheckDisplay = recheck.reNo
      ? `${recheck.reNo.toString().padStart(4, '0')}`
      : recheck.reObsNo;

    // Format observations with line breaks
    const formattedPrevObs = recheck.techObs
      ? recheck.techObs.replace(/\n/g, '<br/>')
      : 'N/A';

    const formattedPresentObs = recheck.reObs
      ? recheck.reObs.replace(/\n/g, '<br/>')
      : 'N/A';

    const logoHtml = `
      <img
        src="/recheck.png"
        alt="Logo"
        style="
          height: 180px;
          position: absolute;
          top: 0;
          left: 0;
          object-fit: contain;
        "
      >
    `;

    const content = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<title>${headerTitle} - ${recheckDisplay}</title>

<style>

/* =========================================================
   A4 PAGE
   ========================================================= */

@page {
  size: A4 portrait;
  margin: 0;
}


/* =========================================================
   GLOBAL
   ========================================================= */

* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Times New Roman", Times, serif;
  font-size: 15px;
  line-height: 1.15;
  color: #000;
  background: #fff;
}


/* =========================================================
   A4 PAGE CONTAINER
   ========================================================= */

.page {
  position: relative;

  width: 210mm;
  height: 297mm;

  margin: 0 auto;

  padding: 10mm 12mm 27mm 12mm;

  background: #fff;

  overflow: hidden;

  box-sizing: border-box;
}


/* =========================================================
   MAIN CONTAINER
   ========================================================= */

.container {
  position: relative;  /* added for logo positioning */
  width: 100%;

  margin: 0;
  padding: 0;

  border: none;

  box-sizing: border-box;
}


/* =========================================================
   HEADER
   ========================================================= */

.header {
  margin-top: 55px;  /* space for logo */
  text-align: right;

  margin-bottom: 3px;

  font-size: 15px;

  line-height: 1.2;
}

.header div {
  margin: 1px 0;
}

.header b {
  font-size: 16px;
}


/* =========================================================
   MAIN TITLE
   ========================================================= */

.title {
  text-align: center;

  font-weight: bold;

  font-size: 28px;

  line-height: 1.1;

  margin: 4px 0 10px;

  text-transform: uppercase;

  text-decoration: underline;
}


/* =========================================================
   ALL TABLES
   ========================================================= */

table {
  border-collapse: collapse;

  width: 100%;

  margin-bottom: 9px;

  font-family: "Times New Roman", Times, serif;

  font-size: 15px;

  page-break-inside: avoid;
}

th,
td {
  border: 1px solid #000;

  padding: 6px 8px;

  text-align: center;

  vertical-align: middle;

  font-family: "Times New Roman", Times, serif;
}

th {
  font-size: 16px;

  font-weight: bold;
}

td {
  font-size: 15px;
}


/* =========================================================
   CLAIM INFORMATION
   ========================================================= */

.claim-info {
  width: 45%;

  margin-left: auto;

  margin-bottom: 10px;
}

.claim-info th {
  height: 32px;

  font-size: 16px;
}

.claim-info td {
  height: 40px;

  font-size: 16px;
}


/* =========================================================
   AGENT / CUSTOMER
   ========================================================= */

.agent-customer {
  width: 100%;

  margin-bottom: 10px;
}

.agent-customer th {
  height: 35px;

  font-size: 16px;
}

.agent-customer td {
  height: 46px;

  font-size: 16px;
}


/* =========================================================
   TYRE DETAILS
   ========================================================= */

.tyre-details {
  width: 100%;

  margin-bottom: 10px;
}

.tyre-details th {
  height: 36px;

  font-size: 16px;
}

.tyre-details td {
  height: 44px;

  font-size: 16px;
}


/* =========================================================
   OBSERVATIONS TABLE (PREVIOUS / PRESENT)
   ========================================================= */

.obs-table {
  width: 100%;

  margin-bottom: 10px;

  table-layout: fixed;
}

.obs-table th {
  font-size: 16px;

  font-weight: bold;

  height: 36px;
}

.obs-table td {
  font-size: 15px;

  text-align: left;

  padding: 8px 10px;

  line-height: 1.35;

  vertical-align: top;
}

.obs-table .label-col {
  width: 25%;
  text-align: left;
  font-weight: bold;
  vertical-align: middle;
}

.obs-table .prev-col,
.obs-table .pres-col {
  width: 37.5%;
}

/* Technical observation rows */
.obs-table .tech-row td {
  min-height: 95px;
  height: 95px;
}

/* Tread depth row */
.obs-table .tread-row td {
  height: 45px;
  min-height: 45px;
  vertical-align: middle;
  text-align: center;
}

.obs-table .tread-row .label-col {
  text-align: left;
}


/* =========================================================
   REFUND STATUS
   ========================================================= */

.refund-status {
  display: block;

  font-size: 17px;

  font-weight: bold;

  margin-top: 7px;

  margin-bottom: 3px;
}

/* =========================================================
   SIGNATURE SECTION
   ========================================================= */

.signatures {
  display: flex;

  justify-content: center;

  align-items: flex-start;

  width: 100%;

  margin-top: 35px;

  margin-bottom: 10px;

  page-break-inside: avoid;

  transform: translateX(-15px);
}

.signature-box {
  width: 55%;

  text-align: center;

  font-size: 15px;

  line-height: 1.3;

  min-height: 65px;
}

.signature-box b {
  font-size: 15px;
}

.signature-line {
  font-size: 15px;
  letter-spacing: 0.5px;
}


/* =========================================================
   DIVIDER
   ========================================================= */

.divider {
  width: 100%;

  border-top: 1px solid #000;

  margin: 8px 0 12px;
}


/* =========================================================
   REFUND TABLE
   ========================================================= */

.refund-table {
  width: 60%;

  margin: 0 0 12px auto;

  font-size: 15px;

  page-break-inside: avoid;
}

.refund-table th {
  height: 32px;

  font-size: 15px;
}

.refund-table td {
  height: 45px;

  font-size: 15px;
}


/* =========================================================
   APPROVAL SECTION
   ========================================================= */

.approval-section {
  width: 100%;

  margin-top: 20px;

  page-break-inside: avoid;
}

.approval-row {
  display: flex;

  align-items: flex-start;

  width: 100%;

  min-height: 75px;

  page-break-inside: avoid;
}

.approved-label {
  width: 42%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;
}

.accepted-label {
  width: 16%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;

  white-space: nowrap;
}

.accepted-box {
  width: 42%;

  height: 75px;

  border: 1px solid #000;

  margin-left: 8px;

  position: relative;

  flex-shrink: 0;
}

.accepted-box-space {
  width: 100%;

  height: 100%;
}


/* =========================================================
   FOOTER NOTE
   ========================================================= */

.page-footer {
  position: absolute;

  left: 12mm;

  right: 12mm;

  bottom: 8mm;

  text-align: center;

  font-family: "Times New Roman", Times, serif;

  font-size: 13px;

  line-height: 1.25;

  font-style: italic;

  page-break-inside: avoid;
}

.page-footer-line {
  width: 100%;

  border-top: 1px solid #000;

  margin-bottom: 7px;
}

.page-footer b {
  font-size: 13px;
}


/* =========================================================
   PRINT BUTTONS
   ========================================================= */

.no-print {
  font-family: Arial, sans-serif;
}


/* =========================================================
   PRINT
   ========================================================= */

@media print {

  @page {
    size: A4 portrait;

    margin: 0;
  }

  html,
  body {
    width: 210mm;

    height: 297mm;

    margin: 0;

    padding: 0;

    font-family: "Times New Roman", Times, serif;

    background: #fff;
  }

  body {
    font-size: 15px;
  }

  .no-print {
    display: none !important;
  }

  .page {
    width: 210mm;

    height: 297mm;

    margin: 0;

    padding: 10mm 12mm 27mm 12mm;

    overflow: hidden;

    page-break-before: avoid;

    page-break-after: avoid;

    page-break-inside: avoid;
  }

  .container {
    width: 100%;

    margin: 0;

    padding: 0;

    border: none;
  }

  table {
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
  }

  .signatures {
    page-break-inside: avoid;
  }

  .refund-table {
    page-break-inside: avoid;
  }

  .approval-section {
    page-break-inside: avoid;
  }

  .approval-row {
    page-break-inside: avoid;
  }

  .accepted-box {
    page-break-inside: avoid;
  }

  .page-footer {
    page-break-inside: avoid;
  }
}

</style>

</head>


<body>


<!-- =====================================================
     PRINT BUTTONS
     ===================================================== -->

<div
  class="no-print"
  style="
    margin-top: 20px;
    margin-bottom: 15px;
    text-align: center;
  "
>

  <button
    onclick="window.print()"
    style="
      padding: 8px 20px;
      font-size: 15px;
      margin-right: 8px;
      cursor: pointer;
    "
  >
    Print
  </button>


  <button
    onclick="window.close()"
    style="
      padding: 8px 20px;
      font-size: 15px;
      cursor: pointer;
    "
  >
    Close
  </button>

</div>


<!-- =====================================================
     A4 PAGE
     ===================================================== -->

<div class="page">


  <!-- ===================================================
       MAIN DOCUMENT
       =================================================== -->

  <div class="container">

    <!-- LOGO -->
    ${logoHtml}

    <!-- =================================================
         HEADER
         ================================================= -->

    <div class="header">

      <div>
        Reg. No:
        <b>${recheck.id}</b>
      </div>

      <div>
        ${noteNumberLabel}:
        <b>${recheckDisplay}</b>
      </div>

      <div>
        Obs. No:
        <b>${recheck.obsNo || 'N/A'}</b>
      </div>

    </div>


    <!-- =================================================
         TITLE
         ================================================= -->

    <div class="title">
      ${headerTitle}
    </div>


    <!-- =================================================
         CLAIM INFORMATION
         ================================================= -->

    <table class="claim-info">

      <tr>

        <th style="width: 50%;">
          Claim No
        </th>

        <th>
          Date of Claim
        </th>

      </tr>


      <tr>

        <td>
          ${recheck.claimNo || 'N/A'}
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         AGENT / CUSTOMER
         ================================================= -->

    <table
      class="agent-customer"
      style="width:100%;"
    >

      <tr>

        <th style="width: 50%;">
          AGENT
        </th>

        <th>
          CUSTOMER
        </th>

      </tr>


      <tr>

        <td>
          ${recheck.dealerView || 'N/A'}
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         TYRE DETAILS
         ================================================= -->

    <table class="tyre-details">

      <tr>

        <th style="width: 22.5%;">
          Brand
        </th>

        <th style="width: 22.5%;">
          Size
        </th>

        <th style="width: 10%;">
          PR
        </th>

        <th style="width: 22.5%;">
          Pattern
        </th>

        <th style="width: 22.5%;">
          Serial No
        </th>

      </tr>


      <tr>

        <td>
          ${recheck.brand || 'N/A'}
        </td>

        <td>
          ${recheck.size || 'N/A'}
        </td>

        <td>
          ${recheck.pr || ''}
        </td>

        <td>
          ${recheck.pattern || ''}
        </td>

        <td>
          ${recheck.serialNo || ''}
        </td>

      </tr>

    </table>


    <!-- =================================================
         OBSERVATIONS (PREVIOUS / PRESENT)
         ================================================= -->

    <table class="obs-table">

      <thead>
        <tr>
          <th class="label-col" style="width:25%;"></th>
          <th class="prev-col" style="width:37.5%;">Previous</th>
          <th class="pres-col" style="width:37.5%;">Present</th>
        </tr>
      </thead>

      <tbody>
        <!-- Technical Observations -->
        <tr class="tech-row">
          <td class="label-col">
            Technical Observations :
          </td>
          <td class="prev-col">
            ${formattedPrevObs}
          </td>
          <td class="pres-col">
            ${formattedPresentObs}
          </td>
        </tr>

        <!-- Tread Depth -->
        <tr class="tread-row">
          <td class="label-col">
            Remaining Tread Depth :
          </td>
          <td class="prev-col">
            ${recheck.treadDepth || 'N/A'}
          </td>
          <td class="pres-col">
            ${recheck.reTreadDepth || 'N/A'}
          </td>
        </tr>
      </tbody>

    </table>


    <!-- =================================================
         REFUND STATUS
         ================================================= -->

    <div class="refund-status">

      ${
        recheck.reObsStatus === 'Recommended'
          ? 'Refund : Recommended'
          : recheck.reObsStatus === 'Forwarded for Management Decision'
            ? 'Forwarded for Management Decision'
            : recheck.reObsStatus === 'Not Recommended'
              ? 'Refund : Not Recommended'
              : recheck.reObsStatus === 'Return to Dealer'
                ? 'Return to Dealer'
                : recheck.reObsStatus === 'Sent to CEAT'
                  ? 'Sent to CEAT'
                  : 'Refund : Not Recommended'
      }

    </div>


    <!-- =================================================
         SIGNATURES
         ================================================= -->

    <div class="signatures">


      <!-- DATE -->

      <div class="signature-box">

        ${
          recheck.reObsDate
            ? format(
                new Date(recheck.reObsDate),
                'dd/MM/yyyy'
              )
            : 'N/A'
        }

        <br>
        <br>

        <b>
          Date
        </b>

      </div>


      <!-- CONSULTANT -->

      <div class="signature-box">

        <span class="signature-line">
          __________________________________________
        </span>

        <br>
        <br>

        <b>
          Consultant in Tyre Technology
        </b>

      </div>

    </div>


    <!-- =================================================
         DIVIDER
         ================================================= -->

    <div class="divider"></div>


    <!-- =================================================
         REFUND TABLE
         ================================================= -->

    <table class="refund-table">

      <tr>

        <th colspan="2">
          NSD
        </th>

        <th colspan="2">
          Refund
        </th>

      </tr>


      <tr>

        <th>
          Spec
        </th>

        <th>
          Remaining
        </th>

        <th>
          %
        </th>

        <th>
          Rs.
        </th>

      </tr>


      <tr>

        <td style="height: 45px;">
          ${recheck.originalTread || ''}
        </td>

        <td>
        </td>

        <td>
        </td>

        <td>
        </td>

      </tr>

    </table>


    <!-- =================================================
         APPROVAL SECTION
         ================================================= -->

    <div class="approval-section">

      <div class="approval-row">


        <!-- APPROVED BY -->

        <div class="approved-label">
          Approved by:
        </div>


        <!-- ACCEPTED BY -->

        <div class="accepted-label">
          Accepted by:
        </div>


        <!-- ACCEPTED BY BOX -->

        <div class="accepted-box">

          <div class="accepted-box-space"></div>

        </div>


      </div>

    </div>


  </div>


  <!-- ===================================================
       BOTTOM A4 PAGE NOTE
       =================================================== -->

  <div class="page-footer">

    <div class="page-footer-line"></div>

    <b>
      <i>
        N.B.A refunded claim tyre becomes the property
        of Wheels (Pvt) Ltd.
      </i>
    </b>

  </div>


</div>


</body>

</html>
`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
  };
  // ----------------------------------------------------------------

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Recheck Management
      </Typography>

      {/* Selection Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={(e) => setSearchType(e.target.value)}>
                <MenuItem value="id">Reg No</MenuItem>
                <MenuItem value="obsNo">Observation No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={registerList}
              getOptionLabel={(option) => `${searchType === 'id' ? option.id : option.obsNo} - ${option.obsNo || ''}`}
              value={selectedRegister}
              onChange={handleRegisterSelect}
              renderInput={(params) => <TextField {...params} label="Select Register" />}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRegisterList}>Refresh List</Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Previous Details */}
      {registerDetails && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">Previous Observation Details</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}><strong>Claim No:</strong> {registerDetails.claimNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Dealer:</strong> {registerDetails.dealerView}</Grid>
              <Grid item xs={12} sm={6}><strong>Brand:</strong> {registerDetails.brand}</Grid>
              <Grid item xs={12} sm={6}><strong>Size:</strong> {registerDetails.size}</Grid>
              <Grid item xs={12} sm={6}><strong>Serial No:</strong> {registerDetails.serialNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs No:</strong> {registerDetails.obsNo}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs Date:</strong> {registerDetails.obsDate ? format(new Date(registerDetails.obsDate), 'dd/MM/yyyy') : 'N/A'}</Grid>
              <Grid item xs={12} sm={6}><strong>Obs Status:</strong> {registerDetails.obsStatus}</Grid>
              <Grid item xs={12}><strong>Technical Observation:</strong><br/>{registerDetails.techObs || 'N/A'}</Grid>
              <Grid item xs={12}><strong>Tread Depth:</strong> {registerDetails.treadDepth || 'N/A'}</Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recheck Form */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">{editMode ? 'Edit Recheck' : 'Present Observation (Recheck)'}</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Recheck Date" type="date" name="reObsDate"
              value={formData.reObsDate} onChange={handleChange} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Recheck Status</InputLabel>
              <Select name="reObsStatus" value={formData.reObsStatus} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Recommended">Recommended</MenuItem>
                <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                <MenuItem value="Forwarded for Management Decision">Forwarded for Management Decision</MenuItem>
                <MenuItem value="Return to Dealer">Return to Dealer</MenuItem>
                <MenuItem value="Sent to CEAT">Sent to CEAT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Observations Selection UI */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Technical Observations
        </Typography>
        <Box display="flex" gap={2} mb={2}>
          <Autocomplete
            options={observations}
            getOptionLabel={(option) => `${option.obId} - ${option.observation}`}
            value={currentObservation}
            onChange={(event, newValue) => setCurrentObservation(newValue)}
            isOptionEqualToValue={(option, value) => option.obId === value?.obId}
            renderInput={(params) => <TextField {...params} label="Select Observation" />}
            sx={{ flex: 1 }}
          />
          <IconButton onClick={addObservation} disabled={!currentObservation} color="primary">
            <AddIcon />
          </IconButton>
        </Box>

        {selectedObservations.length > 0 && (
          <List dense sx={{ border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
            {selectedObservations.map((obs, i) => (
              <ListItem key={obs.id}>
                <ListItemText primary={`${i + 1}) ${obs.observation}`} />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => removeObservation(obs.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth label="Custom Observation" value={customObservation}
            onChange={(e) => setCustomObservation(e.target.value)} multiline rows={2}
          />
          <IconButton onClick={addCustomObservation} disabled={!customObservation.trim()} color="primary">
            <AddIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <FormControlLabel
            control={<Checkbox checked={manufacturingDefect} onChange={(e) => setManufacturingDefect(e.target.checked)} />}
            label="Manufacturing Defect"
          />
          <FormControlLabel
            control={<Checkbox checked={noManufacturingDefect} onChange={(e) => setNoManufacturingDefect(e.target.checked)} />}
            label="No Manufacturing Defect"
          />
        </Box>

        <TextField
          fullWidth multiline rows={4} label="Technical Observation (Preview)"
          value={buildTechObs()} InputProps={{ style: { whiteSpace: 'pre-line' } }}
        />

        <TextField
          fullWidth label="Recheck Tread Depth (e.g., 6,6,6,6)" name="reTreadDepth"
          value={formData.reTreadDepth} onChange={handleChange} sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (editMode ? 'Update Recheck' : 'Save Recheck')}
          </Button>
          {editMode && (
            <Button variant="outlined" onClick={() => {
              setEditMode(false);
              setSelectedRegister(null);
              setRegisterDetails(null);
              setFormData({
                reObsDate: format(new Date(), 'yyyy-MM-dd'),
                reObsStatus: '',
                reObs: '',
                reTreadDepth: ''
              });
              setSelectedObservations([]);
            }}>
              Cancel Edit
            </Button>
          )}
        </Box>
        {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>
        }
      </Paper>

      {/* All Rechecks Table */}
      <Typography variant="h5" gutterBottom>All Rechecks</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reg No</TableCell>
              <TableCell>Recheck No</TableCell>
              <TableCell>Obs No</TableCell>
              <TableCell>Obs Date</TableCell>
              <TableCell>Tech Obs</TableCell>
              <TableCell>Tread Depth</TableCell>
              <TableCell>Recheck Date</TableCell>
              <TableCell>Recheck Status</TableCell>
              <TableCell>Recheck Obs</TableCell>
              <TableCell>Recheck Tread</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rechecks.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.reNo ? `${row.reNo.toString().padStart(4, '0')}` : row.reObsNo}</TableCell>
                <TableCell>{row.obsNo}</TableCell>
                <TableCell>{row.obsDate ? format(new Date(row.obsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'pre-wrap' }}>{row.techObs?.substring(0, 50)}...</TableCell>
                <TableCell>{row.treadDepth}</TableCell>
                <TableCell>{row.reObsDate ? format(new Date(row.reObsDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                <TableCell>{row.reObsStatus}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{row.reObs?.substring(0, 50)}...</TableCell>
                <TableCell>{row.reTreadDepth}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handlePrint(row)} title="Print"><Print fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleEdit(row)} title="Edit"><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setDeleteId(row.id)} title="Delete"><Delete fontSize="small" color="error" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this recheck?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recheck;