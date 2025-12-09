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
  Box,
  Grid,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function RFPDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // --- Data Loading ---
  const loadData = async () => {
    try {
      const rfpData = await getRFP(id);
      setRfp(rfpData);
      const proposalsData = await getProposals(id);
      // Sort: Highest Score First
      const sorted = proposalsData.sort((a, b) => b.fit_score - a.fit_score);
      setProposals(sorted);

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
      await loadData();
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
      console.error(err);
      setError("Failed to send emails.");
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

  // Helper: Find vendor name safely
  const getVendorName = (data) => {
    if (!data) return "Unknown";
    return (
      data.vendor_name ||
      data.vendor ||
      data.company ||
      data.supplier ||
      "Unknown Vendor"
    );
  };

  // Helper: Score Colors
  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 50) return "warning";
    return "error";
  };

  if (!rfp)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  const dynamicFields = rfp.json_schema?.fields || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* 1. Navigation & Header */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Dashboard
      </Button>

      {/* 2. Hero Section (Gradient Card) */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #fff 0%, #f1f5f9 100%)",
          border: "1px solid #e2e8f0",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="overline" color="primary" fontWeight="bold">
              Request for Proposal (ID: {rfp.id.substring(0, 8)})
            </Typography>
            <Typography
              variant="h4"
              gutterBottom
              fontWeight="700"
              sx={{ color: "#1e293b" }}
            >
              {rfp.title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: "800px", fontSize: "1.1rem" }}
            >
              "{rfp.prompt_text}"
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SendIcon />}
              onClick={() => setOpenEmailDialog(true)}
              sx={{ borderRadius: "10px", borderWidth: "2px", fontWeight: 600 }}
            >
              Invite Vendors
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Upload Action Area */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained"
            component="label"
            size="large"
            startIcon={
              uploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CloudUploadIcon />
              )
            }
            disabled={uploading}
            sx={{
              boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
              px: 4,
              py: 1.5,
            }}
          >
            {uploading ? "Analyzing & Scoring..." : "Upload Vendor PDF"}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileUpload}
            />
          </Button>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* 3. The "Wow" Comparison Matrix */}
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 700, color: "#334155", mb: 2 }}
      >
        Vendor Analysis
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 4,
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ py: 3, fontWeight: 700, color: "#475569" }}>
                VENDOR / FILE
              </TableCell>
              {dynamicFields.map((field) => (
                <TableCell
                  key={field.key}
                  sx={{ py: 3, fontWeight: 700, color: "#475569" }}
                >
                  {field.key.replace(/_/g, " ").toUpperCase()}
                </TableCell>
              ))}
              <TableCell sx={{ py: 3, fontWeight: 700, color: "#475569" }}>
                AI SCORE
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={dynamicFields.length + 2}
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Typography color="text.secondary">
                    No proposals yet. Upload a PDF to start analyzing.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {proposals.map((proposal, index) => {
              const isWinner = index === 0 && proposal.fit_score > 0;
              return (
                <TableRow
                  key={proposal.id}
                  sx={{
                    bgcolor: isWinner ? "#f0fdf4" : "inherit", // Green tint for winner
                    "&:hover": { bgcolor: isWinner ? "#dcfce7" : "#f8fafc" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell sx={{ fontWeight: isWinner ? 700 : 400 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {getVendorName(proposal.extracted_data)}
                      {isWinner && (
                        <Chip
                          icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
                          label="Top Pick"
                          size="small"
                          color="success"
                          sx={{ ml: 1, fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {dynamicFields.map((field) => (
                    <TableCell key={field.key}>
                      {proposal.extracted_data?.[field.key]?.toString() || "-"}
                    </TableCell>
                  ))}

                  <TableCell>
                    <Tooltip
                      title={
                        proposal.extracted_data?.ai_recommendation ||
                        "No reason"
                      }
                      arrow
                    >
                      <Chip
                        label={`${proposal.fit_score}/100`}
                        color={getScoreColor(proposal.fit_score)}
                        sx={{ fontWeight: 700, minWidth: "80px" }}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Email Dialog */}
      <Dialog
        open={openEmailDialog}
        onClose={() => setOpenEmailDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Select Vendors to Invite
        </DialogTitle>
        <DialogContent sx={{ minWidth: "350px" }}>
          {vendors.length === 0 ? (
            <Alert severity="info">
              No vendors found. Add them via Swagger API first.
            </Alert>
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
                  label={
                    <Typography>
                      <b>{vendor.name}</b> <br />
                      <span style={{ color: "gray", fontSize: "0.85em" }}>
                        {vendor.email}
                      </span>
                    </Typography>
                  }
                  sx={{ mb: 1 }}
                />
              ))}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenEmailDialog(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmails}
            variant="contained"
            disabled={selectedVendors.length === 0 || sending}
            sx={{ px: 4 }}
          >
            {sending ? "Sending..." : "Send Invites"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RFPDetails;
