import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [debts, setDebts] = useState([]);
  const [expectedPayoffDate, setExpectedPayoffDate] = useState("");
  const [actualPayoffDate, setActualPayoffDate] = useState(null);
  // sorting direction for amounts: "asc" | "desc" | null
  const [sortDirection, setSortDirection] = useState(null);
  // track the debt currently being edited (null when not editing)
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({
    name: "",
    originalAmount: "",
    minPayment: "",
    snowballPayment: "",
    currentAmount: "",
  });
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
      setExpectedPayoffDate(saved.expectedPayoffDate || "");
      setActualPayoffDate(saved.actualPayoffDate || null);
      // originalTotalDebt is derived, so no need to restore it separately
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      "snowballData",
      JSON.stringify({ debts, expectedPayoffDate, actualPayoffDate })
    );
  }, [debts, expectedPayoffDate, actualPayoffDate]);

  const handleChange = (e) => {
    setNewDebt({
      ...newDebt,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditChange = (e) => {
    setEditingValues({
      ...editingValues,
      [e.target.name]: e.target.value,
    });
  };

  const startEditing = (debt) => {
    setEditingId(debt.id);
    setEditingValues({
      name: debt.name,
      originalAmount: debt.originalAmount,
      minPayment: debt.minPayment,
      snowballPayment: debt.snowballPayment,
      currentAmount: debt.currentAmount,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    setDebts((prev) =>
      prev.map((d) =>
        d.id === editingId
          ? {
            ...d,
            name: editingValues.name,
            originalAmount: Number(editingValues.originalAmount),
            minPayment: Number(editingValues.minPayment) || 0,
            snowballPayment: Number(editingValues.snowballPayment) || 0,
            currentAmount: Number(editingValues.currentAmount),
          }
          : d
      )
    );
    cancelEditing();
  };

  const deleteDebt = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) {
      cancelEditing();
    }
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

  const totalMinPayment = debts.reduce(
    (sum, debt) => sum + debt.minPayment,
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

  // prepare sorted debts list based on sortDirection
  const sortedDebts = [...debts];
  if (sortDirection === "asc") {
    sortedDebts.sort((a, b) => a.originalAmount - b.originalAmount);
  } else if (sortDirection === "desc") {
    sortedDebts.sort((a, b) => b.originalAmount - a.originalAmount);
  }

  const jarFillPercentage =
    originalTotalDebt > 0 ? (totalPaid / originalTotalDebt) * 100 : 0;

  // Track when all debts are paid (actualPayoffDate)
  useEffect(() => {
    if (totalCurrentDebt === 0 && debts.length > 0 && !actualPayoffDate) {
      // Set actual payoff date to today when all debts are paid
      const today = new Date().toISOString().split('T')[0];
      setActualPayoffDate(today);
    } else if (totalCurrentDebt > 0 && actualPayoffDate) {
      // Reset if debt is added back after being fully paid
      setActualPayoffDate(null);
    }
  }, [totalCurrentDebt, debts.length, actualPayoffDate]);

  return (
    <div className="container" style={{ display: "flex", gap: "3rem" }}>
      <div style={{ flex: 1 }}>
        <h1>Debt Jar</h1>

        {/* Original Total Section */}
        {/* originalTotalDebt is calculated automatically from debts */}
        <div>
          <strong>Original Total Debt: </strong>${originalTotalDebt.toLocaleString()}
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Total Minimum Payment: </strong>${totalMinPayment.toLocaleString()}
        </div>

        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#646262", borderRadius: "8px" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              <strong>Expected Payoff Date:</strong>
              <input
                type="date"
                value={expectedPayoffDate}
                onChange={(e) => setExpectedPayoffDate(e.target.value)}
                style={{ marginLeft: "0.5rem" }}
              />
            </label>
          </div>
          <div>
            <strong>Actual Payoff Date:</strong>
            <span style={{ marginLeft: "0.5rem" }}>
              {actualPayoffDate
                ? new Date(actualPayoffDate).toLocaleDateString()
                : "Not yet paid off"}
            </span>
          </div>
        </div>

        <hr />

        {/* Add Debt Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addDebt();
          }}
        >
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

          <button type="submit">Add Debt</button>
        </form>

        <hr />

        {/* Sorting Controls */}
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Order by amount:
            <select
              value={sortDirection || ""}
              onChange={(e) =>
                setSortDirection(e.target.value || null)
              }
              style={{ marginLeft: "0.5rem" }}
            >
              <option value="">None</option>
              <option value="asc">Smallest → Largest</option>
              <option value="desc">Largest → Smallest</option>
            </select>
          </label>
        </div>

        <hr />

        {/* Debt Table */}
        <table
          border="1"
          width="100%"
          style={{
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr>
              <th style={{ minWidth: "150px", wordWrap: "break-word" }}>Debt Name</th>
              <th>Amount Owed</th>
              <th>Min Payment</th>
              <th>Snowball Payment</th>
              <th>Current Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDebts.map((debt) => (
              <tr
                key={debt.id}
                style={{
                  textDecoration:
                    debt.currentAmount === 0 ? "line-through" : "none",
                }}
              >
                {editingId === debt.id ? (
                  <>
                    <td>
                      <input
                        name="name"
                        value={editingValues.name}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="originalAmount"
                        type="number"
                        value={editingValues.originalAmount}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="minPayment"
                        type="number"
                        value={editingValues.minPayment}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="snowballPayment"
                        type="number"
                        value={editingValues.snowballPayment}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="currentAmount"
                        type="number"
                        value={editingValues.currentAmount}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
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
                    <td>
                      <button onClick={() => startEditing(debt)}>
                        Edit
                      </button>
                      <button
                        style={{ marginLeft: "0.5rem" }}
                        onClick={() => deleteDebt(debt.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
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

      {/* Jar Visualization on the Right */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "120px",
            height: "250px",
            border: "4px solid #333",
            borderRadius: "10px 10px 20px 20px",
            backgroundColor: "#f5f5f5",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Jar Lid */}
          <div
            style={{
              position: "absolute",
              top: "-10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "100px",
              height: "10px",
              backgroundColor: "#333",
              borderRadius: "5px",
              zIndex: 10,
            }}
          ></div>

          {/* Liquid Fill */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${jarFillPercentage}%`,
              backgroundColor: "#4CAF50",
              transition: "height 0.5s ease",
              opacity: 0.85,
            }}
          ></div>

          {/* Percentage Text in Jar */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "18px",
              fontWeight: "bold",
              color: jarFillPercentage > 50 ? "#fff" : "#333",
              textShadow: jarFillPercentage > 50 ? "none" : "1px 1px 2px rgba(0,0,0,0.2)",
              zIndex: 5,
            }}
          >
            {jarFillPercentage.toFixed(0)}%
          </div>
        </div>
        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "14px" }}>
          <strong>Paid Off</strong>
        </p>
      </div>
    </div>
  );
}

export default App;
