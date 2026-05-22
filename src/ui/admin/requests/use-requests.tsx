"use client";

import { useState } from "react";
import {
  initialRequests,
  type LocalRequest,
  type RequestStatus,
} from "./requests-data";

const STORAGE_KEY = "admin-local-requests";

function getInitialState(): LocalRequest[] {
  if (typeof window === "undefined") {
    return initialRequests;
  }

  const savedRequests = localStorage.getItem(STORAGE_KEY);

  if (!savedRequests) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
    return initialRequests;
  }

  try {
    return JSON.parse(savedRequests) as LocalRequest[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests));
    return initialRequests;
  }
}

export function useRequests() {
  const [requests, setRequests] = useState<LocalRequest[]>(getInitialState);

  function saveRequests(updatedRequests: LocalRequest[]) {
    setRequests(updatedRequests);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));
  }

  function updateRequestStatus(email: string, status: RequestStatus) {
    const updatedRequests = requests.map((request) =>
      request.email === email
        ? {
            ...request,
            status,
          }
        : request,
    );

    saveRequests(updatedRequests);
  }

  function approveRequest(email: string) {
    updateRequestStatus(email, "approved");
  }

  function rejectRequest(email: string) {
    updateRequestStatus(email, "rejected");
  }

  function getRequestByEmail(email: string) {
    return requests.find((request) => request.email === email);
  }

  function getPendingRequests() {
    return requests.filter((request) => request.status === "pending");
  }

  const totals = {
    all: requests.length,
    pending: requests.filter((request) => request.status === "pending").length,
    approved: requests.filter((request) => request.status === "approved").length,
    rejected: requests.filter((request) => request.status === "rejected").length,
  };

  return {
    requests,
    totals,
    getRequestByEmail,
    getPendingRequests,
    updateRequestStatus,
    approveRequest,
    rejectRequest,
  };
}
