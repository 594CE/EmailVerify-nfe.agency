import { Request, Response } from "express";
import { stripe } from "@nfe/config";
import { User } from "@nfe/database";
import { logger } from "@nfe/config";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    // Assuming authenticated user
    const userId = (req as any).user?.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    logger.error({ err: error }, "Error creating checkout session");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret as string,
    );
  } catch (err: any) {
    logger.warn({ err }, "Webhook signature verification failed");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as any;
      // Handle successful subscription
      logger.info({ session }, "Checkout session completed");
      break;
    case "invoice.payment_succeeded":
      const invoice = event.data.object as any;
      // Add credits based on plan
      logger.info({ invoice }, "Invoice payment succeeded");
      break;
    default:
      logger.info({ type: event.type }, "Unhandled event type");
  }

  res.json({ received: true });
};
