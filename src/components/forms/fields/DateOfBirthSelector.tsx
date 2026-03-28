
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
import { useTranslation } from "react-i18next";

interface DateOfBirthSelectorProps {
  dateOfBirth?: Date;
  onChange: (date: Date | undefined) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const monthKeys = [
  "profile.month_january", "profile.month_february", "profile.month_march",
  "profile.month_april", "profile.month_may", "profile.month_june",
  "profile.month_july", "profile.month_august", "profile.month_september",
  "profile.month_october", "profile.month_november", "profile.month_december"
];

export function DateOfBirthSelector({ dateOfBirth, onChange }: DateOfBirthSelectorProps) {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null) {
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const days = Array.from({ length: lastDay }, (_, i) => i + 1);
      setDaysInMonth(days);
      
      if (selectedDay !== null && selectedDay > lastDay) {
        setSelectedDay(null);
      }
    } else {
      setDaysInMonth([]);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    if (selectedYear !== null && selectedMonth !== null && selectedDay !== null) {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      onChange(newDate);
    } else if (selectedYear === null && selectedMonth === null && selectedDay === null) {
      onChange(undefined);
    }
  }, [selectedYear, selectedMonth, selectedDay, onChange]);

  return (
    <div className="space-y-2">
      <Label>{t('profile.date_of_birth')}</Label>
      <div className="grid grid-cols-3 gap-4">
        <Select 
          value={selectedYear?.toString()} 
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('profile.year')} />
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
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('profile.month')} />
          </SelectTrigger>
          <SelectContent>
            {monthKeys.map((key, index) => (
              <SelectItem key={index} value={index.toString()}>
                {t(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedDay?.toString()}
          onValueChange={(value) => setSelectedDay(parseInt(value))}
          disabled={selectedYear === null || selectedMonth === null}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('profile.day')} />
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
