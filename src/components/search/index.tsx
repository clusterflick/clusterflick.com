import Input from "rsuite/cjs/Input";
import InputGroup from "rsuite/cjs/InputGroup";
import SearchIcon from "@rsuite/icons/Search";
import CloseIcon from "@rsuite/icons/Close";

export default function Search({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <InputGroup inside>
      <InputGroup.Addon>
        <SearchIcon />
      </InputGroup.Addon>
      <Input
        size="lg"
        placeholder="Search"
        value={value}
        onChange={(value) => onChange(value)}
      />
      <InputGroup.Button onClick={() => onChange("")}>
        <CloseIcon />
      </InputGroup.Button>
    </InputGroup>
  );
}
