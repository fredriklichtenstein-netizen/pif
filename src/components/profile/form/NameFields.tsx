
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NameFieldsProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
}

export function NameFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}: NameFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => onFirstNameChange(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => onLastNameChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
