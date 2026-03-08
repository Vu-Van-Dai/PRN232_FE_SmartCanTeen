import { ChevronRight, Star, UtensilsCrossed, Grid3X3, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, menuItemsApi } from "@/lib/api";
import type { CategoryResponse, TopSellingMenuItemResponse } from "@/lib/api";

function formatVND(amount: number) {
  const rounded = Math.round(Number(amount ?? 0));
  return new Intl.NumberFormat("vi-VN").format(rounded) + " VND";
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop",
];

const CATEGORY_GRADIENTS = [
  "from-amber-500/80 to-yellow-600/80",
  "from-orange-500/80 to-red-500/80",
  "from-teal-500/80 to-emerald-600/80",
  "from-indigo-500/80 to-violet-600/80",
  "from-slate-700/70 to-slate-900/70",
];

export default function StudentHome() {
  const { data: rawCategories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
    staleTime: 30_000,
  });

  const topSellingQuery = useQuery({
    queryKey: ["menu-items", "top-selling", { take: 4 }],
    queryFn: () => menuItemsApi.getTopSellingMenuItems({ take: 4 }),
    staleTime: 30_000,
  });

  const categories = rawCategories
    .filter((c: CategoryResponse) => c.isActive)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return (
    <div className="max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop"
            alt="Delicious food"
            className="w-full h-40 sm:h-56 md:h-72 object-cover"
          />
        </div>

        <PwaInstallBanner />

        {/* Quick Order + Meal of the Day */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Quick Order */}
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-2">Đặt hàng nhanh</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Thực đơn hôm nay đã sẵn sàng.
              </h2>
              <p className="text-slate-600 mb-4">
                Hãy chọn món ăn yêu thích của bạn và gọi món trực tiếp từ căng tin.
              </p>
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-full">
                <Link to="/student/menu">Đặt hàng ngay</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Browse Categories */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Grid3X3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Danh Mục</h2>
          </div>
          
          {isCategoriesLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải danh mục...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, idx) => {
                const image = CATEGORY_IMAGES[idx % CATEGORY_IMAGES.length];
                const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
                const path = `/student/menu/category/${slugify(category.name)}`;

                return (
                  <Link
                    key={category.id}
                    to={path}
                    className="relative rounded-2xl overflow-hidden group h-28 sm:h-36"
                  >
                    <img
                      src={image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-white font-semibold text-lg">{category.name}</span>
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Selling Dishes */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-slate-900">Món ăn bán chạy</h2>
            </div>
            <Link to="/student/menu" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Xem tất cả
            </Link>
          </div>

          {topSellingQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải món bán chạy...</div>
          ) : (topSellingQuery.data?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có dữ liệu món bán chạy.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(topSellingQuery.data ?? []).map((dish: TopSellingMenuItemResponse) => (
                <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                  <div className="aspect-square bg-slate-50">
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UtensilsCrossed className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-slate-900 text-sm truncate">{dish.name}</h3>
                      <span className="text-orange-500 font-bold">{formatVND(dish.price)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Đã bán {dish.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
    </div>
  );
}
