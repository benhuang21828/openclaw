import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
    try {
        const { run_id, agent_name, message, metadata } = await req.json();

        if (!run_id || !agent_name || !message) {
            return NextResponse.json({ error: "Missing required fields (run_id, agent_name, message)" }, { status: 400 });
        }

        const { data, error } = await supabase.from('run_activities').insert({
            run_id,
            agent_name,
            action_type: 'agent_activity',
            message,
            metadata: metadata || {}
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Activity successfully logged to Supabase." });
    } catch (error: any) {
        console.error("Activities POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
