import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/http";

const POS_DRAFT_STORAGE_KEY = "sc_pos_draft_order_v1";

export default function PayosCancel() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const orderCode = params.get("orderCode");
      const hasPosDraft = !!localStorage.getItem(POS_DRAFT_STORAGE_KEY);

      if (!hasPosDraft) return;

      if (orderCode) {
        await apiRequest<void>("/api/payos/cancel", {
          method: "POST",
          query: { orderCode },
        });
      }

      const qs = new URLSearchParams();
      qs.set("payos", "cancel");
      if (orderCode) qs.set("orderCode", orderCode);
      navigate(`/pos?${qs.toString()}`, { replace: true });
    };

    run();
  }, [location.search, navigate]);

  return (
    <div className="container mx-auto max-w-md py-10 space-y-4">
      <h1 className="text-xl font-semibold">Đã hủy thanh toán</h1>
      <p className="text-sm text-muted-foreground">
        Bạn đã hủy hoặc thanh toán chưa hoàn tất. Bạn có thể thử lại từ ví hoặc POS.
      </p>

      <div className="rounded-md border p-3 text-xs overflow-auto">
        <div className="font-medium mb-2">Cancel URL</div>
        <div>{location.pathname + location.search}</div>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/student/wallet">Thử lại nạp ví</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Về Trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
