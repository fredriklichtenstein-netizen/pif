
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
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
  const [selectedDay, setSelectedDay] = useState<number | null>(
    dateOfBirth ? dateOfBirth.getDate() : null
  );
  const [daysInMonth, setDaysInMonth] = useState<number[]>([]);

  // Update days in month when year or month changes
  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null) {
      // Get number of days in the selected month
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const days = Array.from({ length: lastDay }, (_, i) => i + 1);
      setDaysInMonth(days);
      
      // If currently selected day is invalid for the new month, reset it
      if (selectedDay !== null && selectedDay > lastDay) {
        setSelectedDay(null);
      }
    } else {
      setDaysInMonth([]);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Update the date whenever any part changes
  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      onChange(newDate);
    } else if (selectedYear === null && selectedMonth === null && selectedDay === null) {
      // Only clear if all values are null
      onChange(undefined);
    }
  }, [selectedYear, selectedMonth, selectedDay, onChange]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
  };

  return (
    <div className="space-y-2">
      <Label>Date of birth (optional)</Label>
      <div className="grid grid-cols-3 gap-4">
        <Select 
          value={selectedYear?.toString()} 
          onValueChange={(value) => handleYearChange(parseInt(value))}
        >
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

        <Select 
          value={selectedDay?.toString()}
          onValueChange={(value) => handleDayChange(parseInt(value))}
          disabled={selectedYear === null || selectedMonth === null}
        >
          <SelectTrigger>
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent>
            {daysInMonth.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
