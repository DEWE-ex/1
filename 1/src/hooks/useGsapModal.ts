"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { closeModal, openModal } from "@/lib/animations";

export function useGsapModal(isOpen: boolean, onClose: () => void) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useGSAP(
    () => {
      if (!isOpen || !backdropRef.current || !panelRef.current) return;
      closingRef.current = false;
      openModal(backdropRef.current, panelRef.current);
    },
    { dependencies: [isOpen] }
  );

  const handleClose = useCallback(() => {
    if (closingRef.current || !backdropRef.current || !panelRef.current) return;
    closingRef.current = true;
    closeModal(backdropRef.current, panelRef.current, onClose);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  return { backdropRef, panelRef, handleClose };
}
