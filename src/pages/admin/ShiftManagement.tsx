import { useState } from "react";
import { Calendar, Building, Clock, Info, CheckCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ShiftManagement() {
  const [cashCounted, setCashCounted] = useState("395.00");
  const expectedCash = 400.00;
  const discrepancy = parseFloat(cashCounted) - expectedCash;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-primary px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground">🍴</span>
          </div>
          <span className="font-semibold text-primary-foreground">Canteen Manager</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-primary-foreground/10">
            <span className="text-primary-foreground">🔔</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-primary-foreground">Jane Doe</p>
              <p className="text-xs text-primary-foreground/70">Staff Member</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop" 
                alt="User" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="text-primary hover:underline cursor-pointer">Dashboard</span>
          <span>/</span>
          <span>Shift Management</span>
        </div>
        
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground mt-1">
              Daily reconciliation and shift closing procedures.
            </p>
          </div>
          
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Oct 24, 2023
          </Button>
        </div>
        
        {/* Shift Info Bar */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary">🏷️</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Shift ID</p>
                <p className="font-semibold">#4920</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="font-semibold">Main Canteen A</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                  <p className="font-semibold text-warning">Closing in progress</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Tabs */}
        <Tabs defaultValue="close" className="mb-6">
          <TabsList className="mb-6">
            <TabsTrigger value="open">Open Shift</TabsTrigger>
            <TabsTrigger value="close" className="text-primary">Close Shift</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="close">
            <div className="grid grid-cols-2 gap-6">
              {/* System Totals */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">System Totals</h3>
                  <Badge variant="outline">Read Only</Badge>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Recorded Sales</p>
                  <h2 className="text-4xl font-bold">$1,250.00</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        💵
                      </div>
                      <div>
                        <p className="font-medium text-sm">Cash Sales</p>
                        <p className="text-xs text-muted-foreground">152 Transactions</p>
                      </div>
                    </div>
                    <p className="font-mono font-semibold">$400.00</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
                        💳
                      </div>
                      <div>
                        <p className="font-medium text-sm">QR / Card</p>
                        <p className="text-xs text-muted-foreground">310 Transactions</p>
                      </div>
                    </div>
                    <p className="font-mono font-semibold">$850.00</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-info/10 rounded-lg flex gap-3">
                  <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-info">
                    System totals are automatically updated from POS transactions. If these figures are incorrect, please report an issue before proceeding.
                  </p>
                </div>
              </Card>
              
              {/* Cash Drawer Count */}
              <Card className="p-6 border-t-4 border-t-destructive">
                <h3 className="font-semibold text-lg mb-2">Cash Drawer Count</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Please count the physical cash in the drawer and enter the total below.
                </p>
                
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">Actual Cash Counted</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">$</span>
                    <Input 
                      value={cashCounted}
                      onChange={(e) => setCashCounted(e.target.value)}
                      className="pl-10 pr-16 text-2xl font-semibold h-14"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">USD</span>
                  </div>
                </div>
                
                {/* Discrepancy Alert */}
                {discrepancy !== 0 && (
                  <div className="p-4 bg-destructive/10 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-destructive">DISCREPANCY DETECTED</p>
                      <Badge className="bg-destructive text-destructive-foreground">SHORT</Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm mb-3">
                      <div>
                        <p className="text-destructive">Expected: ${expectedCash.toFixed(2)}</p>
                        <p className="text-destructive">Counted: ${parseFloat(cashCounted).toFixed(2)}</p>
                      </div>
                      <p className="text-2xl font-bold text-destructive">
                        -${Math.abs(discrepancy).toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-destructive mb-2">Reason for discrepancy (Required)</p>
                      <Select defaultValue="rounding">
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rounding">Small Change Rounding</SelectItem>
                          <SelectItem value="error">Counting Error</SelectItem>
                          <SelectItem value="theft">Suspected Theft</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Save className="w-4 h-4" />
                    Save Draft
                  </Button>
                  <Button className="flex-1 gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Finalize Shift
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2023 School Canteen Management System. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
