// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Landing from "./pages/landing";
import ForgotPassword from "./pages/forgot";
import Dashboard from "./pages/dashboard";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/forgot-password-page" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
