"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon, type IconName } from "../lib/icons";

export type StyledSelectOption = { value: string; label: string };

type StyledSelectProps = {
  label: string;
  value: string;
  options: StyledSelectOption[];
  onValueChange: (value: string) => void;
  icon?: IconName;
  disabled?: boolean;
};

export function StyledSelect({
  label,
  value,
  options,
  onValueChange,
  icon = "document",
  disabled = false,
}: StyledSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else openMenu();
      return;
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      if (!open) openMenu();
      setActiveIndex((current) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return Math.max(0, options.length - 1);
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (current + direction + options.length) % options.length;
      });
    }
  };

  return (
    <div className="select-field" ref={rootRef}>
      <span className="select-label" id={`${id}-label`}>
        {label}
      </span>
      <div className={`select-control ${open ? "open" : ""}`}>
        <button
          type="button"
          className="select-trigger"
          disabled={disabled || options.length === 0}
          role="combobox"
          aria-autocomplete="none"
          aria-labelledby={id + "-label " + id + "-value"}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={
            open ? `${id}-option-${activeIndex}` : undefined
          }
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKeyDown}
        >
          <span className="select-leading" aria-hidden="true">
            <Icon name={icon} />
          </span>
          <span className="select-value" id={`${id}-value`}>
            {selected?.label ?? "Nenhuma opção disponível"}
          </span>
          <span className="select-chevron" aria-hidden="true">
            <Icon name="chevron" />
          </span>
        </button>
        {open && (
          <ul
            className="select-options"
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            {options.map((option, index) => (
              <li role="none" key={option.value}>
                <button
                  type="button"
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  className={`${index === activeIndex ? "highlighted" : ""} ${option.value === value ? "selected" : ""}`}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Icon name="check" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
