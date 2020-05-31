import React, { useRef, useState, useMemo } from 'react';
import classNames from 'classnames';
import { useOutsideAlerter, clamp, addEventListeners, Keys } from '~/utils';

export interface SliderProps {
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider = ({
  value,
  maxValue,
  className,
  onChange,
}: SliderProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hide, setHide] = useState(true);

  useOutsideAlerter(
    ref,
    React.useCallback(() => {
      if (!hide) {
        setHide(true);
      }
    }, [hide]),
  );

  const left = useMemo(() => `${(value / maxValue) * 100}%`, [value]);

  return (
    <div
      ref={ref}
      className={classNames(
        'flex items-center justify-center group',
        className,
      )}
    >
      <div className="py-1 relative min-w-full">
        <div className="h-1 bg-gray-500 rounded-full">
          <div
            className="absolute h-1 rounded-full bg-gray-200 w-0"
            style={{ width: left }}
          ></div>
          <div
            title={'' + value}
            // We use opacity since using display none or visibility hidden removes the ability
            // to tab to this element :) See https://stackoverflow.com/a/51408521
            className={classNames(
              'absolute h-3 w-3 flex items-center justify-center rounded-full bg-secondary-400 shadow border border-secondary-600 -ml-2 top-0 cursor-pointer group-hover:opacity-100',
              hide ? 'opacity-0' : 'opacity-100',
            )}
            // Whether the user clicks or tabs to this, show it!!
            onFocus={() => setHide(false)}
            style={{ left: left }}
            // Make it tabbable
            tabIndex={0}
            onKeyDown={(e) => {
              let newValue: number | undefined;
              // FIXME make this faster / customizable
              // For e.g. the volume should not just be 1 at a time
              switch (e.which) {
                case Keys.Right:
                  newValue = value + 1;
                  break;
                case Keys.Left:
                  newValue = value - 1;
                  break;
              }

              if (newValue !== undefined) {
                onChange(clamp(newValue, 0, maxValue));
              }
            }}
            onMouseDown={() => {
              // setHide(false);
              const disposer = addEventListeners({
                mousemove: (e) => {
                  if (!ref.current) {
                    return;
                  }

                  const { left, width } = ref.current.getBoundingClientRect();
                  const newValue = Math.round(
                    clamp((e.clientX - left) / width, 0, 1) * maxValue,
                  );
                  onChange(newValue);
                },
                mouseup: () => {
                  disposer.dispose();
                },
              });
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
