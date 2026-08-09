"use client";

import { useState } from "react";
import Script from "next/script";
import axios from "axios";

interface RazorpayCheckoutProps {
  draftId: string;
  amount: number; // rupees, for display only — real amount is set server-side
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (result: {
    printJobId: string;
    printCode: string;
    expiresAt: string;
  }) => void;
  onFailure?: (message: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({
  draftId,
  amount,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);

    if (!scriptReady || !window.Razorpay) {
      setError(
        "Payment gateway is still loading. Please try again in a moment.",
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: create order server-side

        const orderRes = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payment/create-order`,
          { draftId },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

      if (!orderRes.data) {
        const body = await orderRes.data.catch(() => ({}));
        throw new Error(body.error || "Could not start payment");
      }

      const order = await orderRes.data;

      // Step 2: open Razorpay Standard Checkout modal
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "PayNPrint",
        description: "Print job payment",
        order_id: order.order_id,
        prefill: {
          name: userName || "",
          email: userEmail || "",
          contact: userPhone || "",
        },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {

            const verifyRes = await axios.post(
              `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payment/verify-payment`,
              JSON.stringify({ ...response, draftId }),
              {
                withCredentials: true,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );

            const verifyBody = await verifyRes.data;

            if (verifyRes.status !== 200 || !verifyBody.success) {
              throw new Error(
                verifyBody.error || "Payment verification failed",
              );
            }

            onSuccess({
              printJobId: verifyBody.printJobId,
              printCode: verifyBody.printCode,
              expiresAt: verifyBody.expiresAt,
            });
          } catch (err: any) {
            const message = err.message || "Payment verification failed";
            setError(message);
            onFailure?.(message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed the modal without paying
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Payment failed inside the modal (card declined, etc.)
      rzp.on("payment.failed", (resp: any) => {
        setLoading(false);
        const message =
          resp?.error?.description || "Payment failed. Please try again.";
        setError(message);
        onFailure?.(message);
      });

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      const message = err.message || "Something went wrong. Please try again.";
      setError(message);
      onFailure?.(message);
    }
  }

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="afterInteractive"
      />

      <button
        onClick={handlePay}
        disabled={loading || !scriptReady}
        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
