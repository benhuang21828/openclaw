
"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash, RotateCw } from "lucide-react";

export function HoldingsManager() {
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newTicker, setNewTicker] = useState("");
    const [newShares, setNewShares] = useState("");
    const [newCost, setNewCost] = useState("");

    const fetchHoldings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/holdings");
            const data = await res.json();
            if (data.holdings) {
                setHoldings(data.holdings);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const saveHoldings = async (newHoldings: any[]) => {
        setLoading(true);
        try {
            await fetch("/api/holdings", {
                method: "POST",
                body: JSON.stringify({ holdings: newHoldings }),
            });
            setHoldings(newHoldings);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addHolding = () => {
        if (!newTicker) return;
        const newHoldings = [...holdings, {
            Ticker: newTicker.toUpperCase(),
            Shares: newShares || "0",
            CostBasis: newCost || "0"
        }];
        saveHoldings(newHoldings);
        setNewTicker("");
        setNewShares("");
        setNewCost("");
    };

    const removeHolding = (index: number) => {
        const newHoldings = holdings.filter((_, i) => i !== index);
        saveHoldings(newHoldings);
    };

    useEffect(() => {
        fetchHoldings();
    }, []);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-zinc-100">Current Holdings</h2>
                <button onClick={fetchHoldings} className="p-2 hover:bg-zinc-800 rounded">
                    <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-800 text-zinc-400">
                        <tr>
                            <th className="px-4 py-2">Ticker</th>
                            <th className="px-4 py-2">Shares</th>
                            <th className="px-4 py-2">Cost Basis</th>
                            <th className="px-4 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((h, i) => (
                            <tr key={i} className="border-b border-zinc-800">
                                <td className="px-4 py-2 font-medium text-white">{h.Ticker}</td>
                                <td className="px-4 py-2">{h.Shares}</td>
                                <td className="px-4 py-2">${h.CostBasis}</td>
                                <td className="px-4 py-2">
                                    <button onClick={() => removeHolding(i)} className="text-red-400 hover:text-red-300">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    placeholder="Ticker"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white p-2 rounded w-20 uppercase"
                />
                <input
                    type="number"
                    placeholder="Shares"
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white p-2 rounded w-20"
                />
                <input
                    type="number"
                    placeholder="Cost"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white p-2 rounded w-20"
                />
                <button
                    onClick={addHolding}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex items-center gap-1"
                    disabled={loading}
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>
        </div>
    );
}
