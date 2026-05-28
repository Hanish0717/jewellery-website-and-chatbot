import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/AdminPanel";
import {
  getProductsFn,
  getLeadsFn,
  getPriceAlertsFn,
  getAutomatedMessagesFn,
  getStoreSettingsFn,
} from "@/db/serverFunctions";

export const Route = createFileRoute("/admin")({
  loader: async () => {
    try {
      const [dbProducts, storeSettings, leads, alerts, dbMessages] = await Promise.all([
        getProductsFn(),
        getStoreSettingsFn(),
        getLeadsFn(),
        getPriceAlertsFn(),
        getAutomatedMessagesFn(),
      ]);
      return { dbProducts, storeSettings, leads, alerts, dbMessages };
    } catch (e) {
      console.warn("Failed to load admin data in route loader:", e);
      return {
        dbProducts: [],
        storeSettings: {
          id: 1,
          gold22kRate: "₹ 6,850",
          gold18kRate: "₹ 5,605",
          promoText: "✨ Special Festive Offer: 25% Off Making Charges on Gold Jewellery! ✨",
          promoActive: true,
        },
        leads: [],
        alerts: [],
        dbMessages: [],
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Atelier Vault — Administrative Portal" },
      { name: "description", content: "Management console for Aurum Vault gold rates, promotional texts, and automated customer notifications." }
    ]
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const data = Route.useLoaderData();
  return <AdminPanel initialData={data} />;
}
