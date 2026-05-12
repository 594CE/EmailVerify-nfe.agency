import { useState } from "react";
import { Check } from "lucide-react";
import api from "../../utils/api";

const plans = [
  {
    id: "price_free",
    name: "Free",
    price: "$0",
    credits: "100 / mo",
    features: ["100 Verifications", "API Access", "Standard Support"],
  },
  {
    id: "price_starter",
    name: "Starter",
    price: "$29",
    credits: "10,000 / mo",
    features: [
      "10,000 Verifications",
      "API Access",
      "Priority Support",
      "Team Accounts (3)",
    ],
  },
  {
    id: "price_growth",
    name: "Growth",
    price: "$99",
    credits: "50,000 / mo",
    features: [
      "50,000 Verifications",
      "API Access",
      "24/7 Support",
      "Unlimited Team Accounts",
    ],
  },
];

export default function Billing() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const res = await api.post("/billing/create-checkout-session", {
        planId,
      });
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Billing & Plans</h1>
        <p className="text-slate-500 mt-1">
          Manage your subscription and verification credits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col"
          >
            <h3 className="text-lg font-semibold text-slate-800">
              {plan.name}
            </h3>
            <div className="mt-4 flex items-baseline text-3xl font-extrabold text-slate-900">
              {plan.price}
              <span className="ml-1 text-xl font-medium text-slate-500">
                /mo
              </span>
            </div>
            <p className="mt-2 text-primary-600 font-medium">{plan.credits}</p>
            <ul className="mt-6 space-y-4 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="ml-3 text-slate-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading}
              className="mt-8 w-full bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              {loading ? "Processing..." : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
