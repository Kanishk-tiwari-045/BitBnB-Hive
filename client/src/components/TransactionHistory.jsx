import clsx from "clsx";
import { useState, useEffect } from "react";
import { SlideDown } from "react-slidedown";
import "react-slidedown/lib/slidedown.css";
import { motion } from "framer-motion";

const TransactionItem = ({ transaction, index }) => {
  const [activeId, setActiveId] = useState(null);
  const active = activeId === transaction.trx_id;

  return (
    <div className="relative z-2 mb-16">
      <div
        className="group relative flex cursor-pointer items-center justify-between gap-10 px-7"
        onClick={() => {
          setActiveId(activeId === transaction.trx_id ? null : transaction.trx_id);
        }}
      >
        <div className="flex-1">
          <div className="small-compact mb-1.5 text-p3 max-lg:hidden">
            {index < 10 ? "0" : ""}
            {index + 1}
          </div>
          <div
            className={clsx(
              "h6 text-p4 transition-colors duration-500 max-md:flex max-md:min-h-20 max-md:items-center",
              active && "max-lg:text-p1",
            )}
          >
            {transaction.op[0]} {/* Operation Type */}
          </div>
        </div>

        <div
          className={clsx(
            "faq-icon relative flex size-12 items-center justify-center rounded-full border-2 border-s2 shadow-400 transition-all duration-500 group-hover:border-s4",
            active && "before:bg-p1 after:rotate-0 after:bg-p1",
          )}
        >
          <div className="g4 size-11/12 rounded-full shadow-300" />
        </div>
      </div>

      <SlideDown>
        {activeId === transaction.trx_id && (
          <div className="body-3 px-7 py-3.5">
            <p className="text-gray-600">Transaction ID: {transaction.trx_id}</p>
            <p className="text-gray-600">Block: {transaction.block}</p>
            <p className="text-gray-600">Timestamp: {new Date(transaction.timestamp).toLocaleString()}</p>
            {transaction.op[0] === "custom_json" && transaction.op[1] && (
              <>
                <p className="text-gray-600">ID: {transaction.op[1].id}</p>
                <p className="text-gray-600">
                  JSON: {JSON.stringify(JSON.parse(transaction.op[1].json), null, 2)}
                </p>
                <p className="text-gray-600">
                  Posting Auths: {transaction.op[1].required_posting_auths.join(", ")}
                </p>
              </>
            )}
          </div>
        )}
      </SlideDown>

      <div
        className={clsx(
          "g5 -bottom-7 -top-7 left-0 right-0 -z-1 rounded-3xl opacity-0 transition-opacity duration-500 absolute",
          active && "opacity-100",
        )}
      >
        <div className="g4 absolute inset-0.5 -z-1 rounded-3xl" />
        <div className="absolute left-8 top-0 h-0.5 w-40 bg-p1" />
      </div>
    </div>
  );
};

const TransactionHistory = ({ hiveUsername }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const apiUrl = `https://api.hive.blog`;
      const payload = {
        jsonrpc: "2.0",
        method: "account_history_api.get_account_history",
        params: { account: hiveUsername, start: -1, limit: 1000 },
        id: 1,
      };

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.statusText}`);
        }
        const { result } = await response.json();
        setTransactions(result.history);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (hiveUsername) {
      fetchTransactions();
    }
  }, [hiveUsername]);

  if (loading) return <div>Loading transaction history...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!transactions.length) return <div>No transactions found for this user.</div>;

  return (
    <div className="mt-12">
      <motion.h3 className="text-3xl font-semibold text-blue-700 mb-4">
        Transaction History
      </motion.h3>
      <div className="faq-glow_before relative z-2 border-2 border-s2 bg-s1">
        <div className="container flex gap-10 max-lg:block">
          <div className="relative flex-1 pt-24">
            {transactions.map(([index, transaction]) => (
              <TransactionItem key={transaction.trx_id} transaction={transaction} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
