import { useGeomanControls } from "../hooks/useGeomanControls";
import { useGeomanMeasurements } from "../hooks/useGeomanMeasurements";
import { useGeomanEvents } from "../hooks/useGeomanEvents";

export default function GeomanSetup() {
  useGeomanControls();
  useGeomanMeasurements();
  useGeomanEvents();

  return null;
}
