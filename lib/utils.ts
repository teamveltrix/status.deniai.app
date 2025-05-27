import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Status utility functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case "operational":
      return "bg-green-500";
    case "degraded":
      return "bg-yellow-500";
    case "partial_outage":
      return "bg-orange-500";
    case "major_outage":
      return "bg-red-500";
    case "investigating":
      return "bg-red-500";
    case "identified":
      return "bg-orange-500";
    case "monitoring":
      return "bg-yellow-500";
    case "resolved":
      return "bg-green-500";
    case "scheduled":
      return "bg-blue-500";
    case "in_progress":
      return "bg-orange-500";
    case "completed":
      return "bg-green-500";
    case "cancelled":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded Performance";
    case "partial_outage":
      return "Partial Outage";
    case "major_outage":
      return "Major Outage";
    case "investigating":
      return "Investigating";
    case "identified":
      return "Identified";
    case "monitoring":
      return "Monitoring";
    case "resolved":
      return "Resolved";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

export const getImpactColor = (impact: string) => {
  switch (impact) {
    case "none":
      return "bg-gray-500";
    case "minor":
      return "bg-yellow-500";
    case "major":
      return "bg-orange-500";
    case "critical":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export const getImpactText = (impact: string) => {
  switch (impact) {
    case "none":
      return "No Impact";
    case "minor":
      return "Minor Impact";
    case "major":
      return "Major Impact";
    case "critical":
      return "Critical Impact";
    default:
      return impact;
  }
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else {
    return `${days} days ago`;
  }
};

export const formatMaintenanceTime = (startTime: Date | string, endTime: Date | string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  // If maintenance is in the future
  if (start > now) {
    const diff = start.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Starts in ${days} day${days > 1 ? 's' : ''} • ${duration}h duration`;
    } else if (hours > 0) {
      return `Starts in ${hours} hour${hours > 1 ? 's' : ''} • ${duration}h duration`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `Starts in ${minutes} minute${minutes > 1 ? 's' : ''} • ${duration}h duration`;
    }
  }
  
  // If maintenance is ongoing
  if (start <= now && end > now) {
    const remaining = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    return `In progress • ${remaining}h remaining`;
  }
  
  // If maintenance is completed
  const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  return `Completed • ${duration}h duration`;
};
