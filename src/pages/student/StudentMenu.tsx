import { useState } from "react";
import { MenuItemCard, MenuItem } from "@/components/menu/MenuItemCard";
import { toast } from "@/hooks/use-toast";

const sampleMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "Chicken Rice Set",
    description: "Roasted chicken served with fragrant rice, cucumber, and homemade chili sauce.",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop",
    category: "rice",
    status: "in_stock"
  },
  {
    id: "2",
    name: "Iced Milo",
    description: "Classic chocolate malt drink served ice cold. A student favorite.",
    price: 1.20,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop",
    category: "drinks",
    status: "in_stock"
  },
  {
    id: "3",
    name: "Spicy Noodle Soup",
    description: "Egg noodles in a savory spicy broth with minced pork and vegetables.",
    price: 3.80,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    category: "noodles",
    status: "low_stock"
  },
  {
    id: "4",
    name: "Fresh Fruit Salad",
    description: "A healthy mix of seasonal fruits including watermelon, papaya, and pineapple.",
    price: 2.50,
    image: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400&h=300&fit=crop",
    category: "snacks",
    status: "in_stock"
  },
  {
    id: "5",
    name: "Curry Chicken",
    description: "Rich coconut curry chicken served with a side of steamed rice.",
    price: 4.00,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop",
    category: "rice",
    status: "sold_out"
  },
  {
    id: "6",
    name: "Orange Juice",
    description: "Freshly squeezed orange juice, full of vitamin C. No sugar added.",
    price: 2.00,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
    category: "drinks",
    status: "in_stock"
  },
  {
    id: "7",
    name: "Grilled Sandwich",
    description: "Spicy chicken with cheddar cheese and signature sauce.",
    price: 3.50,
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    category: "snacks",
    status: "in_stock"
  },
  {
    id: "8",
    name: "Fried Rice Special",
    description: "Wok-fried rice with shrimp, chicken, and mixed vegetables.",
    price: 4.20,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
    category: "rice",
    status: "in_stock"
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  return { text: "Good Evening", emoji: "🌙" };
}

export default function StudentMenu() {
  const [items] = useState<MenuItem[]>(sampleMenuItems);
  const greeting = getGreeting();
  
  const handleAddToCart = (item: MenuItem) => {
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
          {greeting.text}, Alex! {greeting.emoji}
        </h1>
        <p className="text-muted-foreground">
          Hungry? Check out today's fresh menu.
        </p>
      </div>
      
      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((item) => (
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
