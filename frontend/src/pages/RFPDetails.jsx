import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// Ensure getVendors and sendRFPEmails are imported from api.js
import {
  getRFP,
  getProposals,
  uploadProposal,
  getVendors,
  sendRFPEmails,
} from "../api";
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send"; // <--- THIS ICON IS REQUIRED

function RFPDetails() {
  const { id } = useParams();
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [vendors, setVendors] = useState([]);

  // UI States
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const rfpData = await getRFP(id);
        setRfp(rfpData);
        const proposalsData = await getProposals(id);
        setProposals(proposalsData);

        // Load Vendors for the popup
        try {
          const vendorList = await getVendors();
          setVendors(vendorList);
        } catch (e) {
          console.error("Vendor fetch error", e);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadInitialData();
  }, [id]);

  const refreshProposals = async () => {
    try {
      const data = await getProposals(id);
      setProposals(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- PDF UPLOAD LOGIC ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProposal(id, file);
      await refreshProposals();
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Failed to upload/analyze PDF.");
    } finally {
      setUploading(false);
    }
  };

  // --- EMAIL LOGIC ---
  const handleVendorToggle = (email) => {
    if (selectedVendors.includes(email)) {
      setSelectedVendors(selectedVendors.filter((e) => e !== email));
    } else {
      setSelectedVendors([...selectedVendors, email]);
    }
  };

  const handleSendEmails = async () => {
    if (selectedVendors.length === 0) return;
    setSending(true);
    try {
      await sendRFPEmails(id, selectedVendors);
      setSuccessMsg(`Invites sent to ${selectedVendors.length} vendors!`);
      setOpenEmailDialog(false);
      setSelectedVendors([]);
    } catch (err) {
      console.error("Email Error:", err);
      setError("Failed to send emails. Check backend.");
    } finally {
      setSending(false);
    }
  };

  if (!rfp)
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );

  const dynamicFields = rfp.json_schema?.fields || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Typography variant="h4" gutterBottom>
              {rfp.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <b>Prompt:</b> {rfp.prompt_text}
            </Typography>
          </div>

          {/* --- THE BUTTON SHOULD BE HERE --- */}
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={() => setOpenEmailDialog(true)}
          >
            Invite Vendors
          </Button>
          {/* --------------------------------- */}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <Button
            variant="contained"
            component="label"
            startIcon={
              uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CloudUploadIcon />
              )
            }
            disabled={uploading}
          >
            {uploading ? "Analyzing with AI..." : "Upload Vendor PDF"}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileUpload}
            />
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}
        </div>
      </Paper>

      {/* Comparison Matrix */}
      <Typography variant="h5" gutterBottom>
        Comparison Matrix
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>
                <b>Vendor / File</b>
              </TableCell>
              {dynamicFields.map((field) => (
                <TableCell key={field.key}>
                  <b>{field.key.replace(/_/g, " ").toUpperCase()}</b>
                </TableCell>
              ))}
              <TableCell>
                <b>AI Score</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell>
                  {proposal.extracted_data?.vendor_name || "Unknown Vendor"}
                </TableCell>
                {dynamicFields.map((field) => (
                  <TableCell key={field.key}>
                    {proposal.extracted_data?.[field.key]?.toString() || "-"}
                  </TableCell>
                ))}
                <TableCell>
                  <Chip label="N/A" size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Email Dialog Popup --- */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)}>
        <DialogTitle>Select Vendors to Invite</DialogTitle>
        <DialogContent sx={{ minWidth: "300px" }}>
          {vendors.length === 0 ? (
            <Typography>
              No vendors found. Please add vendors via API first.
            </Typography>
          ) : (
            <FormGroup>
              {vendors.map((vendor) => (
                <FormControlLabel
                  key={vendor.id}
                  control={
                    <Checkbox
                      checked={selectedVendors.includes(vendor.email)}
                      onChange={() => handleVendorToggle(vendor.email)}
                    />
                  }
                  label={`${vendor.name} (${vendor.email})`}
                />
              ))}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendEmails}
            variant="contained"
            disabled={selectedVendors.length === 0 || sending}
          >
            {sending ? "Sending..." : "Send Invites"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RFPDetails;
