import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getStaticPortfolioProjects, loadPortfolioProjects } from "@/lib/portfolio";

export function usePortfolioProjects() {
  const [portfolioProjects, setPortfolioProjects] = useState(getStaticPortfolioProjects);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPortfolioProjects(await loadPortfolioProjects());
      return true;
    } catch (error) {
      console.error("Could not load portfolio photos.", error);
      toast.error("Couldn't load the portfolio photos. Showing the saved default photos.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects: portfolioProjects, loading, refresh };
}
