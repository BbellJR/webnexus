import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ fontFamily: "Arial", padding: "20px" }}>
      <h1>Hello React + Vercel 🚀</h1>
      <p>Deploy สำเร็จแล้ว</p>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);