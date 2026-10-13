import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import HubApp from "./App";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HubApp />
  </React.StrictMode>,
);
