import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';

export default function RecheckNote() {
  const [regNos, setRegNos] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({});
  const [rechecks, setRechecks] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    fetchRegNos();
    fetchRechecks();
  }, []);

  async function fetchRegNos() {
    try {
      const { data } = await axios.get('/api/recheck/regnos');
      setRegNos(data || []);
    } catch (err) {
      console.error('fetchRegNos error', err?.response?.data || err.message);
    }
  }

  async function fetchRechecks() {
    try {
      const { data } = await axios.get('/api/recheck/all');
      setRechecks(data || []);
    } catch (err) {
      console.error('fetchRechecks error', err?.response?.data || err.message);
    }
  }

  const handleOpenAdd = () => {
    setForm({});
    setOpenAdd(true);
  };

  const handleSelectReg = (e, value) => {
    if (!value) {
      setForm({});
      return;
    }

    // value is the observation record from backend
    const recheckNo = 'RE-' + Date.now();
    const reObsDate = new Date().toISOString().split('T')[0];
    setForm({
      recheckNo,
      obsNo: value.obsNo || value.regNo || '',
      claimNo: value.claimNo || '',
      dealer: value.dealer || '',
      brand: value.brand || '',
      size: value.size || '',
      serialNo: value.serialNo || '',
      obsStatus: value.obsStatus || '',
      consultantName: value.consultantName || '',
      obsDate: value.obsDate ? value.obsDate.split('T')[0] : (value.obsDate || ''),
      techObs: value.techObs || '',
      treadDepth: value.treadDepth || '',
      reObs: '',
      reTreadDepth: '',
      reObsDate
    });
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/recheck/add', form);
      setOpenAdd(false);
      fetchRechecks();
    } catch (err) {
      console.error('save error', err?.response?.data || err.message);
      alert('Save failed: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleOpenView = async (row) => {
    setViewItem(row);
  };

  const handleOpenEdit = (row) => {
    setEditItem({
      recheckNo: row.recheckNo,
      reObs: row.reObs || '',
      reTreadDepth: row.reTreadDepth || '',
      reObsDate: row.reObsDate ? (row.reObsDate.split ? row.reObsDate.split('T')[0] : row.reObsDate) : ''
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/api/recheck/${encodeURIComponent(editItem.recheckNo)}`, {
        reObs: editItem.reObs, reTreadDepth: editItem.reTreadDepth, reObsDate: editItem.reObsDate
      });
      setEditItem(null);
      fetchRechecks();
    } catch (err) {
      console.error('update error', err?.response?.data || err.message);
      alert('Update failed: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handlePrint = (item) => {
    // simple print window for record
    const html = `
      <html><head><title>Recheck ${item.recheckNo}</title></head>
      <body>
        <h2>Recheck: ${item.recheckNo}</h2>
        <p><b>Obs No:</b> ${item.obsNo}</p>
        <p><b>Claim No:</b> ${item.claimNo}</p>
        <p><b>Dealer:</b> ${item.dealer}</p>
        <p><b>Brand:</b> ${item.brand}</p>
        <p><b>Size:</b> ${item.size}</p>
        <p><b>Serial No:</b> ${item.serialNo}</p>
        <p><b>Previous Tech Obs:</b> ${item.techObs}</p>
        <p><b>Recheck Tech Obs:</b> ${item.reObs}</p>
        <p><b>Previous Tread Depth:</b> ${item.treadDepth}</p>
        <p><b>Recheck Tread Depth:</b> ${item.reTreadDepth}</p>
        <p><b>Recheck Date:</b> ${item.reObsDate ? item.reObsDate.split ? item.reObsDate.split('T')[0] : item.reObsDate : ''}</p>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <Box p={2}>
      <Button variant="contained" onClick={handleOpenAdd}>Add Recheck Note</Button>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Recheck Note</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Autocomplete
              options={regNos}
              getOptionLabel={(opt) => opt.regNo || opt.obsNo || ''}
              onChange={handleSelectReg}
              renderInput={(params) => <TextField {...params} label="Select Reg No (type to search)" />}
              freeSolo={false}
            />
          </Box>

          {form.obsNo ? (
            <Box mt={2}>
              <TextField label="Observation No" value={form.obsNo} fullWidth margin="dense" disabled />
              <TextField label="Recheck No" value={form.recheckNo} fullWidth margin="dense" disabled />
              <TextField label="Claim No" value={form.claimNo} fullWidth margin="dense" disabled />
              <TextField label="Dealer" value={form.dealer} fullWidth margin="dense" disabled />
              <TextField label="Brand" value={form.brand} fullWidth margin="dense" disabled />
              <TextField label="Size" value={form.size} fullWidth margin="dense" disabled />
              <TextField label="Serial No" value={form.serialNo} fullWidth margin="dense" disabled />
              <TextField label="Observation Status" value={form.obsStatus} fullWidth margin="dense" disabled />
              <TextField label="Consultant" value={form.consultantName} fullWidth margin="dense" disabled />
              <TextField label="Previous Observation Date" value={form.obsDate} fullWidth margin="dense" disabled />
              <TextField label="Recheck Observation Date" type="date"
                value={form.reObsDate || ''}
                onChange={(e) => setForm({ ...form, reObsDate: e.target.value })}
                fullWidth margin="dense"
              />

              <Typography mt={2}><b>Technical Observation</b></Typography>
              <TextField label="Previous" value={form.techObs} fullWidth margin="dense" disabled />
              <TextField label="Present (reObs)" value={form.reObs || ''} onChange={(e) => setForm({ ...form, reObs: e.target.value })} fullWidth margin="dense" />

              <Typography mt={2}><b>Tread Depth</b></Typography>
              <TextField label="Previous" value={form.treadDepth} fullWidth margin="dense" disabled />
              <TextField label="Present (reTreadDepth)" value={form.reTreadDepth || ''} onChange={(e) => setForm({ ...form, reTreadDepth: e.target.value })} fullWidth margin="dense" />
            </Box>
          ) : (
            <Typography mt={2} color="textSecondary">Select a Reg No to autofill fields</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.recheckNo}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>View Recheck</DialogTitle>
        <DialogContent>
          {viewItem && (
            <Box>
              <Typography><b>Recheck No:</b> {viewItem.recheckNo}</Typography>
              <Typography><b>Obs No:</b> {viewItem.obsNo}</Typography>
              <Typography><b>Claim No:</b> {viewItem.claimNo}</Typography>
              <Typography><b>Dealer:</b> {viewItem.dealer}</Typography>
              <Typography><b>Brand:</b> {viewItem.brand}</Typography>
              <Typography><b>Size:</b> {viewItem.size}</Typography>
              <Typography><b>Serial No:</b> {viewItem.serialNo}</Typography>
              <Typography><b>Previous Tech Obs:</b> {viewItem.techObs}</Typography>
              <Typography><b>Recheck Tech Obs:</b> {viewItem.reObs}</Typography>
              <Typography><b>Recheck Date:</b> {viewItem.reObsDate ? viewItem.reObsDate.split ? viewItem.reObsDate.split('T')[0] : viewItem.reObsDate : ''}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Recheck</DialogTitle>
        <DialogContent>
          {editItem && (
            <Box>
              <TextField label="Recheck No" value={editItem.recheckNo} fullWidth margin="dense" disabled />
              <TextField label="ReObs Date" type="date" value={editItem.reObsDate || ''}
                onChange={(e) => setEditItem({ ...editItem, reObsDate: e.target.value })} fullWidth margin="dense" />
              <TextField label="ReObs (Present)" value={editItem.reObs}
                onChange={(e) => setEditItem({ ...editItem, reObs: e.target.value })} fullWidth margin="dense" multiline minRows={2} />
              <TextField label="ReTreadDepth (Present)" value={editItem.reTreadDepth}
                onChange={(e) => setEditItem({ ...editItem, reTreadDepth: e.target.value })} fullWidth margin="dense" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recheck No</TableCell>
              <TableCell>Obs No</TableCell>
              <TableCell>Claim No</TableCell>
              <TableCell>Dealer</TableCell>
              <TableCell>Recheck Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rechecks.map((row) => (
              <TableRow key={row.recheckNo || row.id}>
                <TableCell>{row.recheckNo}</TableCell>
                <TableCell>{row.obsNo}</TableCell>
                <TableCell>{row.claimNo}</TableCell>
                <TableCell>{row.dealer}</TableCell>
                <TableCell>{row.reObsDate ? (row.reObsDate.split ? row.reObsDate.split('T')[0] : row.reObsDate) : ''}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenView(row)}><VisibilityIcon /></IconButton>
                  <IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon /></IconButton>
                  <IconButton size="small" onClick={() => handlePrint(row)}><PrintIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rechecks.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No rechecks yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

