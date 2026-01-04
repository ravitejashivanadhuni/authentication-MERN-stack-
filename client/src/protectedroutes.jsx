//give me the code for protectedroutes.jsx file
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth'; // Assume this utility checks auth status
import { FaWindows } from 'react-icons/fa';
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    alert("Please login to access this page");
    return <Navigate to="/login" replace />;    
  }
    return children;
};
export default ProtectedRoute;
