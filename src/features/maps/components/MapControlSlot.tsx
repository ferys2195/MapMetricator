interface MapControlSlotProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
}

const positionClass = {
  "top-left": "top-[10px] left-[10px]",
  "top-right": "top-[10px] right-[10px]",
  "bottom-left": "bottom-[10px] left-[10px]",
  "bottom-right": "bottom-[20px] right-[10px]",
};

const MapControlSlot = ({ position, children }: MapControlSlotProps) => {
  return (
    <div
      className={`pointer-events-auto absolute z-[1100] space-y-2 ${positionClass[position]}`}
    >
      {children}
    </div>
  );
};

export default MapControlSlot;
