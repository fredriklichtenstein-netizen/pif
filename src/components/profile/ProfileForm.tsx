
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressInput } from "./AddressInput";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PhoneInput } from "./PhoneInput";
import { useState } from "react";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  address: string;
  dateOfBirth?: Date;
  countryCode: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  onChange: (data: Partial<ProfileFormData>) => void;
}

const genderOptions = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "transgender", label: "Transgender" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ProfileForm({ formData, onChange }: ProfileFormProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(
    formData.dateOfBirth ? formData.dateOfBirth.getFullYear() : null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    formData.dateOfBirth ? formData.dateOfBirth.getMonth() : null
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedMonth !== null) {
      const newDate = new Date(year, selectedMonth, 1);
      onChange({ dateOfBirth: newDate });
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    if (selectedYear !== null) {
      const newDate = new Date(selectedYear, month, 1);
      onChange({ dateOfBirth: newDate });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => onChange({ gender: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone number</Label>
              <PhoneInput
                value={formData.phone}
                countryCode={formData.countryCode}
                onPhoneChange={(phone, countryCode) => 
                  onChange({ phone, countryCode })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Date of birth (optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select value={selectedYear?.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedMonth !== null ? selectedMonth.toString() : undefined}
                  onValueChange={(value) => handleMonthChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedYear && selectedMonth !== null && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth ? (
                        format(formData.dateOfBirth, "PPP")
                      ) : (
                        <span>Pick a day</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfBirth}
                      onSelect={(date) => {
                        onChange({ dateOfBirth: date });
                        setCalendarOpen(false);
                      }}
                      defaultMonth={new Date(selectedYear, selectedMonth)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div>
              <Label htmlFor="address">Home address</Label>
              <AddressInput
                value={formData.address}
                onChange={(address) => onChange({ address })}
                locationButtonLabel="Set location on map"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
