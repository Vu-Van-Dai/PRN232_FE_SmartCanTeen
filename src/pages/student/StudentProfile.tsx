import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/student/menu")}>Go to Menu</Button>
          <Button
            variant="destructive"
            onClick={() => {
              logout();
              navigate("/auth/login", { replace: true });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="text-sm font-mono">{user?.id ?? "—"}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-muted-foreground">Roles</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {(user?.roles ?? []).length === 0 ? (
                <span className="text-sm">—</span>
              ) : (
                user?.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
