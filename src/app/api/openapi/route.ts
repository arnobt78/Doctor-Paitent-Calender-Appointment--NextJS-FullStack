import { NextResponse } from "next/server";
import openApiJson from "./openapi.json";

export async function GET() {
  return NextResponse.json(openApiJson);
}
