"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type GatewayMessage =
    | { type: "event"; event: string; payload: any }
    | { type: "res"; id: string; ok: boolean; payload?: any; error?: any }
    | { type: "req"; id: string; method: string; params: any };

export function useGateway() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    // pendingReqs: Map<id, { resolve, reject }>
    const pendingReqs = useRef<Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>>(new Map());

    const connect = useCallback(() => {
        if (wsRef.current) return;

        // Connect to local gateway
        const ws = new WebSocket("ws://localhost:18789");

        ws.onopen = () => {
            console.log("WS Connected");
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                console.log("WS Msg:", msg);

                // Auto-reply to handshake challenge
                if (msg.type === "event" && msg.event === "connect.challenge") {
                    const response = {
                        type: "req",
                        id: "init-" + Date.now(),
                        method: "connect",
                        params: {
                            minProtocol: 3,
                            maxProtocol: 3,
                            client: {
                                id: "dashboard",
                                version: "1.0.0",
                                platform: "web",
                                mode: "operator",
                            },
                            role: "operator",
                            scopes: ["operator.read", "operator.write", "operator.admin"],
                            auth: { token: "dev" },
                            device: { id: "dashboard-dev" }
                        },
                    };
                    ws.send(JSON.stringify(response));
                }

                // Handle responses
                if (msg.type === "res") {
                    if (msg.id.startsWith("init-") && msg.ok) {
                        setIsConnected(true);
                    }
                    if (pendingReqs.current.has(msg.id)) {
                        if (msg.ok) {
                            pendingReqs.current.get(msg.id)!.resolve(msg.payload);
                        } else {
                            pendingReqs.current.get(msg.id)!.reject(msg.error);
                        }
                        pendingReqs.current.delete(msg.id);
                    }
                }

                if (msg.type === "event") {
                    setMessages((prev) => [...prev.slice(-99), msg]);
                }

            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onclose = () => {
            console.log("WS Closed");
            setIsConnected(false);
            wsRef.current = null;
            setTimeout(connect, 3000); // Retry
        };

        wsRef.current = ws;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        connect();
        return () => {
            wsRef.current?.close();
        };
    }, [connect]);

    const call = useCallback((method: string, params: any = {}) => {
        return new Promise((resolve, reject) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                return reject(new Error("Not connected"));
            }
            const id = Math.random().toString(36).substring(7);
            const req = { type: "req", id, method, params };

            pendingReqs.current.set(id, { resolve, reject });
            wsRef.current.send(JSON.stringify(req));

            setTimeout(() => {
                if (pendingReqs.current.has(id)) {
                    pendingReqs.current.delete(id);
                    reject(new Error("Timeout " + method));
                }
            }, 10000);
        });
    }, []);

    return { isConnected, messages, call };
}
