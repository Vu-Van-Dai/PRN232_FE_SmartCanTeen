import { useState } from "react";
import { Wifi, Clock, AlertTriangle, Play, ChefHat, BarChart3, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface OrderItem {
  quantity: number;
  name: string;
  notes?: string;
}

interface Order {
  id: string;
  status: "overdue" | "new" | "cooking" | "pending";
  source: string;
  server?: string;
  timeRemaining: string;
  isOverdue?: boolean;
  items: OrderItem[];
}

interface PrepItem {
  name: string;
  type: string;
  batchNumber: string;
  prepared: number;
  total: number;
  status: "complete" | "in-progress";
  dueTime?: string;
}

const mockOrders: Order[] = [
  {
    id: "#104",
    status: "overdue",
    source: "Table 4",
    server: "Sarah",
    timeRemaining: "-04:12",
    isOverdue: true,
    items: [
      { quantity: 3, name: "Grilled Cheese", notes: "!! NO MAYO !!" },
      { quantity: 1, name: "Tomato Soup" },
    ],
  },
  {
    id: "#102",
    status: "new",
    source: "Order ahead",
    server: "Pickup",
    timeRemaining: "12:45",
    items: [
      { quantity: 1, name: "Spaghetti Bolognese", notes: "Extra Parmesan" },
      { quantity: 1, name: "Apple Juice" },
    ],
  },
  {
    id: "#105",
    status: "pending",
    source: "Kiosk 2",
    timeRemaining: "14:02",
    items: [
      { quantity: 2, name: "Caesar Salad", notes: "Dressing on side" },
      { quantity: 1, name: "Garlic Bread (3pcs)" },
    ],
  },
  {
    id: "#106",
    status: "pending",
    source: "Mobile App",
    timeRemaining: "18:30",
    items: [
      { quantity: 1, name: "Veggie Burger" },
    ],
  },
];

const prepForecast: PrepItem[] = [
  {
    name: "Chicken Rice",
    type: "Main",
    batchNumber: "Batch #401",
    prepared: 42,
    total: 50,
    status: "in-progress",
  },
  {
    name: "Steamed Veggies",
    type: "Side Dish",
    batchNumber: "",
    prepared: 30,
    total: 30,
    status: "complete",
  },
  {
    name: "Veggie Lasagna",
    type: "Main",
    batchNumber: "Batch #402",
    prepared: 5,
    total: 20,
    status: "in-progress",
    dueTime: "12:00 PM",
  },
];

export default function KitchenKDS() {
  const [orders] = useState<Order[]>(mockOrders);
  const currentTime = new Date().toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "overdue":
        return <Badge className="bg-red-500 text-white uppercase text-xs px-2 py-0.5">Overdue</Badge>;
      case "new":
        return <Badge className="bg-blue-500 text-white uppercase text-xs px-2 py-0.5">New</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Canteen KDS - Hot Kitchen</h1>
            <p className="text-xs text-slate-500">Station 1 • Main Campus</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1.5 px-3 py-1">
            <Wifi className="w-3 h-3" />
            ONLINE
          </Badge>
          
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm">{currentTime}</span>
          </div>
          
          <Avatar className="h-9 w-9 border-2 border-slate-700">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
            <AvatarFallback>KC</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Main Content - Orders */}
        <main className="flex-1 p-5 overflow-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍳</span>
              <h2 className="text-lg font-bold text-white">COOK NOW</h2>
              <span className="text-slate-500 text-sm">(Priority Queue)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 px-3 py-1">8 Pending</Badge>
              <Badge variant="outline" className="border-red-500/50 text-red-400 px-3 py-1">2 Overdue</Badge>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-2 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl overflow-hidden ${
                  order.isOverdue 
                    ? "bg-slate-900 border-2 border-red-500/40" 
                    : "bg-slate-900 border border-slate-800"
                }`}
              >
                {/* Order Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{order.id}</span>
                      {getStatusBadge(order.status)}
                      {order.isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-lg font-mono font-medium ${order.isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                        {order.timeRemaining}
                      </span>
                      <p className="text-xs text-slate-600">remaining</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 mt-1">
                    {order.source}{order.server && ` • ${order.server}`}
                  </p>
                </div>

                {/* Order Items */}
                <div className="px-4 pb-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center text-sm font-medium text-slate-300 flex-shrink-0">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium text-white text-sm">{item.name}</p>
                        {item.notes && (
                          <p className={`text-xs mt-0.5 ${item.notes.includes("!!") ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-4 pt-2">
                  <Button 
                    className={`w-full h-11 gap-2 font-semibold text-sm ${
                      order.isOverdue 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    START COOKING
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Prep Forecast */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 p-5 overflow-auto">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-white">UPCOMING</h3>
          </div>
          <p className="text-slate-500 text-xs mb-5">Prep Forecast (Next 60m)</p>

          {/* Due Time Sections */}
          <div className="space-y-5">
            {/* Lunch Rush Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 text-xs font-medium">DUE AT 11:45 AM (LUNCH RUSH)</span>
              </div>
              
              {prepForecast.slice(0, 2).map((item, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-3 mb-2">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.batchNumber || item.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{item.prepared}</span>
                      <span className="text-slate-500 text-sm">/{item.total}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(item.prepared / item.total) * 100} 
                    className={`h-1.5 ${item.status === 'complete' ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'} bg-slate-700`}
                  />
                  
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={item.status === 'complete' ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.status === 'complete' ? 'Complete' : `${Math.round((item.prepared / item.total) * 100)}% Prepared`}
                    </span>
                    <span className="text-slate-500">
                      {item.status === 'complete' ? 'Ready' : `${item.total - item.prepared} to go`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 12:00 PM Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 text-xs font-medium">DUE AT 12:00 PM</span>
              </div>
              
              {prepForecast.slice(2).map((item, idx) => (
                <div key={idx} className="bg-slate-800 rounded-xl p-3 mb-2">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.batchNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{item.prepared}</span>
                      <span className="text-slate-500 text-sm">/{item.total}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(item.prepared / item.total) * 100} 
                    className="h-1.5 [&>div]:bg-blue-500 bg-slate-700"
                  />
                  
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-blue-400">
                      {Math.round((item.prepared / item.total) * 100)}% Prepared
                    </span>
                    <span className="text-slate-500">
                      {item.total - item.prepared} to go
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Notice */}
          <div className="mt-5 bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-xs text-white">Staff Notice</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Delivery of fresh produce expected at 12:15 PM via Back Door.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
