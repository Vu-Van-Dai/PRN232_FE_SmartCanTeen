import { ChevronRight, Star, UtensilsCrossed, Grid3X3, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function formatVND(amount: number) {
  const rounded = Math.round(Number(amount ?? 0));
  return new Intl.NumberFormat("vi-VN").format(rounded) + " VND";
}

const categories = [
  { 
    name: "Breakfast", 
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop",
    path: "/student/menu/category/breakfast",
    gradient: "from-amber-500/80 to-yellow-600/80"
  },
  { 
    name: "Lunch", 
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    path: "/student/menu/category/lunch",
    gradient: "from-orange-500/80 to-red-500/80"
  },
  { 
    name: "Snacks", 
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop",
    path: "/student/menu/category/snacks",
    gradient: "from-teal-500/80 to-emerald-600/80"
  },
];

const topDishes = [
  { 
    name: "Tuna Salad Plate", 
    price: 8.50, 
    rating: 4.8, 
    reviews: "120+",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop"
  },
  { 
    name: "Classic Beef Burger", 
    price: 10.00, 
    rating: 4.9, 
    reviews: "200+",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop"
  },
  { 
    name: "Veggie Pasta", 
    price: 7.25, 
    rating: 4.7, 
    reviews: "85+",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=300&h=300&fit=crop"
  },
  { 
    name: "Chicken Caesar Wrap", 
    price: 9.50, 
    rating: 4.6, 
    reviews: "150+",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=300&fit=crop"
  },
];

export default function StudentHome() {
  return (
    <div className="max-w-6xl mx-auto">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop"
            alt="Delicious food"
            className="w-full h-56 md:h-72 object-cover"
          />
        </div>

        {/* Quick Order + Meal of the Day */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Quick Order */}
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-2">Quick Order</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Hungry? <span className="text-orange-500">Order Now!</span>
              </h2>
              <p className="text-slate-600 mb-4">
                Grab the meal of the day at <span className="text-orange-500 font-semibold">20% off</span>. 
                Limited time offer for students and staff.
              </p>
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-full">
                <Link to="/student/menu">Order Now</Link>
              </Button>
            </div>

            {/* Meal of the Day */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
              <img
                src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop"
                alt="Grilled Salmon"
                className="w-28 h-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Món ăn trong ngày</span>
                </div>
                <h3 className="font-semibold text-slate-900">Cá hồi nướng với rau củ</h3>
                <p className="text-xl font-bold text-orange-500 mt-1">{formatVND(7250)}</p>
              </div>
              <Button variant="outline" size="sm" className="text-orange-500 border-orange-500 hover:bg-orange-50 rounded-full">
                Thêm vào giỏ hàng
              </Button>
            </div>
          </div>
        </div>

        {/* Browse Categories */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Grid3X3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Browse Categories</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="relative rounded-2xl overflow-hidden group h-36"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient}`} />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-white font-semibold text-lg">{category.name}</span>
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Selling Dishes */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-slate-900">Top Selling Dishes</h2>
            </div>
            <Link to="/student/menu" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Xem tất cả
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topDishes.map((dish) => (
              <div key={dish.name} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                <div className="aspect-square">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-900 text-sm truncate">{dish.name}</h3>
                    <span className="text-orange-500 font-bold">{formatVND(dish.price)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{dish.rating}</span>
                    <span>({dish.reviews})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
    </div>
  );
}
