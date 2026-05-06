import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import AppRoutes from "./pages/AppRoutes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
