import { useState } from "react";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  status: "in_stock" | "low_stock" | "sold_out";
}

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

function formatVND(amount: number) {
  const rounded = Math.round(Number(amount ?? 0));
  return new Intl.NumberFormat("vi-VN").format(rounded) + " VND";
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusBadge = () => {
    switch (item.status) {
      case "in_stock":
        return (
          <Badge className="badge-success gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Còn hàng
          </Badge>
        );
      case "low_stock":
        return (
          <Badge className="badge-warning gap-1">
            <AlertTriangle className="w-3 h-3" /> Sắp hết
          </Badge>
        );
      case "sold_out":
        return <Badge className="badge-danger">Hết hàng</Badge>;
    }
  };
  
  return (
    <div 
      className="menu-item-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={item.image} 
          alt={item.name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-105"
          )}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        
        {/* Sold out overlay */}
        {item.status === "sold_out" && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <span className="text-lg font-bold text-background px-4 py-2 bg-foreground/80 rounded-lg">
              Hết hàng
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
          <span className="text-sm font-bold border border-border rounded-lg px-2 py-1">
            {formatVND(item.price)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {item.description}
        </p>
        
        <Button 
          onClick={() => onAddToCart(item)}
          disabled={item.status === "sold_out"}
          variant={item.status === "sold_out" ? "outline" : "default"}
          className="w-full gap-2"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4" />
          {item.status === "sold_out" ? "Hết hàng" : "Thêm vào giỏ"}
        </Button>
      </div>
    </div>
  );
}
