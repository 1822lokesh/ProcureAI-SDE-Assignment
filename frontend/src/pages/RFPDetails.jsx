import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // Trophy Icon

function RFPDetails() {
  const { id } = useParams();
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- Data Loading ---
  const loadData = async () => {
    try {
      const rfpData = await getRFP(id);
      setRfp(rfpData);
      const proposalsData = await getProposals(id);
      // Sort proposals by score (Highest first)
      const sortedProposals = proposalsData.sort(
        (a, b) => b.fit_score - a.fit_score
      );
      setProposals(sortedProposals);

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

  useEffect(() => {
    loadData();
  }, [id]);

  // --- Handlers ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProposal(id, file);
      await loadData(); // Reload to see new score
    } catch (err) {
      console.error(err);
      setError("Failed to analyze PDF.");
    } finally {
      setUploading(false);
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
      setError("Failed to send emails.", err);
    } finally {
      setSending(false);
    }
  };

  const handleVendorToggle = (email) => {
    if (selectedVendors.includes(email)) {
      setSelectedVendors(selectedVendors.filter((e) => e !== email));
    } else {
      setSelectedVendors([...selectedVendors, email]);
    }
  };

  if (!rfp)
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );

  const dynamicFields = rfp.json_schema?.fields || [];

  // Helper to get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "success"; // Green
    if (score >= 50) return "warning"; // Orange
    return "error"; // Red
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={() => setOpenEmailDialog(true)}
          >
            Invite Vendors
          </Button>
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
            {uploading ? "Analyzing & Scoring..." : "Upload Vendor PDF"}
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

      <Typography variant="h5" gutterBottom>
        Comparison Matrix
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>
                <b>Vendor</b>
              </TableCell>
              {dynamicFields.map((field) => (
                <TableCell key={field.key}>
                  <b>{field.key.replace(/_/g, " ").toUpperCase()}</b>
                </TableCell>
              ))}
              <TableCell>
                <b>AI Score & Recommendation</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal, index) => (
              <TableRow
                key={proposal.id}
                sx={
                  index === 0 && proposal.fit_score > 80
                    ? { bgcolor: "#f0fdf4" }
                    : {}
                } // Highlight Winner
              >
                <TableCell>
                  {proposal.extracted_data?.vendor_name || "Unknown"}
                  {index === 0 && proposal.fit_score > 0 && (
                    <Chip
                      icon={<EmojiEventsIcon />}
                      label="Top Pick"
                      size="small"
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>

                {dynamicFields.map((field) => (
                  <TableCell key={field.key}>
                    {proposal.extracted_data?.[field.key]?.toString() || "-"}
                  </TableCell>
                ))}

                <TableCell>
                  <Tooltip
                    title={
                      proposal.extracted_data?.ai_recommendation || "No reason"
                    }
                  >
                    <Chip
                      label={`${proposal.fit_score}/100`}
                      color={getScoreColor(proposal.fit_score)}
                      variant={index === 0 ? "filled" : "outlined"}
                    />
                  </Tooltip>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    Hover for reason
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Email Dialog */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)}>
        <DialogTitle>Select Vendors</DialogTitle>
        <DialogContent sx={{ minWidth: "300px" }}>
          {vendors.length === 0 ? (
            <Typography>No vendors found.</Typography>
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
