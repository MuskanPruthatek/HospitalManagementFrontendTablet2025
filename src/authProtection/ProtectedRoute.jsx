import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getValidAuthOrNull } from "./auth";

const ProtectedRoute = () => {
  const location = useLocation();
  const auth = getValidAuthOrNull();

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
