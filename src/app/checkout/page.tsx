import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import CheckoutClient from "@/components/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout | SportCrz" };

/* El checkout exige sesión iniciada: sin sesión, se
   envía al login y se vuelve aquí tras entrar. */
export default async function CheckoutPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/cuenta/login?next=/checkout");
  }

  return <CheckoutClient />;
}