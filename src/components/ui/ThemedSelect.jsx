import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export const ThemedSelect = forwardRef(function ThemedSelect(
  {
    describedBy,
    invalid = false,
    label,
    labelId,
    onChange,
    options,
    value,
  },
  forwardedRef,
) {
  const generatedId = useId();
  const listboxId = `themed-select-${generatedId}`;
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex] ?? options[0];

  function assignTriggerRef(element) {
    triggerRef.current = element;

    if (typeof forwardedRef === "function") {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleOutsidePointer(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex, isOpen]);

  function chooseOption(option) {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((currentIndex) => {
        const startingIndex = isOpen ? currentIndex : selectedIndex;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (
          (startingIndex + direction + options.length) %
          options.length
        );
      });
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (isOpen) {
        chooseOption(options[highlightedIndex]);
      } else {
        setHighlightedIndex(selectedIndex);
        setIsOpen(true);
      }
    }
  }

  return (
    <div className="themed-select" ref={wrapperRef}>
      <button
        aria-activedescendant={
          isOpen ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        aria-label={label}
        aria-labelledby={labelId}
        className="themed-select-trigger"
        onClick={() => {
          setHighlightedIndex(selectedIndex);
          setIsOpen((currentValue) => !currentValue);
        }}
        onKeyDown={handleKeyDown}
        ref={assignTriggerRef}
        role="combobox"
        type="button"
      >
        <span>{selectedOption?.label ?? ""}</span>
        <i aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          aria-label={labelId ? undefined : label}
          aria-labelledby={labelId}
          className="themed-select-list"
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={`themed-select-option${
                index === highlightedIndex
                  ? " themed-select-option--highlighted"
                  : ""
              }`}
              id={`${listboxId}-option-${index}`}
              key={option.value}
              onClick={() => chooseOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="option"
              tabIndex="-1"
              type="button"
            >
              <span>{option.label}</span>
              {option.value === value && <i aria-hidden="true">✓</i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
