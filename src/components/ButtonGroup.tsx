import { cn } from "@/lib/utils";
import React from "react";

interface ButtonGroupProps {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
}

export function ButtonGroup({ children = [], className }: ButtonGroupProps) {
  const childArray = React.Children.toArray(children);
  const count = childArray.length;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded bg-white shadow-md",
        className,
      )}
    >
      {/* {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            "border-b border-gray-200",
            index === 0 && "rounded-t",
            index === count - 1 && "rounded-b border-b-0",
          )}
        >
          {child}
        </div>
      ))} */}

      {count > 1
        ? childArray.map((child, index) => (
            <div
              key={index}
              className={cn(
                "border-b border-gray-200",
                index === 0 && "rounded-t",
                index === count - 1 && "rounded-b border-b-0",
              )}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
