import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { exportElementsToPdf } from "@/lib/pdf";

interface Props {
  getElements: () => (HTMLElement | null)[];
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function ExportPdfButton({ getElements, filename, label = "Xuất PDF", variant = "default", className }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={variant}
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await exportElementsToPdf(getElements(), filename);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
      {busy ? "Đang xuất..." : label}
    </Button>
  );
}