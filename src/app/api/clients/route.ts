import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Client } from "@/lib/clients/types";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as Client[]);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    first_name: string;
    last_name: string;
    business_name: string;
    email: string;
    phone?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { first_name, last_name, business_name, email, phone } = body;

  if (!first_name || !last_name || !business_name || !email) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: first_name, last_name, business_name, email",
      },
      { status: 400 }
    );
  }

  // Check for duplicate email
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "A client with this email already exists" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      first_name,
      last_name,
      business_name,
      email,
      phone: phone || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as Client, { status: 201 });
}
