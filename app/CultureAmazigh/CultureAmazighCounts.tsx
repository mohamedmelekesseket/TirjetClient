"use client";

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

interface CultureCount {
  type: string;
  count: number;
}

interface CountsContextValue {
  counts: Map<string, number>;
  status: "loading" | "success" | "error";
}

const CountsContext = createContext<CountsContextValue | null>(null);
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function isCultureCount(value: unknown): value is CultureCount {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    "count" in value &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count >= 0
  );
}

function isCountsResponse(value: unknown): value is { counts: CultureCount[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "counts" in value &&
    Array.isArray(value.counts) &&
    value.counts.every(isCultureCount)
  );
}

export function CultureAmazighCountsProvider({ children }: PropsWithChildren) {
  const [counts, setCounts] = useState<Map<string, number>>(() => new Map());
  const [status, setStatus] = useState<CountsContextValue["status"]>("loading");

  useEffect(() => {
    const controller = new AbortController();

    const loadCounts = async () => {
      try {
        const response = await fetch(`${API}/api/culture-amazigh/counts`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Could not load Culture Amazigh counts (${response.status})`);
        }

        const payload: unknown = await response.json();
        if (!isCountsResponse(payload)) {
          throw new Error("The Culture Amazigh count response has an invalid shape");
        }

        setCounts(new Map(payload.counts.map(({ type, count }) => [type, count])));
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load Culture Amazigh category counts", error);
        setStatus("error");
      }
    };

    void loadCounts();
    return () => controller.abort();
  }, []);

  return <CountsContext.Provider value={{ counts, status }}>{children}</CountsContext.Provider>;
}

export function CultureCategoryCount({
  type,
  isResource = false,
}: {
  type: string;
  isResource?: boolean;
}) {
  const context = useContext(CountsContext);
  if (!context) {
    throw new Error("CultureCategoryCount must be used inside CultureAmazighCountsProvider");
  }

  const count = context.counts.get(type);
  let label = "Chargement…";
  if (context.status === "error" || (context.status === "success" && count === undefined)) {
    label = "Indisponible";
  } else if (context.status === "success") {
    const unit = isResource ? "ressource" : "article";
    label = `${count} ${unit}${count === 1 ? "" : "s"}`;
  }

  return (
    <span
      className="cult-cat-count"
      title={label === "Indisponible" ? "Impossible de charger ce nombre depuis la base de données." : undefined}
    >
      {label}
    </span>
  );
}
