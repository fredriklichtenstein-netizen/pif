
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateOfBirthSelectorProps {
  dateOfBirth?: Date;
  onChange: (date: Date | undefined) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DateOfBirthSelector({ dateOfBirth, onChange }: DateOfBirthSelectorProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(
    dateOfBirth ? dateOfBirth.getFullYear() : null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    dateOfBirth ? dateOfBirth.getMonth() : null
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedMonth !== null) {
      const newDate = new Date(year, selectedMonth, 1);
      onChange(newDate);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    if (selectedYear !== null) {
      const newDate = new Date(selectedYear, month, 1);
      onChange(newDate);
    }
  };

  return (
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
                !dateOfBirth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateOfBirth ? (
                format(dateOfBirth, "PPP")
              ) : (
                <span>Pick a day</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateOfBirth}
              onSelect={(date) => {
                onChange(date);
                setCalendarOpen(false);
              }}
              defaultMonth={new Date(selectedYear, selectedMonth)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
