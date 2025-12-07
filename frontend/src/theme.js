import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb", // Professional Blue
      light: "#60a5fa",
      dark: "#1e40af",
    },
    secondary: {
      main: "#10b981", // Success Green
    },
    background: {
      default: "#f8fafc", // Very light gray-blue (not stark white)
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b", // Slate 800
      secondary: "#64748b", // Slate 500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: "#0f172a",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.5px",
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none", // No ALL CAPS buttons (looks cleaner)
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Modern rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          padding: "8px 20px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", // Soft glow on hover
          },
        },
        containedPrimary: {
          background: "linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)", // Gradient Button
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)", // Lift up effect
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255, 255, 255, 0.8)", // Glassmorphism
          backdropFilter: "blur(12px)",
          color: "#1e293b", // Dark text on light header
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

export default theme;
