import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Configure Amplify with outputs
Amplify.configure(outputs);

// Get existing config and merge with custom outputs
const existingConfig = Amplify.getConfig();

Amplify.configure({
  ...existingConfig,
  custom: {
    ...outputs.custom
  }
});

console.log('Final Amplify config:', Amplify.getConfig());
console.log('Custom outputs available:', outputs.custom);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
