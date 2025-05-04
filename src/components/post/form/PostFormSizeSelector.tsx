
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostFormSizeSelectorProps {
  category: string;
  measurements: Record<string, string>;
  onSizeChange: (value: string) => void;
  onCustomSizeChange: (value: string) => void;
}

export function PostFormSizeSelector({
  category,
  measurements,
  onSizeChange,
  onCustomSizeChange,
}: PostFormSizeSelectorProps) {
  const [sizeTab, setSizeTab] = useState("standard");
  const currentSize = measurements.size || "";
  const customSize = measurements.customSize || "";
  
  if (!category || !category.toLowerCase().includes("clothing")) {
    return null;
  }

  // Define sizes based on category
  const standardSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  
  const euSizes = {
    men: ["44", "46", "48", "50", "52", "54", "56", "58", "60"],
    women: ["34", "36", "38", "40", "42", "44", "46", "48", "50"],
    kids: ["50", "56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "140", "146", "152", "158", "164"]
  };
  
  const usSizes = {
    men: ["34", "36", "38", "40", "42", "44", "46", "48"],
    women: ["2", "4", "6", "8", "10", "12", "14", "16", "18"],
    kids: ["6M", "12M", "18M", "24M", "2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16"]
  };
  
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Size</Label>
      
      <Tabs value={sizeTab} onValueChange={setSizeTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="eu">European</TabsTrigger>
          <TabsTrigger value="us">US</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard" className="w-full">
          <Select value={currentSize} onValueChange={onSizeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select size</SelectItem>
              {standardSizes.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
        
        <TabsContent value="eu" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gender/Age Group</Label>
              <Select defaultValue="men" onValueChange={(value) => console.log(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>EU Size</Label>
              <Select value={currentSize} onValueChange={onSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select size</SelectItem>
                  {euSizes.men.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="us" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gender/Age Group</Label>
              <Select defaultValue="men" onValueChange={(value) => console.log(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>US Size</Label>
              <Select value={currentSize} onValueChange={onSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select size</SelectItem>
                  {usSizes.men.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-2">
        <Label className="text-sm text-gray-600">Custom Size (if not listed above)</Label>
        <Input 
          placeholder="e.g., 48R, 42L, etc." 
          value={customSize} 
          onChange={(e) => onCustomSizeChange(e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );
}
