import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Titik masuk utama React: merender komponen <App /> ke dalam <div id="root"> di index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
