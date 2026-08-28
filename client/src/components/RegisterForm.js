// RegisterForm.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  getInitialData,
  getDealerByView,
  getSizesByBrand,
  createRegister,
  updateRegister,
  getAllConsultants,
  getNextObservationNumber,
  getAllObservations,
  getAllLocations,
  getAllStacks
} from '../services/api';

const RegisterForm = ({ initialData, onSuccess, mode = 'create', technicalMode = false }) => {
  const [formData, setFormData] = useState({
    receivedDate: format(new Date(), 'yyyy-MM-dd'),
    claimNo: '',
    dealerView: '',
    dealerCode: '',
    brand: '',
    size: '',
    pr: '',
    pattern: '',
    sizeCode: '',
    serialNo: '',
    originalTread: '',
    obsDate: format(new Date(), 'yyyy-MM-dd'),
    techObs: '',
    treadDepth: '',
    consultantName: '',
    obsNo: '',
    obsStatus: 'Pending',
    locationName: '',
    stackName: ''
  });

  const [dealerViews, setDealerViews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [observations, setObservations] = useState([]);
  const [selectedObservations, setSelectedObservations] = useState([]);
  const [customObservation, setCustomObservation] = useState('');
  const [manufacturingDefect, setManufacturingDefect] = useState(false);
  const [noManufacturingDefect, setNoManufacturingDefect] = useState(false);
  const [currentObservation, setCurrentObservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasParsedInitialData, setHasParsedInitialData] = useState(false);

  // Locations and stacks state
  const [locations, setLocations] = useState([]);
  const [stacks, setStacks] = useState([]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return format(new Date(), 'yyyy-MM-dd');
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isNaN(date.getTime()) ? format(new Date(), 'yyyy-MM-dd') : format(date, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  // ---------- PRINT FUNCTION (copied from RegisterList) ----------
  const printRegister = (register) => {
    let headerTitle = "PENDING NOTE";
    let noteNumberLabel = "PENDING No";
    
    if (register.obsStatus === 'Recommended') {
      headerTitle = "CLAIM REFUND NOTE";
      noteNumberLabel = "CR No";
    } else if (register.obsStatus === 'Not Recommended') {
      headerTitle = "NO REFUND NOTE";
      noteNumberLabel = "NR No";
    } else if (register.obsStatus === 'Forwarded for Management Decision') {
      headerTitle = "SPECIAL CONSIDERATION NOTE";
      noteNumberLabel = "SCN No";
    }

    const formattedTechObs = register.techObs ? register.techObs.replace(/\n/g, '<br/>') : 'N/A';

    const content = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<title>${headerTitle} - ${register.obsNo}</title>

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
   OBSERVATIONS
   ========================================================= */

.observations {
  width: 100%;

  margin-bottom: 10px;
}

.observations th {
  font-size: 16px;

  font-weight: bold;
}

.observations td {
  font-size: 16px;

  text-align: left;

  padding: 8px 10px;

  line-height: 1.35;
}


/* =========================================================
   TECHNICAL OBSERVATION
   ========================================================= */

.observations:first-of-type th {
  height: 95px;

  vertical-align: top;
}

.observations:first-of-type td {
  height: 95px;

  min-height: 95px;

  vertical-align: top;
}


/* =========================================================
   REMAINING TREAD DEPTH
   ========================================================= */

.observations:nth-of-type(2) th {
  height: 45px;

  text-align: left;

  vertical-align: middle;
}

.observations:nth-of-type(2) td {
  height: 45px;

  text-align: center;

  vertical-align: middle;

  font-size: 16px;
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

  /* Move signature slightly to the left */
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


/* =========================================================
   SIGNATURE LINE
   ========================================================= */

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


/* =========================================================
   APPROVAL ROW
   ========================================================= */

.approval-row {
  display: flex;

  align-items: flex-start;

  width: 100%;

  min-height: 75px;

  page-break-inside: avoid;
}


/* =========================================================
   APPROVED BY
   ========================================================= */

.approved-label {
  width: 42%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;
}


/* =========================================================
   ACCEPTED BY LABEL
   ========================================================= */

.accepted-label {
  width: 16%;

  font-size: 16px;

  font-weight: bold;

  text-align: left;

  padding-top: 5px;

  white-space: nowrap;
}


/* =========================================================
   ACCEPTED BY BOX
   ========================================================= */

.accepted-box {
  width: 42%;

  height: 75px;

  border: 1px solid #000;

  margin-left: 8px;

  position: relative;

  flex-shrink: 0;
}


/* =========================================================
   ACCEPTED BOX INNER SPACE
   ========================================================= */

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


    <!-- =================================================
         HEADER
         ================================================= -->

    <div class="header">

      <div>
        Reg. No:
        <b>${register.id}</b>
      </div>


      <div>
        ${noteNumberLabel}:
        <b>${register.obsNo || 'N/A'}</b>
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
          ${register.claimNo || ''}
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
          ${register.dealerView || 'N/A'}
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
          ${register.brand || ''}
        </td>

        <td>
          ${register.size || ''}
        </td>

        <td>
          ${register.pr || ''}
        </td>

        <td>
          ${register.pattern || ''}
        </td>

        <td>
          ${register.serialNo || 'N/A'}
        </td>

      </tr>

    </table>


    <!-- =================================================
         TECHNICAL OBSERVATIONS
         ================================================= -->

    <table class="observations">

      <tr>

        <th
          style="
            width: 25%;
            text-align: left;
            height: 95px;
            vertical-align: top;
          "
        >
          Technical Observations :
        </th>


        <td
          style="
            width: 75%;
            height: 95px;
            text-align: left;
            vertical-align: top;
          "
        >
          ${formattedTechObs}
        </td>

      </tr>

    </table>


    <!-- =================================================
         REMAINING TREAD DEPTH
         ================================================= -->

    <table class="observations">

      <tr>

        <th
          style="
            width: 25%;
            text-align: left;
            height: 45px;
          "
        >
          Remaining Tread Depth :
        </th>


        <td
          style="
            width: 75%;
            height: 45px;
            text-align: center;
          "
        >
          ${register.treadDepth || 'N/A'}
        </td>

      </tr>

    </table>


    <!-- =================================================
         REFUND STATUS
         ================================================= -->

    <div class="refund-status">

      ${
        register.obsStatus === 'Recommended'
          ? 'Refund : Recommended'
          : register.obsStatus === 'Forwarded for Management Decision'
            ? 'Forwarded for Management Decision'
            : register.obsStatus === 'Not Recommended'
              ? 'Refund : Not Recommended'
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
          register.obsDate
            ? format(
                new Date(register.obsDate),
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

      <div class="signatures">

        <div class="signature-box">

          __________________________________________

          <br>

          <br>

          <b>
            Consultant in Tyre Technology
          </b>

        </div>

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
          ${register.originalTread || ''}
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

  const parseTechnicalObservations = useCallback((techObsText) => {
    if (!techObsText) return;

    const lines = techObsText.split('\n').filter(line => line.trim() !== '');
    const newSelected = [];
    let defect = false;
    let noDefect = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '(Manufacturing Defect)') {
        defect = true;
        return;
      }
      if (trimmed === '(No Manufacturing Defect)') {
        noDefect = true;
        return;
      }

      const numberedMatch = trimmed.match(/^\d+\)\s+(.+)$/);
      const observationText = numberedMatch ? numberedMatch[1] : trimmed;

      const predefinedObs = observations.find(obs =>
        observationText.startsWith(`${obs.obId} - ${obs.observation}`) || observationText === obs.observation
      );

      if (predefinedObs) {
        newSelected.push({
          id: predefinedObs.obId,
          observation: predefinedObs.observation,
          isCustom: false
        });
      } else {
        newSelected.push({
          id: `CUSTOM-${Date.now()}`,
          observation: observationText,
          isCustom: true
        });
      }
    });

    setSelectedObservations(newSelected);
    setManufacturingDefect(defect);
    setNoManufacturingDefect(noDefect);
  }, [observations]);

  // Load all initial data including locations & stacks
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await getInitialData();
        setDealerViews(data.dealerViews);
        setBrands(data.brands);

        const consultantsRes = await getAllConsultants();
        setConsultants(consultantsRes.data || []);

        const observationsRes = await getAllObservations();
        setObservations(observationsRes.data || []);

        const [locationsRes, stacksRes] = await Promise.all([
          getAllLocations(),
          getAllStacks()
        ]);
        setLocations(locationsRes.data);
        setStacks(stacksRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setMessage('Failed to load initial data.');
      }
    };
    fetchInitialData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (initialData && !hasParsedInitialData) {
      let obsStatus = 'Pending';
      if (initialData.obsNo) {
        if (initialData.obsNo.startsWith('R')) obsStatus = 'Recommended';
        else if (initialData.obsNo.startsWith('NR')) obsStatus = 'Not Recommended';
        else if (initialData.obsNo.startsWith('SCN')) obsStatus = 'Forwarded for Management Decision';
      }

      setFormData(prev => ({
        ...prev,
        ...initialData,
        receivedDate: formatDateForInput(initialData.receivedDate),
        obsDate: formatDateForInput(initialData.obsDate),
        obsStatus,
        locationName: initialData.locationName || '',
        stackName: initialData.stackName || ''
      }));

      // Fetch sizes for the brand and match the selected size
      if (initialData.brand) {
        getSizesByBrand(initialData.brand)
          .then(({ data }) => {
            setSizes(data.map(s => s.size));
            setSizeOptions(data);
            // Find the size that matches either sizeCode or originalTread
            let selectedSize = data.find(s => s.sizeCode === initialData.sizeCode);
            if (!selectedSize) {
              selectedSize = data.find(s => s.originalTread === initialData.originalTread);
            }
            if (selectedSize) {
              setFormData(prev => ({
                ...prev,
                size: selectedSize.size,
                sizeCode: selectedSize.sizeCode,
                originalTread: selectedSize.originalTread
              }));
            }
          })
          .catch(err => console.error('Error fetching sizes:', err));
      }

      if (initialData.techObs) {
        parseTechnicalObservations(initialData.techObs);
      }

      setHasParsedInitialData(true);
    }
  }, [initialData, hasParsedInitialData, observations, parseTechnicalObservations]);

  // Fetch dealer code when dealerView changes
  useEffect(() => {
    if (formData.dealerView) {
      getDealerByView(formData.dealerView)
        .then(({ data }) => {
          setFormData(prev => ({ ...prev, dealerCode: data.dealerCode }));
        })
        .catch(err => console.error('Error fetching dealer:', err));
    }
  }, [formData.dealerView]);

  // Fetch sizes when brand changes
  useEffect(() => {
    if (formData.brand) {
      getSizesByBrand(formData.brand)
        .then(({ data }) => {
          setSizes(data.map(s => s.size));
          setSizeOptions(data);
        })
        .catch(err => console.error('Error fetching sizes:', err));
    } else {
      setSizes([]);
      setSizeOptions([]);
      setFormData(prev => ({ ...prev, size: '', sizeCode: '', originalTread: '' }));
    }
  }, [formData.brand]);

  // Update techObs whenever selected observations or defect flags change
  useEffect(() => {
    let text = '';
    selectedObservations.forEach((obs, i) => {
      text += `${i + 1}) ${obs.observation}\n`;
    });
    if (manufacturingDefect) text += '(Manufacturing Defect)\n';
    if (noManufacturingDefect) text += '(No Manufacturing Defect)\n';
    setFormData(prev => ({ ...prev, techObs: text }));
  }, [selectedObservations, manufacturingDefect, noManufacturingDefect]);

  const handleSizeChange = (e, newValue) => {
    if (newValue) {
      const selectedSize = sizeOptions.find(s => s.size === newValue);
      setFormData(prev => ({
        ...prev,
        size: newValue,
        sizeCode: selectedSize ? selectedSize.sizeCode : '',
        originalTread: selectedSize ? selectedSize.originalTread : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, size: '', sizeCode: '', originalTread: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, obsStatus: value }));

    if (value !== 'Pending') {
      try {
        let type = '';
        switch (value) {
          case 'Recommended': type = 'R'; break;
          case 'Not Recommended': type = 'NR'; break;
          case 'Forwarded for Management Decision': type = 'SCN'; break;
          default: return;
        }
        setFormData(prev => {
          const currentObsNo = prev.obsNo;
          if (!currentObsNo || !currentObsNo.startsWith(type)) {
            getNextObservationNumber(type)
              .then(({ data }) => {
                setFormData(prevState => ({ ...prevState, obsNo: data.nextNumber }));
              })
              .catch(err => console.error('Error generating observation number:', err));
          }
          return prev;
        });
      } catch (err) {
        console.error('Error generating observation number:', err);
      }
    } else {
      setFormData(prev => ({ ...prev, obsNo: '' }));
    }
  };

  const addObservation = () => {
    if (currentObservation && !selectedObservations.find(obs => obs.id === currentObservation.obId)) {
      setSelectedObservations(prev => [
        ...prev,
        {
          id: currentObservation.obId,
          observation: currentObservation.observation,
          isCustom: false
        }
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
        {
          id: `CUSTOM-${Date.now()}`,
          observation: customObservation.trim(),
          isCustom: true
        }
      ]);
      setCustomObservation('');
    }
  };

  // ---------- NEW SUBMIT HANDLER: Save & Print ----------
  const handleSaveAndPrint = async (e) => {
    e.preventDefault();

    // Validation – pr and pattern are no longer required
    if (!formData.claimNo || !formData.dealerView || !formData.brand || !formData.size || !formData.serialNo) {
      setMessage('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let savedId;
      if (mode === 'create') {
        const basicData = {
          receivedDate: formData.receivedDate,
          claimNo: formData.claimNo,
          dealerView: formData.dealerView,
          dealerCode: formData.dealerCode,
          brand: formData.brand,
          size: formData.size,
          sizeCode: formData.sizeCode,
          pr: formData.pr,
          pattern: formData.pattern,
          originalTread: formData.originalTread,
          serialNo: formData.serialNo,
        };
        savedId = await createRegister(basicData);
        // Build full register object for printing
        const registerData = {
          id: savedId,
          ...formData,
        };
        printRegister(registerData);
        setMessage(`Basic information saved successfully! Registration No: ${savedId}`);
        setTimeout(() => onSuccess(), 2000);
      } else {
        // Edit mode
        await updateRegister(initialData.id, formData);
        const registerData = {
          id: initialData.id,
          ...formData,
        };
        printRegister(registerData);
        setMessage('Registration updated successfully!');
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setMessage('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------------------

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: '900px', mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {technicalMode ? 'Add Technical Information' : mode === 'create' ? 'Add New UC Tyre' : 'Edit UC Tyre'}
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <form onSubmit={handleSaveAndPrint}>
        {/* Basic Info Card */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Basic Information</Typography>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                fullWidth
                label="Received Date"
                type="date"
                name="receivedDate"
                value={formData.receivedDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="Claim No"
                name="claimNo"
                value={formData.claimNo}
                onChange={handleChange}
                required
              />
            </Box>

            <Box display="flex" gap={2} mb={2}>
              <Autocomplete
                options={dealerViews}
                value={formData.dealerView || ''}
                onChange={(e, newValue) => setFormData(prev => ({ ...prev, dealerView: newValue }))}
                renderInput={(params) => (
                  <TextField {...params} label="Dealer View" required fullWidth />
                )}
                freeSolo
                sx={{ flex: 3 }}
              />
              <TextField
                label="Dealer Code"
                name="dealerCode"
                value={formData.dealerCode}
                onChange={handleChange}
                disabled
                sx={{ flex: 1 }}
              />
            </Box>

            <Box display="flex" gap={2} mb={2}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Brand</InputLabel>
                <Select
                  name="brand"
                  value={formData.brand}
                  label="Brand"
                  onChange={handleChange}
                  required
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                options={sizes}
                value={formData.size || ''}
                onChange={handleSizeChange}
                renderInput={(params) => (
                  <TextField {...params} label="Size" required fullWidth />
                )}
                freeSolo
                sx={{ flex: 3 }}
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Size Code"
                name="sizeCode"
                value={formData.sizeCode}
                onChange={handleChange}
                disabled
              />
              <TextField
                fullWidth
                label="Serial No & DOT"
                name="serialNo"
                value={formData.serialNo}
                onChange={handleChange}
                placeholder="Enter the Serial No & DOT here..."
                required
              />
              {/* PR field – no longer required */}
              <TextField
                fullWidth
                label="PR"
                name="pr"
                value={formData.pr}
                onChange={handleChange}
                placeholder="Enter the PR here..."
              />
              {/* Pattern field – no longer required */}
              <TextField
                fullWidth
                label="Pattern"
                name="pattern"
                value={formData.pattern}
                onChange={handleChange}
                placeholder="Enter the Pattern here..."
              />
              <TextField
                fullWidth
                label="Original Tread Depth"
                name="originalTread"
                value={formData.originalTread}
                onChange={handleChange}
                disabled
              />
            </Box>
          </CardContent>
        </Card>

        {/* Technical Details Card */}
        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Technical Details</Typography>

              <Box display="flex" gap={2} mb={2}>
                <TextField
                  fullWidth
                  label="Observation Date"
                  type="date"
                  name="obsDate"
                  value={formData.obsDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Remaining Tread Depth"
                  name="treadDepth"
                  value={formData.treadDepth}
                  onChange={handleChange}
                  placeholder="e.g., 6,6,6,6"
                />
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Consultant Name</InputLabel>
                  <Select
                    name="consultantName"
                    value={formData.consultantName || ''}
                    label="Consultant Name"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {consultants.map(c => (
                      <MenuItem key={c.consultantName} value={c.consultantName}>
                        {c.consultantName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Observation Status</InputLabel>
                  <Select
                    name="obsStatus"
                    value={formData.obsStatus}
                    label="Observation Status"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Recommended">Recommended</MenuItem>
                    <MenuItem value="Not Recommended">Not Recommended</MenuItem>
                    <MenuItem value="Forwarded for Management Decision">
                      Forwarded for Management Decision
                    </MenuItem>
                    <MenuItem value="Return to Dealer">Return to Dealer</MenuItem>
                    <MenuItem value="Sent to CEAT">Sent to CEAT</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Observation Number"
                name="obsNo"
                value={formData.obsNo}
                onChange={handleChange}
                disabled
              />

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
                  renderInput={(params) => (
                    <TextField {...params} label="Select Observation" />
                  )}
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
                  fullWidth
                  label="Custom Observation"
                  value={customObservation}
                  onChange={(e) => setCustomObservation(e.target.value)}
                  multiline
                  rows={2}
                />
                <IconButton onClick={addCustomObservation} disabled={!customObservation.trim()} color="primary">
                  <AddIcon />
                </IconButton>
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={manufacturingDefect}
                      onChange={(e) => setManufacturingDefect(e.target.checked)}
                    />
                  }
                  label="Manufacturing Defect"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={noManufacturingDefect}
                      onChange={(e) => setNoManufacturingDefect(e.target.checked)}
                    />
                  }
                  label="No Manufacturing Defect"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Technical Observation"
                value={formData.techObs}
                InputProps={{ style: { whiteSpace: 'pre-line' } }}
              />
            </CardContent>
          </Card>
        )}

        {/* Location & Stack Card */}
        {(mode === 'edit' || technicalMode) && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location & Stacking
              </Typography>
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    name="locationName"
                    value={formData.locationName || ''}
                    label="Location"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.locationID || loc.locationName} value={loc.locationName}>
                        {loc.locationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Stack</InputLabel>
                  <Select
                    name="stackName"
                    value={formData.stackName || ''}
                    label="Stack"
                    onChange={handleChange}
                  >
                    <MenuItem value="">None</MenuItem>
                    {stacks.map((stk) => (
                      <MenuItem key={stk.stackID || stk.stackName} value={stk.stackName}>
                        {stk.stackName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button onClick={() => onSuccess()} variant="outlined">
            Cancel
          </Button>
          {/* Save button changed to Save & Print */}
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Print'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RegisterForm;