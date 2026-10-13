import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSharedCartByCode } from "@/lib/database";
import SharedCartClient from "./SharedCartClient";
import "./pedido.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Tu pedido ${decodeURIComponent(code)} | SportCrz`,
    description:
      "Revisa los articulos que eligieron para vos y confirma tu pedido.",
  };
}

export default async function SharedCartPage({ params }: PageProps) {
  const { code } = await params;

  const cart = await getSharedCartByCode(decodeURIComponent(code));

  if (!cart) notFound();

  return (
    <main className="pedido-page">
      <header className="pedido-top">
        <span>SPORTCRZ</span>
        <Link href="/">VER TIENDA</Link>
      </header>

      <div className="pedido-wrap">
        <SharedCartClient cart={cart} />
      </div>

      <footer className="pedido-footer">
        <span>SPORTCRZ / 2026</span>
        <span>PEDIDO {cart.code}</span>
      </footer>
    </main>
  );
}