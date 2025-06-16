
import React from "react";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/profile/address/AddressInput";
import type { CreatePostInput } from "@/types/post";

interface PostFormLocationProps {
  formData: CreatePostInput;
  setFormData: (formData: CreatePostInput | ((prev: CreatePostInput) => CreatePostInput)) => void;
  onAddressSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
}

export function PostFormLocation({
  formData,
  setFormData,
  onAddressSelect,
}: PostFormLocationProps) {
  const isRequest = formData.item_type === 'request';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {isRequest ? "Sökområde" : "Plats"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isRequest 
            ? "Ange var du söker efter varan"
            : "Ange var varan kan hämtas"
          }
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">
            {isRequest ? "Sökområde *" : "Plats *"}
          </Label>
          <AddressInput
            value={formData.location}
            onChange={(address, coordinates) => {
              setFormData(prev => ({ 
                ...prev, 
                location: address,
                coordinates: coordinates || null
              }));
              if (onAddressSelect && coordinates) {
                onAddressSelect(address, coordinates);
              }
            }}
          />
        </div>

        {isRequest ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ange ditt sökområde (inom 2 km från denna punkt söker du efter varan)
            </p>
            <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <strong>💡 Tips:</strong> Du söker inom 2 km från denna punkt. Personer som har det du söker i närheten kommer att kunna se din önskning.
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <p><strong>💡 Tips:</strong> Ange en tydlig plats där intresserade kan hämta varan. Detta gör det lättare för dem att bedöma om de kan hämta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
