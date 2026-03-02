import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [initialDebt, setInitialDebt] = useState(10000);
  const [currentDebt, setCurrentDebt] = useState(10000);

  // Load saved data
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("debtData"));
    if (saved) {
      setInitialDebt(saved.initialDebt);
      setCurrentDebt(saved.currentDebt);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(
      "debtData",
      JSON.stringify({ initialDebt, currentDebt })
    );
  }, [initialDebt, currentDebt]);

  const percentageRemaining =
    initialDebt > 0 ? (currentDebt / initialDebt) * 100 : 0;

  return (
    <div className="container">
      <h1>Debt Jar</h1>

      <div className="inputs">
        <label>
          Initial Debt:
          <input
            type="number"
            value={initialDebt}
            onChange={(e) => setInitialDebt(Number(e.target.value))}
          />
        </label>

        <label>
          Current Debt:
          <input
            type="number"
            value={currentDebt}
            onChange={(e) => setCurrentDebt(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="jar">
        <div
          className="jar-fill"
          style={{ height: `${percentageRemaining}%` }}
        />
        <div className="jar-text">
          ${currentDebt.toLocaleString()}
        </div>
      </div>

      <p>{percentageRemaining.toFixed(1)}% Remaining</p>
    </div>
  );
}

export default App;