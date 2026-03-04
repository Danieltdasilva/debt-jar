import { useState, useEffect, useRef } from "react";
import "./App.css";
import { migrateDataToMongoDB } from "./utils/migration";
import { api } from "./utils/api";

function App() {
  // Create ref for debt name input to focus after adding
  const debtNameRef = useRef(null);

  const [debts, setDebts] = useState([]);
  const [expectedPayoffDate, setExpectedPayoffDate] = useState("");
  const [sortDirection, setSortDirection] = useState(null);
  const [payoffMonths, setPayoffMonths] = useState("");

  // Load debts from API
  const loadDebts = async () => {
    try {
      const debtsData = await api.getDebts();
      setDebts(debtsData);
    } catch (error) {
      console.error("Failed to load debts:", error);
    }
  };

  // Run migration script on component mount, then load debts
  useEffect(() => {
    const initializeApp = async () => {
      await migrateDataToMongoDB();
      await loadDebts();
    };
    initializeApp();
  }, []);

  // sorting direction for amounts: "asc" | "desc" | null
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
    setEditingId(debt._id);
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

  const saveEdit = async () => {
    try {
      const updatedDebt = await api.updateDebt(editingId, {
        name: editingValues.name,
        originalAmount: Number(editingValues.originalAmount),
        minPayment: Number(editingValues.minPayment) || 0,
        snowballPayment: Number(editingValues.snowballPayment) || 0,
        currentAmount: Number(editingValues.currentAmount),
      });

      // Update local state
      setDebts((prev) =>
        prev.map((d) =>
          d._id === editingId ? updatedDebt : d
        )
      );
      cancelEditing();
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const deleteDebt = async (id) => {
    try {
      await api.deleteDebt(id);
      // Update local state
      setDebts((prev) => prev.filter((d) => d._id !== id));
      if (editingId === id) {
        cancelEditing();
      }
    } catch (error) {
      console.error("Failed to delete debt:", error);
    }
  };

  const addDebt = async () => {
    if (!newDebt.name || !newDebt.amount) return;

    const amount = Number(newDebt.amount);
    const months = payoffMonths ? Number(payoffMonths) : 0;

    // Auto-calculate min payment if payoff months is set
    const calculatedMinPayment = months > 0 ? Math.round((amount / months) * 100) / 100 : Number(newDebt.minPayment) || 0;

    try {
      const newDebtData = await api.createDebt({
        name: newDebt.name,
        originalAmount: amount,
        currentAmount: amount,
        minPayment: calculatedMinPayment,
        snowballPayment: Number(newDebt.snowballPayment) || 0,
      });

      // Add the new debt to local state
      setDebts((prev) => [...prev, newDebtData]);

      setNewDebt({
        name: "",
        amount: "",
        minPayment: "",
        snowballPayment: "",
      });

      // Focus back to debt name input after adding
      if (debtNameRef.current) {
        debtNameRef.current.focus();
      }
    } catch (error) {
      console.error("Failed to add debt:", error);
    }
  };

  const updateCurrentAmount = async (id, newAmount) => {
    try {
      const updatedDebt = await api.updateDebt(id, {
        currentAmount: newAmount < 0 ? 0 : newAmount,
      });

      // Update local state
      setDebts((prev) =>
        prev.map((debt) =>
          debt._id === id
            ? updatedDebt
            : debt
        )
      );
    } catch (error) {
      console.error("Failed to update current amount:", error);
    }
  };

  const totalCurrentDebt = debts.reduce(
    (sum, debt) => sum + debt.currentAmount,
    0
  );

  // Compute actual payoff date as derived value
  const actualPayoffDate = totalCurrentDebt === 0 && debts.length > 0
    ? new Date().toISOString().split('T')[0]
    : null;

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


  // Recalculate all min payments when payoff timeline changes
  useEffect(() => {
    if (payoffMonths && Number(payoffMonths) > 0) {
      const updateMinPayments = async () => {
        try {
          const updatedDebts = [];
          for (const debt of debts) {
            const newMinPayment = Math.round((debt.originalAmount / Number(payoffMonths)) * 100) / 100;
            const updatedDebt = await api.updateDebt(debt._id, { minPayment: newMinPayment });
            updatedDebts.push(updatedDebt);
          }
          setDebts(updatedDebts);
        } catch (error) {
          console.error("Failed to update min payments:", error);
        }
      };
      updateMinPayments();
    }
  }, [payoffMonths, debts]);

  return (
    <div className="container">
      <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ flex: 1, minWidth: "600px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ position: "sticky", top: 0, backgroundColor: "rgba(26, 26, 46, 0.95)", paddingBottom: "1rem", zIndex: 10, borderBottom: "2px solid #00d4ff", backdropFilter: "blur(10px)" }}>
            <h1>Debt Jar</h1>

            {/* Original Total Section */}
            {/* originalTotalDebt is calculated automatically from debts */}
            <div>
              <strong>Original Total Debt: </strong>${originalTotalDebt.toLocaleString()}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Total Minimum Payment: </strong>${totalMinPayment.toLocaleString()}
            </div>

            {/* row containing timeline, dates, and small jar */}
            <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: "1 1 auto" }}>
                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(26, 26, 46, 0.8)", borderRadius: "12px", border: "1px solid rgba(0, 212, 255, 0.3)", backdropFilter: "blur(10px)", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
                  <label>
                    <strong>Payoff Timeline (months):</strong>
                    <input
                      type="number"
                      min="1"
                      value={payoffMonths}
                      onChange={(e) => setPayoffMonths(e.target.value)}
                      placeholder="e.g., 6"
                      style={{ marginLeft: "0.5rem", width: "80px" }}
                    />
                  </label>
                  {payoffMonths && Number(payoffMonths) > 0 && (
                    <p style={{ marginTop: "0.5rem", fontSize: "14px", color: "#ff6b6b" }}>
                      Minimum payments will be auto-calculated based on this timeline.
                    </p>
                  )}
                </div>

                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "rgba(26, 26, 46, 0.8)", borderRadius: "12px", border: "1px solid rgba(0, 212, 255, 0.3)", backdropFilter: "blur(10px)", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)" }}>
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
              </div>
              <div className="jar-container header-jar" style={{ flex: "0 0 auto", width: "200px", height: "300px" }}>
                <div className="jar" style={{ width: "100%", height: "100%" }}>
                  <div className="jar-lid"></div>
                  <div className="jar-fill" style={{ height: jarFillPercentage + '%' }}></div>
                  <div className="jar-text">
                    {jarFillPercentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            <hr />
          </div>

          <div style={{ flex: 1, overflow: "auto", paddingRight: "1rem" }}>
            {/* Add Debt Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addDebt();
              }}
            >
              <input
                ref={debtNameRef}
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
                disabled={payoffMonths && Number(payoffMonths) > 0}
                title={payoffMonths && Number(payoffMonths) > 0 ? "Auto-calculated from payoff timeline" : ""}
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
                    key={debt._id}
                    style={{
                      textDecoration:
                        debt.currentAmount === 0 ? "line-through" : "none",
                    }}
                  >
                    {editingId === debt._id ? (
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
                          <button type="button" onClick={saveEdit}>Save</button>
                          <button type="button" onClick={cancelEditing}>Cancel</button>
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
                                debt._id,
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td>
                          <button type="button" onClick={() => startEditing(debt)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ marginLeft: "0.5rem" }}
                            onClick={() => deleteDebt(debt._id)}
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
        </div>
      </div>
    </div>



  );
}

export default App;
