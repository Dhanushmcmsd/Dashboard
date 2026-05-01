"use client";

import React, { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  dashboardName: string;
}

export function ExportButton({ canvasRef, dashboardName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      // Dynamically import to keep bundle small
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Hide controls temporarily
      const controls = canvasRef.current.querySelectorAll<HTMLElement>(
        ".widget-drag-handle button, [data-export-hide]"
      );
      controls.forEach((el) => (el.style.visibility = "hidden"));

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      controls.forEach((el) => (el.style.visibility = ""));

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = 297; // A4 landscape width mm
      const H = 210; // A4 landscape height mm
      const margin = 12;
      const headerH = 14;
      const footerH = 8;
      const contentH = H - margin * 2 - headerH - footerH;
      const contentW = W - margin * 2;

      // Header
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text("Financial Dashboard Report", margin, margin + 5);
      pdf.setFontSize(13);
      pdf.setTextColor(20, 20, 20);
      pdf.text(dashboardName, margin, margin + 11);
      const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Exported: ${ts}`, W - margin, margin + 5, { align: "right" });

      // Chart image
      const imgRatio = canvas.width / canvas.height;
      let imgW = contentW;
      let imgH = imgW / imgRatio;
      if (imgH > contentH) { imgH = contentH; imgW = imgH * imgRatio; }
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin + headerH, imgW, imgH);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Confidential", W / 2, H - margin / 2, { align: "center" });
      pdf.text("Page 1", W - margin, H - margin / 2, { align: "right" });

      pdf.save(`${dashboardName.replace(/\s+/g, "_")}_export.pdf`);
      toast.success("Dashboard exported successfully");
    } catch (err) {
      console.error("[ExportButton]", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
    >
      <Download size={15} />
      {exporting ? "Exporting..." : "Export PDF"}
    </button>
  );
}
