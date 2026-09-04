import { useState } from "react";
import { checkSystem, Category } from "../api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function Lab01App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to connect to TokTickIT API"
      );
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button
        className="btn btn-success mb-4"
        onClick={handleCheck}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "loading" && (
        <div className="text-muted" role="status">
          ⏳ Loading…
        </div>
      )}

      {state === "success" && (
        <div className="mt-3">
          <p className="fw-semibold mb-3">
            System Status: <span className="text-success">Online</span>
          </p>
          {categories.length > 0 && (
            <div>
              <h2 className="h6 fw-bold">Supported Request Categories:</h2>
              <ol className="list-group list-group-numbered">
                {categories.map((cat) => (
                  <li key={cat.id} className="list-group-item">
                    {cat.name}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="mt-3">
          <p className="fw-semibold text-danger mb-1">
            System Status: <span>Offline</span>
          </p>
          <p className="text-danger">{errorMessage || "Unable to connect to TokTickIT API"}</p>
        </div>
      )}
    </div>
  );
}
