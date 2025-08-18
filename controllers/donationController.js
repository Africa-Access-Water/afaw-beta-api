const Donor = require("../models/donorModel");
const Donation = require("../models/donationModel");
const Subscription = require("../models/subscriptionModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  // One-time donation with Stripe Checkout
  async createDonation(req, res) {
    try {
      const { email, name, amount } = req.body;

      // Find or create donor
      let donor = await Donor.findByEmail(email);
      if (!donor) {
        const donorId = await Donor.create({ email, name });
        donor = await Donor.findById(donorId);
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "One-Time Donation" },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url:
          "http://localhost:5000/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5000/cancel",
      });

      // Save donation as pending
      await Donation.create({
        donor_id: donor.id,
        amount,
        currency: "usd",
        stripe_payment_intent_id: session.payment_intent,
        status: "pending",
      });

      res.json({ url: session.url }); // send Stripe checkout link
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to create donation session" });
    }
  },

  // Recurring donation (subscription) with Stripe Checkout
  async createSubscription(req, res) {
    try {
      const { email, name, amount, interval } = req.body;

      // Validate interval
      const validIntervals = ["day", "week", "month", "year"];
      if (!validIntervals.includes(interval)) {
        return res.status(400).json({
          error: "Invalid interval. Must be day, week, month, or year.",
        });
      }

      // Find or create donor
      let donor = await Donor.findByEmail(email);
      if (!donor) {
        const donorId = await Donor.create({ email, name });
        donor = await Donor.findById(donorId);
      }

      // Create or reuse Stripe Customer
      let customerId = donor.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({ email, name });
        customerId = customer.id;

        // Save customerId to donor using Knex
        await Donor.updateStripeCustomerId(donor.id, customerId);
      }

      // Create a Stripe product dynamically
      const product = await stripe.products.create({
        name: `Recurring Donation - ${name}`,
      });

      // Create a Stripe price for the subscription
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100), // in cents
        currency: "usd",
        recurring: { interval }, // day, week, month, year
        product: product.id,
      });

      // Create subscription Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        success_url:
          "http://localhost:5000/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5000/cancel",
      });

      // Save subscription as pending (actual subscription id comes via webhook)
      await Subscription.create({
        donor_id: donor.id,
        stripe_subscription_id: session.subscription, // THIS IS NULL
        amount,
        currency: "usd",
        interval,
        status: "pending",
      });

      // Save subscription with session ID first
      const subscriptionRecordId = await Subscription.create({
        donor_id: donor.id,
        stripe_checkout_session_id: session.id, // save session ID
        amount,
        currency: "usd",
        interval,
        status: "pending",
      });

      // Send Stripe checkout link
      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Unable to create subscription session",
        details: error.message,
      });
    }
  },
  // Inside donationController.js
  async getDonations(req, res) {
    try {
      const { donorId } = req.params;
      const donations = await Donation.findByDonorId(donorId);
      res.json(donations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to fetch donations" });
    }
  },
};
