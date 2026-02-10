import React from "react"
import ReactDOM from "react-dom/client"
import App from "./architecture-v2.jsx"

const rootEl = document.getElementById("root")

if (!rootEl) {
  throw new Error("Missing #root element")
}

const root = ReactDOM.createRoot(rootEl)
root.render(<App />)
