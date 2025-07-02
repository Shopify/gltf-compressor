import { ChevronDown, ChevronUp } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Button } from './button';
import { Input } from './input';

export interface NumberInputProps
  extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number; // Controlled value
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
  disabled?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState<number | undefined>(
      controlledValue ?? defaultValue
    );

    const handleIncrement = useCallback(() => {
      setValue((prev) => {
        const newValue = prev === undefined ? stepper ?? 1 : Math.min(prev + (stepper ?? 1), max);
        if (onValueChange) {
          onValueChange(newValue);
        }
        return newValue;
      });
    }, [stepper, max, onValueChange]);

    const handleDecrement = useCallback(() => {
      setValue((prev) => {
        const newValue = prev === undefined
          ? -(stepper ?? 1)
          : Math.max(prev - (stepper ?? 1), min);
        if (onValueChange) {
          onValueChange(newValue);
        }
        return newValue;
      });
    }, [stepper, min, onValueChange]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          !disabled &&
          document.activeElement ===
          (ref as React.RefObject<HTMLInputElement>).current
        ) {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleIncrement();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDecrement();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleIncrement, handleDecrement, ref, disabled]);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue;
      setValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min);
          if (onValueChange) {
            onValueChange(min);
          }
        } else if (value > max) {
          setValue(max);
          if (onValueChange) {
            onValueChange(max);
          }
        }
      }
    };

    return (
      <div className="flex items-center">
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-r-none relative"
          getInputRef={ref}
          disabled={disabled}
          {...props}
        />

        <div className="flex flex-col">
          <Button
            type="button"
            aria-label="Increase value"
            className="px-2 h-5 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleIncrement}
            disabled={disabled || value === max}
          >
            <ChevronUp size={15} />
          </Button>
          <Button
            type="button"
            aria-label="Decrease value"
            className="px-2 h-5 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleDecrement}
            disabled={disabled || value === min}
          >
            <ChevronDown size={15} />
          </Button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';