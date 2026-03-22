import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './styles/theme.css';
import { AuthProvider } from "./context/authContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);