import { Search, Bell, User, ChevronRight, Star, UtensilsCrossed, Grid3X3, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categories = [
  { 
    name: "Breakfast", 
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop",
    path: "/category/breakfast",
    gradient: "from-amber-500/80 to-yellow-600/80"
  },
  { 
    name: "Lunch", 
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    path: "/category/lunch",
    gradient: "from-orange-500/80 to-red-500/80"
  },
  { 
    name: "Snacks", 
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop",
    path: "/category/snacks",
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-900">CanteenConnect</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium">Menu</Link>
            <Link to="/orders" className="text-slate-600 hover:text-indigo-600 font-medium">My Orders</Link>
            <Link to="/wallet" className="text-slate-600 hover:text-indigo-600 font-medium">Wallet</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for food..."
                className="w-56 pl-10 bg-slate-100 border-0 rounded-full h-10"
              />
            </div>
            
            <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <User className="w-5 h-5 text-slate-500" />
            </button>
            
            <Avatar className="h-9 w-9 border-2 border-orange-200">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
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
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-full">
                Order Now
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
                  <span className="text-xs text-slate-500">Meal of the Day</span>
                </div>
                <h3 className="font-semibold text-slate-900">Grilled Salmon with Veggies</h3>
                <p className="text-xl font-bold text-orange-500 mt-1">$7.25</p>
              </div>
              <Button variant="outline" size="sm" className="text-orange-500 border-orange-500 hover:bg-orange-50 rounded-full">
                Add to Cart
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
            <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              View All
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
                    <span className="text-orange-500 font-bold">${dish.price.toFixed(2)}</span>
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
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-indigo-900">CanteenConnect</span>
              </div>
              <p className="text-slate-500 text-sm">
                Making campus dining easier, faster, and more delicious for everyone.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-indigo-600 uppercase text-xs tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About Us</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact</a></li>
                <li><a href="#" className="hover:text-slate-900">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-indigo-600 uppercase text-xs tracking-wider mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Help Center</a></li>
                <li><a href="#" className="hover:text-slate-900">Payment Methods</a></li>
                <li><a href="#" className="hover:text-slate-900">Refund Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-indigo-600 uppercase text-xs tracking-wider mb-4">Hours</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Mon-Fri: 8am - 8pm</li>
                <li>Sat: 9am - 4pm</li>
                <li>Sun: Closed</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2024 CanteenConnect System. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <a href="#" className="hover:text-slate-900">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
