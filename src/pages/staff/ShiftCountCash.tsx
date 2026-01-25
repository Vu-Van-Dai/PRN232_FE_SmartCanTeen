import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "smartcanteen:shift:cash";

function toNumber(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export default function ShiftCountCash() {
  const navigate = useNavigate();
  const [cash, setCash] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCash(raw);
    } catch {
      // ignore
    }
  }, []);

  const onOk = () => {
    const n = toNumber(cash);
    if (n < 0) {
      toast({ title: "Số tiền không hợp lệ", variant: "destructive" });
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, String(n));
    } catch {
      // ignore
    }

    toast({ title: "Đã lưu tiền mặt" });
    navigate("/pos/shift-close", { replace: true });
  };

  return (
    <div className="p-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Đếm tiền mặt</CardTitle>
          <CardDescription>Nhập số tiền mặt thực tế, nhấn OK để quay lại.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash">Tiền mặt</Label>
            <Input
              id="cash"
              inputMode="numeric"
              placeholder="0"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/pos/shift-close")}>Quay lại</Button>
            <Button onClick={onOk}>OK</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
