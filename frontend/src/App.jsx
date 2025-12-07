import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { CssBaseline, AppBar, Toolbar, Typography } from "@mui/material";
import RFPDetails from "./pages/RFPDetails";
import CreateRFP from "./pages/CreateRFP";

function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">ProcureAI 🤖</Typography>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateRFP />} />

        <Route path="/rfp/:id" element={<RFPDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
