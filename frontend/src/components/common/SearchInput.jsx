import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="search-input-wrap">
      <Search size={19} aria-hidden="true" />
      <input
        type="search"
        aria-label={placeholder}
        className="search-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
