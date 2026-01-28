import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MenuItemCard, MenuItem } from "@/components/menu/MenuItemCard";
import { toast } from "@/hooks/use-toast";
import { menuItemsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCart } from "@/lib/cart/CartContext";
import { getVnHour } from "@/lib/datetime";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function statusFromInventory(qty: number): MenuItem["status"] {
  if (qty <= 0) return "sold_out";
  if (qty <= 5) return "low_stock";
  return "in_stock";
}

function getGreeting() {
  const hour = getVnHour() ?? new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

export default function StudentMenu() {
  const { user } = useAuth();
  const cart = useCart();
  const { category } = useParams<{ category?: string }>();

  const { data: rawItems = [], isLoading, isError } = useQuery({
    queryKey: ["menu-items"],
    queryFn: menuItemsApi.getMenuItems,
    staleTime: 30_000,
  });

  const items = useMemo<MenuItem[]>(() => {
    return rawItems
      .filter((x) => x.isActive)
      .map((x) => {
        const catSlug = slugify(x.categoryName);
        return {
          id: x.id,
          name: x.name,
          description: x.categoryName,
          price: Number(x.price),
          image: x.imageUrl ?? FALLBACK_IMAGE,
          category: catSlug,
          status: statusFromInventory(x.inventoryQuantity),
        } satisfies MenuItem;
      });
  }, [rawItems]);

  const filtered = useMemo(() => {
    if (!category) return items;
    return items.filter((i) => i.category === category);
  }, [category, items]);

  const greeting = getGreeting();
  const resolvedName = user?.name ?? user?.email ?? "there";
  
  const handleAddToCart = (item: MenuItem) => {
    cart.addItem(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
      },
      1
    );
    toast({
      title: "Added to cart!",
      description: `${item.name} has been added to your cart.`,
    });
  };
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">
          {greeting.text}, {resolvedName}! {greeting.emoji}
        </h1>
        <p className="text-muted-foreground">
          Hungry? Check out today's fresh menu.
        </p>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading menu...</div>
      )}

      {isError && (
        <div className="text-sm text-destructive">Failed to load menu.</div>
      )}
      
      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item) => (
          <MenuItemCard 
            key={item.id} 
            item={item} 
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
