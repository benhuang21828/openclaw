
"use client";

import { useState, useEffect } from "react";

export function MonitorControl() {
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/monitor");
            const data = await res.json();
            if (typeof data.monitor_active !== 'undefined') {
                setActive(data.monitor_active);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleStatus = async () => {
        setLoading(true);
        const newState = !active;
        try {
            await fetch("/api/monitor", {
                method: "POST",
                body: JSON.stringify({ monitor_active: newState }),
            });
            setActive(newState);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-zinc-100">Monitor Agent</h3>
                <p className="text-sm text-zinc-400">
                    {active ? "Running 🟢" : "Stopped 🔴"}
                </p>
            </div>
            <button
                onClick={toggleStatus}
                disabled={loading}
                className={`px-4 py-2 rounded font-medium ${active
                        ? "bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900"
                        : "bg-green-900/50 text-green-200 border border-green-800 hover:bg-green-900"
                    } transition-colors`}
            >
                {active ? "Stop" : "Start"}
            </button>
        </div>
    );
}
