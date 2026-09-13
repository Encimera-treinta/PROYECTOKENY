import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById } from "@/lib/database";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const customer = await getCustomerById(session.customerId);

  if (!customer) {
    return NextResponse.json({ authenticated: false });
  }

  const nameParts = customer.full_name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return NextResponse.json({
    authenticated: true,
    email: customer.email,
    phone: customer.phone,
    firstName,
    lastName: lastName || firstName,
  });
}
