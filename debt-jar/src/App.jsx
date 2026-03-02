import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [debts, setDebts] = useState([]);
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("debts"));
    if (saved) {
      setDebts(saved);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("debts", JSON.stringify(debts));
  }, [debts]);

  const addDebt = () => {
    if (!newDebtName || !newDebtAmount) return;

    const amount = Number(newDebtAmount);

    const newDebt = {
      id: Date.now(),
      name: newDebtName,
      initialAmount: amount,
      currentAmount: amount,
    };

    setDebts((prev) => [...prev, newDebt]);
    setNewDebtName("");
    setNewDebtAmount("");
  };

  const updateDebt = (id, newAmount) => {
    setDebts((prev) =>
      prev.map((debt) =>
        debt.id === id
          ? {
            ...debt,
            currentAmount: newAmount < 0 ? 0 : newAmount,
          }
          : debt
      )
    );
  };

  // Derived totals
  const totalInitialDebt = debts.reduce(
    (sum, debt) => sum + debt.initialAmount,
    0
  );

  const totalCurrentDebt = debts.reduce(
    (sum, debt) => sum + debt.currentAmount,
    0
  );

  const percentageRemaining =
    totalInitialDebt > 0
      ? (totalCurrentDebt / totalInitialDebt) * 100
      : 0;

  return (
    <div className="container">
      <h1>Debt Jar</h1>

      {/* Add Debt Section */}
      <div className="add-debt">
        <input
          type="text"
          placeholder="Debt Name"
          value={newDebtName}
          onChange={(e) => setNewDebtName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={newDebtAmount}
          onChange={(e) => setNewDebtAmount(e.target.value)}
        />

        <button onClick={addDebt}>Add</button>
      </div>

      {/* Debt List */}
      <div className="debt-list">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={`debt-item ${debt.currentAmount === 0 ? "paid" : ""
              }`}
          >
            <span>{debt.name}</span>

            <input
              type="number"
              value={debt.currentAmount}
              onChange={(e) =>
                updateDebt(debt.id, Number(e.target.value))
              }
            />
          </div>
        ))}
      </div>

      {/* Jar Visualization */}
      <div className="jar">
        <div
          className="jar-fill"
          style={{ height: `${percentageRemaining}%` }}
        />
        <div className="jar-text">
          ${totalCurrentDebt.toLocaleString()}
        </div>
      </div>

      <p>{percentageRemaining.toFixed(1)}% Remaining</p>
    </div>
  );
}

export default App;