import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  className?: string;
  children?: React.ReactNode;
}

export function Toaster() {
  return <div id="toaster" />;
}

export { type ToastProps }
