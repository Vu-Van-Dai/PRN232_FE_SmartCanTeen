import { useState } from "react";
import { Search, Plus, Filter, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface MenuItem {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  inStock: boolean;
  image: string;
}

const menuItems: MenuItem[] = [
  { id: "1", name: "Chicken Burger", subtitle: "Spicy option available", category: "Main Course", price: 4.50, inStock: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop" },
  { id: "2", name: "Zero Sugar Cola", subtitle: "330ml Can", category: "Drinks", price: 1.20, inStock: false, image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop" },
  { id: "3", name: "Fresh Apple", subtitle: "Locally sourced", category: "Healthy", price: 0.80, inStock: true, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop" },
  { id: "4", name: "Cheese Pizza Slice", subtitle: "Hot food counter", category: "Main Course", price: 3.00, inStock: true, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&h=100&fit=crop" },
  { id: "5", name: "Garden Salad", subtitle: "Pre-packaged", category: "Healthy", price: 2.50, inStock: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop" },
];

const categoryColors: Record<string, string> = {
  "Main Course": "bg-destructive/10 text-destructive",
  "Drinks": "bg-info/10 text-info",
  "Healthy": "bg-primary/10 text-primary",
  "Snacks": "bg-warning/10 text-warning",
};

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [searchQuery, setSearchQuery] = useState("");
  
  const toggleStock = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, inStock: !item.inStock } : item
    ));
  };
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage food items, prices, and stock availability.
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Item
        </Button>
      </div>
      
      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search food items by name, category..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
      
      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Image</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Item Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Category</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Price</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Stock Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge className={categoryColors[item.category] || "bg-muted"}>
                    {item.category}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-medium">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={item.inStock}
                      onCheckedChange={() => toggleStock(item.id)}
                    />
                    <span className={item.inStock ? "text-primary text-sm" : "text-muted-foreground text-sm"}>
                      {item.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {filteredItems.length} of 24 results
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>‹</Button>
            <Button variant="default" size="sm" className="w-9">1</Button>
            <Button variant="outline" size="sm" className="w-9">2</Button>
            <Button variant="outline" size="sm" className="w-9">3</Button>
            <span className="px-2 text-muted-foreground">...</span>
            <Button variant="outline" size="sm" className="w-9">8</Button>
            <Button variant="outline" size="sm">›</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
