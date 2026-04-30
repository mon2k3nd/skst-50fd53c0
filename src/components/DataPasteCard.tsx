import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, FileText } from "lucide-react";

interface DataPasteCardProps {
  title: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  rows?: number;
}

export function DataPasteCard({
  title,
  placeholder = "Dán dữ liệu từ BI vào đây...",
  value,
  onChange,
  icon,
  rows = 8,
}: DataPasteCardProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-info">
          {icon ?? <FileText className="h-4 w-4" />}
          {title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Xoá
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={rows}
          className={`font-mono text-xs transition-all ${focused ? "ring-2 ring-info/40" : ""}`}
        />
      </CardContent>
    </Card>
  );
}