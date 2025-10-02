import React from "react";
import ReactDOM from "react-dom/client";
import Front from "./Front.jsx";
import "./Front.css";

// Make sure <div id="root"></div> exists in popup.html
const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Front />
    </React.StrictMode>
  );
} else {
  console.error(" Root element #root not found in popup.html");
}
