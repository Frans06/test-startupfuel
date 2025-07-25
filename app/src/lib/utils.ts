import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";
};

export const geAppUrl = () => {
  return import.meta.env.VITE_APP_URL ?? "http://localhost:3000";
};
