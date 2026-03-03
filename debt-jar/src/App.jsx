import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [debts, setDebts] = useState([]);
  // originalTotalDebt is derived from the debts list, so we don't keep it in state
  const [newDebt, setNewDebt] = useState({
    name: "",
    amount: "",
    minPayment: "",
    snowballPayment: "",
  });

  // Load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("snowballData"));
    if (saved) {
      setDebts(saved.debts);
      // originalTotalDebt is derived, so no need to restore it separately
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      "snowballData",
      JSON.stringify({ debts })
    );
  }, [debts]);

  const handleChange = (e) => {
    setNewDebt({
      ...newDebt,
      [e.target.name]: e.target.value,
    });
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.amount) return;

    const amount = Number(newDebt.amount);

    const debtToAdd = {
      id: Date.now(),
      name: newDebt.name,
      originalAmount: amount,
      currentAmount: amount,
      minPayment: Number(newDebt.minPayment) || 0,
      snowballPayment: Number(newDebt.snowballPayment) || 0,
    };

    setDebts((prev) => [...prev, debtToAdd]);

    setNewDebt({
      name: "",
      amount: "",
      minPayment: "",
      snowballPayment: "",
    });
  };

  const updateCurrentAmount = (id, newAmount) => {
    setDebts((prev) =>
      prev.map((debt) =>
        debt.id === id
          ? { ...debt, currentAmount: newAmount < 0 ? 0 : newAmount }
          : debt
      )
    );
  };

  const totalCurrentDebt = debts.reduce(
    (sum, debt) => sum + debt.currentAmount,
    0
  );

  const totalPaid = debts.reduce(
    (sum, debt) => sum + (debt.originalAmount - debt.currentAmount),
    0
  );

  // compute original total debt from the list
  const originalTotalDebt = debts.reduce(
    (sum, debt) => sum + debt.originalAmount,
    0
  );

  const percentageRemaining =
    originalTotalDebt > 0
      ? (totalCurrentDebt / originalTotalDebt) * 100
      : 0;

  return (
    <div className="container">
      <h1>Debt Jar</h1>

      {/* Original Total Section */}
      {/* originalTotalDebt is calculated automatically from debts */}
      <div>
        <strong>Original Total Debt: </strong>${originalTotalDebt.toLocaleString()}
      </div>

      <hr />

      {/* Add Debt Form */}
      <div>
        <input
          name="name"
          placeholder="Debt Name"
          value={newDebt.name}
          onChange={handleChange}
        />
        <input
          name="amount"
          type="number"
          placeholder="Amount Owed"
          value={newDebt.amount}
          onChange={handleChange}
        />
        <input
          name="minPayment"
          type="number"
          placeholder="Min Payment"
          value={newDebt.minPayment}
          onChange={handleChange}
        />
        <input
          name="snowballPayment"
          type="number"
          placeholder="Snowball Payment"
          value={newDebt.snowballPayment}
          onChange={handleChange}
        />

        <button onClick={addDebt}>Add Debt</button>
      </div>

      <hr />

      {/* Debt Table */}
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Debt Name</th>
            <th>Amount Owed</th>
            <th>Min Payment</th>
            <th>Snowball Payment</th>
            <th>Current Balance</th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => (
            <tr
              key={debt.id}
              style={{
                textDecoration:
                  debt.currentAmount === 0 ? "line-through" : "none",
              }}
            >
              <td>{debt.name}</td>
              <td>${debt.originalAmount}</td>
              <td>${debt.minPayment}</td>
              <td>${debt.snowballPayment}</td>
              <td>
                <input
                  type="number"
                  value={debt.currentAmount}
                  onChange={(e) =>
                    updateCurrentAmount(
                      debt.id,
                      Number(e.target.value)
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* Totals */}
      <h3>Total Remaining: ${totalCurrentDebt.toLocaleString()}</h3>
      <h3>Total Paid: ${totalPaid.toLocaleString()}</h3>
      <h3>
        {percentageRemaining.toFixed(1)}% Remaining
      </h3>
    </div>
  );
}

export default App;