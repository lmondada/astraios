interface Props {
  className?: string;
  options: {
    url: string;
    name: string;
  }[];
  value: string;
  onChange: (newUrl: string) => void;
}

export const WorkerDropdown: React.FC<Props> = ({
  className,
  options,
  value,
  onChange,
}) => {
  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.url} value={option.url}>
          {option.name}
        </option>
      ))}
    </select>
  );
};
