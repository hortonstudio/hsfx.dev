"use client";

import { useEffect, useRef } from "react";
import { Input, Button } from "@/components/ui";
import type { QuestionProps, AddressValue } from "@/lib/onboard/types";

const EMPTY_ADDRESS: AddressValue = {
  street: "",
  city: "",
  state: "",
  zip: "",
};

export function AddressQuestion({
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const streetRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const address: AddressValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as AddressValue)
      : EMPTY_ADDRESS;

  useEffect(() => {
    const timer = setTimeout(() => {
      streetRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const update = (field: keyof AddressValue, fieldValue: string) => {
    onChange({ ...address, [field]: fieldValue });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        onNext();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1.5">
          Street Address
        </label>
        <Input
          ref={streetRef}
          value={address.street}
          onChange={(e) => update("street", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, cityRef)}
          placeholder="123 Main St"
          className="!text-lg !py-4"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            City
          </label>
          <Input
            ref={cityRef}
            value={address.city}
            onChange={(e) => update("city", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, stateRef)}
            placeholder="City"
            className="!text-lg !py-4"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            State
          </label>
          <Input
            ref={stateRef}
            value={address.state}
            onChange={(e) => update("state", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, zipRef)}
            placeholder="State"
            className="!text-lg !py-4"
          />
        </div>
      </div>
      <div className="max-w-[200px]">
        <label className="block text-sm font-medium text-text-muted mb-1.5">
          ZIP Code
        </label>
        <Input
          ref={zipRef}
          value={address.zip}
          onChange={(e) => update("zip", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          placeholder="12345"
          className="!text-lg !py-4"
        />
      </div>
      <div className="pt-2 flex justify-end">
        <Button onClick={onNext} size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
