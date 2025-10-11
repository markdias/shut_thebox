import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import classNames from 'classnames';

type PrimitiveOption = string | number;

export interface DropdownOption<T extends PrimitiveOption = PrimitiveOption> {
  value: T;
  label: string;
}

interface DropdownSelectProps<T extends PrimitiveOption = PrimitiveOption> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function DropdownSelect<T extends PrimitiveOption>({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select',
  className
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() => options.findIndex((option) => option.value === value));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const labelId = useId();
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    if (open) {
      setActiveIndex(options.findIndex((option) => option.value === value));
    }
  }, [open, options, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) {
      return;
    }
    const listbox = listRef.current;
    const activeOption = listbox.children[activeIndex] as HTMLElement | undefined;
    if (activeOption) {
      activeOption.focus();
    }
  }, [open, activeIndex]);

  const commitSelection = (index: number) => {
    const option = options[index];
    if (!option) {
      return;
    }
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const nextIndex = options.findIndex((option) => option.value === value);
      setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitSelection(index);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((previous) => {
        const next = Math.min(options.length - 1, (previous < 0 ? 0 : previous) + 1);
        return next;
      });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((previous) => {
        const next = Math.max(0, (previous < 0 ? 0 : previous) - 1);
        return next;
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={classNames('dropdown-select', className, {
        open,
        disabled
      })}
    >
      <button
        ref={buttonRef}
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((previous) => !previous)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span id={labelId} className="dropdown-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span aria-hidden="true" className="dropdown-chevron">
          ▾
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          className="dropdown-list"
          role="listbox"
          id={listboxId}
          aria-labelledby={labelId}
        >
          {options.map((option, index) => (
            <li
              key={String(option.value)}
              role="option"
              tabIndex={-1}
              aria-selected={option.value === value}
              className={classNames('dropdown-option', {
                selected: option.value === value,
                active: index === activeIndex
              })}
              onMouseDown={(event) => {
                event.preventDefault();
                commitSelection(index);
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DropdownSelect;
