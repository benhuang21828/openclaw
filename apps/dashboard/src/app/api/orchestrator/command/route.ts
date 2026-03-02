import { NextResponse } from "next/server";
import { readState, writeState } from "../../../../lib/orchestrator";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { contextId, command } = body;

        if (!contextId || !command) {
            return NextResponse.json({ error: "contextId and command required" }, { status: 400 });
        }

        if (command !== "pause" && command !== "resume") {
            return NextResponse.json({ error: "Invalid command" }, { status: 400 });
        }

        const state = await readState(contextId);

        if (!state) {
            return NextResponse.json({ error: "Context not found" }, { status: 404 });
        }

        if (state.status === "completed" || state.status === "error") {
            return NextResponse.json({ error: "Cannot pause/resume a completed or errored stream" }, { status: 400 });
        }

        if (command === "pause") {
            state.status = "paused";
            await writeState(contextId, state);
            return NextResponse.json({ success: true, status: "paused" });
        }

        if (command === "resume") {
            state.status = "running";
            await writeState(contextId, state);

            // To properly resume, the next `GET /api/orchestrator` poll will pick up where it left off, 
            // OR we can explicitly re-fire the current agent if we want, but since they are stateless, 
            // relying on the poll loop to detect the scratchpad is safer.
            // Actually, if we stopped polling or the agent died, we might need to re-fire it. 
            // For now, setting status to running allows the polling loop to continue traversing.

            return NextResponse.json({ success: true, status: "running" });
        }

    } catch (e: any) {
        console.error("Orchestrator Command Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
