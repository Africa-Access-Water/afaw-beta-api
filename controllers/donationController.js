// controllers/donationController.js
const Donor = require("../models/donorModel");
const Donation = require("../models/donationModel");
const Subscription = require("../models/subscriptionModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe Checkout Session (one-time or recurring)
 */

  exports.createCheckoutSession = async (req, res) => {
    try {
      const { name, email, project_id, amount, currency, interval, recurring } = req.body;

      // 1. Check or create donor
      let donor = await Donor.findByEmail(email);
      let donorId;

      if (!donor) {
        donorId = await Donor.create({ name, email });
        donor = { id: donorId, name, email };
      } else {
        donorId = donor.id;
      }

      // 2. Ensure Stripe customer exists
      let customer;
      if (!donor.stripe_customer_id) {
        customer = await stripe.customers.create({ name: donor.name, email: donor.email });
      } else {
        customer = await stripe.customers.retrieve(donor.stripe_customer_id);
      }

      await Donor.updateStripeCustomerId(donorId, customer.id);

      // 3. Save donation/subscription first (status = 'initiated')
      let donationId;
      if (recurring) {
        donationId = await Subscription.create({
          donor_id: donorId,
          project_id,
          amount,
          currency,
          interval,
          status: "initiated"
        });
      } else {
        donationId = await Donation.create({
          donor_id: donorId,
          project_id,
          amount,
          currency,
          status: "initiated"
        });
      }

      // 4. Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        mode: recurring ? "subscription" : "payment",
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: recurring ? "Recurring Donation" : "One-Time Donation" },
              unit_amount: Math.round(amount * 100),
              recurring: recurring ? { interval } : undefined,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/failed`,
      });

      // 5. Update record with checkout_session_id
      if (recurring) {
        await Subscription.updateById(donationId, {
          stripe_checkout_session_id: session.id,
          status: "pending"
        });
      } else {
        await Donation.updateById(donationId, {
          stripe_checkout_session_id: session.id,
          status: "pending"
        });
      }

      // 6. Redirect
      return res.json({ url: session.url });

    } catch (err) {
      console.error("Checkout session error:", err);
      res.status(500).json({ error: err.message });
    }
  };


/**
 * Shortcut for recurring donations
 */
exports.createSubscription = async (req, res) => {
  req.body.recurring = true;
  req.body.interval = req.body.interval || "month";
  return exports.createCheckoutSession(req, res);
};

/**
 * Webhook handler for Stripe events
 */
  exports.stripeWebhookHandler = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature error:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;

          if (session.mode === "subscription") {
            const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
            await Subscription.updateBySessionId(session.id, {
              stripe_subscription_id: stripeSubscription.id,
              status: "active",
            });
          } else if (session.mode === "payment") {
            await Donation.updateBySessionId(session.id, {
              stripe_payment_intent: session.payment_intent,
              status: "completed",
            });
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object;
          await Donation.updateBySessionId(session.id, { status: "expired" });
          await Subscription.updateBySessionId(session.id, { status: "expired" });
          break;
        }

        case "payment_intent.payment_failed": {
          const intent = event.data.object;
          const sessionId = intent.metadata.checkout_session_id; // optional if stored
          if (sessionId) {
            await Donation.updateBySessionId(sessionId, { status: "failed" });
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handling error:", err);
      res.status(500).send("Webhook handler failed");
    }
  };


/**
 * Get all donations
 */
exports.getDonations = async (req, res) => {
  try {
    // Fetch one-time donations
    const donations = await Donation.findAll();

    // Fetch recurring subscriptions
    const subscriptions = await Subscription.findAll();

    // Combine them, optionally add a type field
    const allDonations = [
      ...donations.map(d => ({ ...d, type: 'one-time' })),
      ...subscriptions.map(s => ({ ...s, type: 'subscription' }))
    ];

    // Sort by creation date (latest first)
    allDonations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allDonations);
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ error: "Unable to fetch donations and subscriptions" });
  }
};

/**
 * Get all donors
 */
exports.getDonors = async (req, res) => {
  try {
    const donors = await Donor.findAll();
    res.json(donors);
  } catch (error) {
    console.error("Get all donors error:", error);
    res.status(500).json({ error: "Unable to fetch donors" });
  }
};

exports.getProjectWithDonations = async(req, res) => {
    try {
      const { id } = req.params;
      const project = await Project.findWithDonations(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
