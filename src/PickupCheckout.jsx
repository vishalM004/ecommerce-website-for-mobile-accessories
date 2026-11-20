
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

export default function PickupCheckout({
  cart,
  onClose,
  onOrderCreated,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [success, setSuccess] = useState(false);

  const total = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.sale_price ?? item.price) *
        item.quantity,
    0
  );

  const fieldClass =
    "w-full rounded-xl border border-[#e3d8c9] bg-white px-4 py-3 text-[#171513] placeholder:text-[#a49a8d] outline-none transition focus:border-[#805735] focus:ring-2 focus:ring-[#805735]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-[#625548]";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

   
const cleanedPhone = phone.replace(/\D/g, "");

if (!/^\d{10}$/.test(cleanedPhone)) {
  alert("Please enter a valid 10-digit phone number.");
  return;
}


    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setSaving(true);

    try {
      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.rpc(
        "create_pickup_order",
        {
          p_customer_name: name.trim(),
          p_customer_phone: phone.trim(),
          p_customer_email: email.trim() || null,
          p_notes: notes.trim() || null,
          p_items: items,
        }
      );

      if (error) throw error;

      setOrderNumber(data.order_number);
      setSuccess(true);

      if (onOrderCreated) {
        onOrderCreated(data);
      }
    
} catch (error) {
  console.error("Pickup order error:", error);

  const message = error.message || "";

  if (message.includes("Not enough stock")) {
    alert(
      "Some items are no longer available in the requested quantity. Please close checkout, update your cart, and try again."
    );
  } else if (message.includes("no longer available")) {
    alert(
      "Sorry, one of your products is no longer available. Please update your cart and try again."
    );
  } else {
    alert(
      "We couldn't complete your pickup reservation. Please try again."
    );
  }
} finally {
  setSaving(false);
}

  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#171513]/60 px-4 py-6 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-lg rounded-3xl border border-[#e8dfd3] bg-[#fbf8f3] p-6 text-center shadow-2xl md:p-8"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f2e5] text-3xl">
            ✓
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#805735]">
            M.M TIMES & MOBILES
          </p>

          <h2 className="mt-3 text-2xl font-bold text-[#171513] md:text-3xl">
            Reservation Confirmed
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#766b60]">
            Your pickup reservation has been created successfully.
          </p>

          <div className="mt-7 rounded-2xl border border-[#e6d8c5] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8b7c6b]">
              Your Order ID
            </p>
            <p className="mt-2 break-words text-2xl font-bold tracking-wide text-[#805735] md:text-3xl">
              {orderNumber}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#eee5d9] bg-[#f5efe6] p-5 text-left">
            <p className="text-sm text-[#8b7c6b]">Customer</p>
            <p className="mt-1 break-words font-semibold text-[#171513]">
              {name}
            </p>

            <p className="mt-4 text-sm text-[#8b7c6b]">Phone</p>
            <p className="mt-1 break-words font-semibold text-[#171513]">
              {phone}
            </p>

            <div className="my-4 border-t border-[#e4d8c8]" />

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#766b60]">Pickup Total</p>
              <p className="text-xl font-bold text-[#356b43]">
                ₹{dataSafeTotal(total).toFixed(2)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-[#766b60]">
            Please show this Order ID when you visit M.M TIMES for pickup.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-[#805735] py-3.5 font-bold text-white transition hover:bg-[#684327] active:scale-[0.99]"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#171513]/60 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative my-auto w-full max-w-2xl rounded-3xl border border-[#e8dfd3] bg-[#fbf8f3] p-5 shadow-2xl md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#e5dbce] bg-white text-[#766b60] transition hover:bg-[#f1e8dc] hover:text-[#805735]"
        >
          ✕
        </button>

        <div className="pr-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#805735]">
            M.M TIMES & MOBILES
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#171513] md:text-3xl">
            Reserve for Pickup
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#766b60]">
            Enter your details and we’ll prepare your items for pickup.
          </p>
        </div>

        {/* CART SUMMARY */}
        <div className="mt-7 rounded-2xl border border-[#e8dfd3] bg-white p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-bold text-[#171513]">
              Your Items
            </h3>
            <span className="rounded-full bg-[#f3ece2] px-3 py-1 text-xs font-semibold text-[#805735]">
              {cart.reduce(
                (sum, item) => sum + item.quantity,
                0
              )}{" "}
              items
            </span>
          </div>

          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold text-[#29231d]">
                    {item.product_name}
                  </p>
                  <p className="mt-1 text-sm text-[#8b7c6b]">
                    ₹{Number(
                      item.sale_price ?? item.price
                    ).toFixed(2)}{" "}
                    × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 font-bold text-[#171513] ">
                  ₹
                  {(
                    Number(item.sale_price ?? item.price) *
                    item.quantity
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee5d9] pt-4">
            <span className="font-bold text-[#171513]">
              Total
            </span>
            <span className="text-xl font-bold text-[#171513]">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* CUSTOMER DETAILS */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label className={labelClass}>
              Full Name *
            </label>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Phone Number *
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Email <span className="font-normal text-[#9a8e80]">(Optional)</span>
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Pickup Notes <span className="font-normal text-[#9a8e80]">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special request..."
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#805735] py-4 text-base font-bold text-white shadow-lg shadow-[#805735]/10 transition hover:bg-[#684327] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Creating Reservation..."
              : "Confirm Pickup Reservation"}
          </button>

          <p className="text-center text-xs leading-5 text-[#9a8e80]">
            Your items are reserved through a store pickup order.
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function dataSafeTotal(value) {
  return Number.isFinite(Number(value))
    ? Number(value)
    : 0;
}
