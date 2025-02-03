import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PostFormHeaderProps {
  title: string;
  category: string;
  condition: string;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onConditionChange: (value: string) => void;
}

const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Clothing",
  "Books",
  "Home & Garden",
  "Shoes",
  "Toys",
  "Children's Clothing",
  "Other",
];

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Well Loved",
];

export function PostFormHeader({
  title,
  category,
  condition,
  onTitleChange,
  onCategoryChange,
  onConditionChange,
}: PostFormHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="What are you giving away?"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="condition" className="text-sm font-medium">
          Condition
        </label>
        <Select
          value={condition}
          onValueChange={onConditionChange}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((cond) => (
              <SelectItem key={cond} value={cond}>
                {cond}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}