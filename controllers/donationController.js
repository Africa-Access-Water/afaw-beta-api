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
    const { name, email, amount, currency, interval, recurring } = req.body;
    console.log('Checkout data:', { name, email, amount, currency, interval, recurring });

    // 1. Check if donor exists
    let donor = await Donor.findByEmail(email);
    let donorId;

    if (!donor) {
      donorId = await Donor.create({ name, email });
      donor = { id: donorId, name, email };
    } else {
      donorId = donor.id;
    }

    // 2. Create Stripe customer if not exists
    if (!donor.stripe_customer_id) {
      const customer = await stripe.customers.create({
        name: donor.name,
        email: donor.email,
      });
      await Donor.updateStripeCustomerId(donorId, customer.id);
      donor.stripe_customer_id = customer.id;
    }

    // 3. Create Stripe Checkout session
    const sessionData = {
      customer: donor.stripe_customer_id,
      payment_method_types: ['card'],
      mode: recurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: recurring ? 'Recurring Donation' : 'One-Time Donation',
            },
            unit_amount: Math.round(amount * 100),
            recurring: recurring ? { interval } : undefined,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/donation-cancel`,
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    // 4. Save subscription if recurring
    if (recurring) {
      await Subscription.create({
        donor_id: donorId,
        amount,
        currency,
        interval,
        status: 'pending',
        stripe_checkout_session_id: session.id,
      });
    }

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 5. Shortcut for recurring donations
exports.createSubscription = async (req, res) => {
  req.body.recurring = true; // force recurring
  req.body.interval = req.body.interval || 'month'; // default
  return exports.createCheckoutSession(req, res); // reuse existing function
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.mode === "subscription") {
      // Get actual subscription details from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

      // Update subscription record
      await Subscription.updateBySessionId(session.id, {
        stripe_subscription_id: stripeSubscription.id,
        status: "active",
      });
    } else if (session.mode === "payment") {
      // Update donation record
      await Donation.updateBySessionId(session.id, {
        stripe_payment_intent: session.payment_intent,
        status: "completed",
      });
    }
  }

  res.json({ received: true });
};


/**
 * Get all donations
 */
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.findAll();
    res.json(donations);
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ error: "Unable to fetch donations" });
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
