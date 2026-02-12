// src/Context/RequestsContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const RequestsContext = createContext();

export const RequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Load initial requests from localStorage
    const storedRequests = JSON.parse(localStorage.getItem("pendingRequests")) || [];
    setRequests(storedRequests);
  }, []);

  const updateRequests = (newRequests) => {
    setRequests(newRequests);
    localStorage.setItem("pendingRequests", JSON.stringify(newRequests));
  };

  return (
    <RequestsContext.Provider value={{ requests, setRequests: updateRequests }}>
      {children}
    </RequestsContext.Provider>
  );
};
