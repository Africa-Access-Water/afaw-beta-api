// controllers/donationController.js
const Donor = require("../models/donorModel");
const Donation = require("../models/donationModel");
const Subscription = require("../models/subscriptionModel");
const Project = require("../models/projectModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendMail } = require("../services/mailService");
const {
  donorDonationConfirmationEmail,
  adminDonationNotificationEmail,
} = require("../utils/emailTemplates");


const knex = require("../config/db");

async function handleDonationSuccess(session) {
  try {
    const donorEmail = session.customer_details?.email;
    const donorName = session.customer_details?.name || "Donor";
    const amount = (session.amount_total / 100).toFixed(2);
    const currency = session.currency.toUpperCase();
    const projectId = session.metadata?.projectId;

    console.log("🔔 Donation Session Received:", {
      sessionId: session.id,
      donorEmail,
      donorName,
      amount,
      currency,
      projectId,
    });

    // ✅ Update DB (mark donation as completed, update totals)
    await knex("donations").where({ stripe_checkout_session_id: session.id }).update({
      status: "completed",
      stripe_payment_intent: session.payment_intent,
    });


    if (projectId) {
      await knex("projects")
        .where({ id: projectId })
        .increment("donation_raised", amount);

      // Fetch project details for logging
      const project = await knex("projects").where({ id: projectId }).first();
      console.log("📌 Project updated:", project);
    }

    // ✅ Send confirmation email to donor
    if (donorEmail) {
      console.log(`📧 Sending confirmation email to donor: ${donorEmail}`);
      const project = projectId
        ? await knex("projects").where({ id: projectId }).first()
        : null;

      await sendMail({
        from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
        to: donorEmail,
        subject: `Thank you for your donation of ${currency} ${amount}`,
        html: donorDonationConfirmationEmail(
          donorName,
          amount,
          currency,
          project ? project.name : "our mission"
        ),
      });
    } else {
      console.warn("⚠️ No donor email found in session");
    }

    // ✅ Notify admin(s)
    console.log("📧 Sending admin notification to:", process.env.ADMIN_EMAILS);
    await sendMail({
      from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAILS, // comma-separated list in .env
      subject: `New Donation Received: ${currency} ${amount}`,
      html: adminDonationNotificationEmail(
        donorName,
        donorEmail,
        amount,
        currency,
        projectId
      ),
    });

    console.log("✅ Donation success handled:", session.id);
  } catch (err) {
    console.error("❌ Error in handleDonationSuccess:", err);
  }
}


/**
 * Create Stripe Checkout Session (one-time or recurring)
 */

exports.createCheckoutSession = async (req, res) => {
  try {
    const { name, email, project_id, amount, currency, interval, recurring } =
      req.body;

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
      customer = await stripe.customers.create({
        name: donor.name,
        email: donor.email,
      });
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
        status: "initiated",
      });
    } else {
      donationId = await Donation.create({
        donor_id: donorId,
        project_id,
        amount,
        currency,
        status: "initiated",
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
            product_data: {
              name: recurring ? "Recurring Donation" : "One-Time Donation",
            },
            unit_amount: Math.round(amount * 100),
            recurring: recurring ? { interval } : undefined,
          },
          quantity: 1,
        },
      ],

      metadata: {
        projectId: project_id,
        donorId: donorId
      },
      success_url: `${process.env.CLIENT_URL}/donation/success?session_id={CHECKOUT_SESSION_ID}&project_id=${project_id}`,
      cancel_url: `${process.env.CLIENT_URL}/donation/failure`,
    });

    // 5. Update record with checkout_session_id
    if (recurring) {
      await Subscription.updateById(donationId, {
        stripe_checkout_session_id: session.id,
        status: "pending",
      });
    } else {
      await Donation.updateById(donationId, {
        stripe_checkout_session_id: session.id,
        status: "pending",
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
      process.env.STRIPE_WEBHOOK_SECRET_DEV
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
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          await Subscription.updateBySessionId(session.id, {
            stripe_subscription_id: stripeSubscription.id,
            status: "active",
          });
        } else if (session.mode === "payment") {
          await Donation.updateBySessionId(session.id, {
            stripe_payment_intent: session.payment_intent,
            status: "completed",
          });
          console.log("Donation Success");
          // ✅ Call donation success handler
          await handleDonationSuccess(session);
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
        const sessionId = intent.metadata.checkout_session_id;
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
    const { donor_id } = req.query;
    
    // Fetch one-time donations
    let donations = await Donation.findAll();
    
    // Fetch recurring subscriptions
    let subscriptions = await Subscription.findAll();

    // Filter by donor_id if provided
    if (donor_id) {
      donations = donations.filter(d => d.donor_id == donor_id);
      subscriptions = subscriptions.filter(s => s.donor_id == donor_id);
    }

    // Combine them, optionally add a type field
    const allDonations = [
      ...donations.map((d) => ({ ...d, type: "one-time" })),
      ...subscriptions.map((s) => ({ ...s, type: "subscription" })),
    ];

    // Sort by creation date (latest first)
    allDonations.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(allDonations);
  } catch (error) {
    console.error("Get donations error:", error);
    res
      .status(500)
      .json({ error: "Unable to fetch donations and subscriptions" });
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

exports.getProjectWithDonations = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findWithDonations(id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
