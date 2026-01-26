import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/http";

const POS_DRAFT_STORAGE_KEY = "sc_pos_draft_order_v1";

export default function PayosReturn() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const status = params.get("status");
      const orderCode = params.get("orderCode");
      const hasPosDraft = !!localStorage.getItem(POS_DRAFT_STORAGE_KEY);

      if (!hasPosDraft) return;

      // In local dev, webhook can't reach localhost, so confirm here.
      if (orderCode && status?.toUpperCase() === "PAID") {
        await apiRequest<void>("/api/payos/confirm", {
          method: "POST",
          query: { orderCode, status },
        });
        localStorage.removeItem(POS_DRAFT_STORAGE_KEY);
      }

      const qs = new URLSearchParams();
      qs.set("payos", status?.toLowerCase() === "paid" ? "paid" : "return");
      if (orderCode) qs.set("orderCode", orderCode);
      navigate(`/pos?${qs.toString()}`, { replace: true });
    };

    run();
  }, [location.search, navigate]);

  return (
    <div className="container mx-auto max-w-md py-10 space-y-4">
      <h1 className="text-xl font-semibold">Thanh toán PayOS</h1>
      <p className="text-sm text-muted-foreground">
        Bạn đã được chuyển về hệ thống. Nếu vừa thanh toán, vui lòng quay lại ví/POS và bấm tải lại để
        cập nhật trạng thái.
      </p>

      <div className="rounded-md border p-3 text-xs overflow-auto">
        <div className="font-medium mb-2">Return URL</div>
        <div>{location.pathname + location.search}</div>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/student/wallet">Về Ví</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Về Trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
