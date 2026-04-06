import { TooltipProvider } from "./components/ui/tooltip";
import { useIsMobile } from "./hooks/use-mobile";
import IndexPage from "./pages";

function App() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <p className="text-muted-foreground text-center text-lg">
          Website is not supported on mobile
        </p>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <IndexPage />
    </TooltipProvider>
  );
}

export default App;
