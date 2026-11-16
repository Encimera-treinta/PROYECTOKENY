import { NextResponse } from "next/server";
import {
  getOrderCodeById,
  getOrderByCode,
  markOrderCancelled,
  markOrderPaid,
} from "@/lib/database";
import { verifyYappyIpn } from "@/lib/yappy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const orderId = params.get("orderId") ?? "";
  const status = params.get("status") ?? "";
  const hash = params.get("Hash") ?? params.get("hash") ?? "";
  const domain = params.get("domain") ?? "";

  if (!/^\d{1,15}$/.test(orderId) || !["E", "R", "C", "X"].includes(status)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (!verifyYappyIpn({ orderId, status, hash, domain })) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const orderCode = await getOrderCodeById(Number(orderId));
  if (!orderCode) return NextResponse.json({ success: false }, { status: 404 });

  if (status === "E") {
    const updated = await markOrderPaid(orderCode, "yappy", orderId);
    if (!updated) {
      const order = await getOrderByCode(orderCode);
      if (!order || !["paid", "shipped", "delivered"].includes(order.status)) {
        return NextResponse.json({ success: false }, { status: 409 });
      }
    }
  } else {
    await markOrderCancelled(orderCode);
  }

  return NextResponse.json({ success: true });
}
