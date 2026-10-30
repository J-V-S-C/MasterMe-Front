"use client";

import { useId } from "react";
import { Icon, type IconName } from "./icons";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  icon?: IconName | null;
  disabled?: boolean;
  compact?: boolean;
};

export function SelectField({ label, value, options, onValueChange, icon = "document", disabled = false, compact = false }: SelectFieldProps) {
  const id = useId();
  return <div className={`select-field${compact ? " compact" : ""}`}>
    <label className={`select-label${compact ? " sr-only" : ""}`} htmlFor={id}>{label}</label>
    <div className={`select-control${icon ? " with-icon" : ""}`}>
      {icon && <span className="select-leading" aria-hidden="true"><Icon name={icon} /></span>}
      <select id={id} className="select-native" value={value} disabled={disabled || options.length === 0} onChange={(event) => onValueChange(event.currentTarget.value)}>
        {options.length === 0 && <option value="">{label}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span className="select-chevron" aria-hidden="true"><Icon name="chevron" /></span>
    </div>
  </div>;
}
