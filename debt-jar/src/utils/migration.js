/**
 * One-time migration script to transfer data from localStorage to MongoDB
 * Run this once to migrate existing data
 */

const API_URL = "http://localhost:5000";

async function migrateDataToMongoDB() {
  try {
    // Get data from localStorage
    const savedData = localStorage.getItem("snowballData");

    if (!savedData) {
      console.log("No data in localStorage to migrate");
      return;
    }

    const data = JSON.parse(savedData);
    console.log("Found data in localStorage:", data);

    // Check if we already have a migration flag
    if (localStorage.getItem("migrated_to_mongodb")) {
      console.log("Data already migrated to MongoDB");
      return;
    }

    // Migrate debts to MongoDB
    if (data.debts && Array.isArray(data.debts) && data.debts.length > 0) {
      console.log(`Migrating ${data.debts.length} debts...`);

      for (const debt of data.debts) {
        try {
          const response = await fetch(`${API_URL}/api/debts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: debt.name,
              originalAmount: debt.originalAmount,
              currentAmount: debt.currentAmount,
              minPayment: debt.minPayment || 0,
              snowballPayment: debt.snowballPayment || 0,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to migrate debt: ${debt.name}`);
          }

          console.log(`Migrated debt: ${debt.name}`);
        } catch (err) {
          console.error(`Error migrating debt: ${debt.name}`, err);
        }
      }
    }

    // Mark as migrated
    localStorage.setItem("migrated_to_mongodb", "true");
    console.log("Migration complete!");
    console.log("localStorage data preserved for backup. You can manually call clearLocalStorage() to clean it up.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

function clearLocalStorage() {
  localStorage.removeItem("snowballData");
  localStorage.removeItem("migrated_to_mongodb");
  console.log("localStorage cleared");
}

// Auto-run migration on page load if not already migrated
if (typeof window !== "undefined" && !localStorage.getItem("migrated_to_mongodb")) {
  console.log("Running data migration from localStorage to MongoDB...");
  migrateDataToMongoDB();
}

export { migrateDataToMongoDB, clearLocalStorage };
