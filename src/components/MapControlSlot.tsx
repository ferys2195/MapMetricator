interface MapControlSlotProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
}

const positionClass = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
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
