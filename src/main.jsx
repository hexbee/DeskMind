import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import "./stylesheets/main.css";

console.log("Application starting...");

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Application rendered successfully");
} catch (error) {
  console.error("Error rendering application:", error);
  // 显示错误到DOM，确保用户能看到
  document.getElementById("root").innerHTML = `
    <div style="color: white; padding: 20px;">
      <h2>应用加载出错</h2>
      <p>${error.message}</p>
    </div>
  `;
}
