// controllers/donationController.js
const Donor = require("../models/donorModel");
const Donation = require("../models/donationModel");
const Subscription = require("../models/subscriptionModel");
const Project = require("../models/projectModel");
const config = require('../config/config');
const stripe = require("stripe")(config.stripe.secretKey);
const { sendMail } = require("../services/mailService");
const {
  donorDonationConfirmationEmail,
  adminDonationNotificationEmail,
} = require("../utils/emailTemplates");
const { generateDonationReceiptPDFBuffer } = require("./pdfController");


const knex = require("../config/db");

async function handleDonationSuccess(session) {
  try {
    const donorEmail = session.customer_details?.email;
    const donorName = session.customer_details?.name || "Donor";
    const donationId = session.metadata?.donationId;
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

    let project;
    if (projectId) {
      await knex("projects")
        .where({ id: projectId })
        .increment("donation_raised", amount);

      // Fetch project details for logging
      project = await knex("projects").where({ id: projectId }).first();
      console.log("📌 Project updated:", project);
    }

     // ✅ Send confirmation email to donor
     if (donorEmail) {
       console.log(`📧 Sending confirmation email to donor: ${donorEmail}`);
       const project = projectId
         ? await knex("projects").where({ id: projectId }).first()
         : null;

       // Prepare donation data for PDF generation
       const donationData = {
         id: donationId,
         name: donorName,
         email: donorEmail,
         amount: parseFloat(amount),
         method: "stripe",
         transaction_id: session.payment_intent,
         created_at: new Date().toISOString(),
         message: project ? `Donation for ${project.name}` : "General donation"
       };

       // Try to generate PDF receipt
       let pdfBuffer = null;
       try {
         pdfBuffer = await generateDonationReceiptPDFBuffer(donationData);
         console.log("✅ PDF receipt generated successfully");
       } catch (pdfError) {
         console.error("Failed to generate PDF receipt:", pdfError);
         // Continue without PDF attachment
       }

       // Send email with or without PDF attachment
       const emailOptions = {
         from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
         to: donorEmail,
         subject: 
           `Thank you for your donation of ${currency} ${amount}`,
         html: donorDonationConfirmationEmail(
           donorName,
           amount,
           currency,
           project ? project.name : "our mission"
         )
       };

       // Add PDF attachment only if successfully generated
       if (pdfBuffer) {
         emailOptions.attachments = [
           {
             filename: `Donation-Receipt-${donationData.id}.pdf`,
             content: pdfBuffer,
             contentType: 'application/pdf'
           }
         ];
       }

       await sendMail(emailOptions);
     } else {
       console.warn("⚠️ No donor email found in session");
     }

    // // ✅ Notify admin(s)
    console.log("📧 Sending admin notification to:", config.adminEmails);
    projectName = project ? project.name : "our mission";
    await sendMail({
      from: `"Africa Access Water" <${config.email.user}>`,
      to: config.adminEmails, // comma-separated list in .env
      subject: `New Donation Received: ${currency} ${amount}`,
      html: adminDonationNotificationEmail(
        donorName,
        donorEmail,
        amount,
        currency,
        projectName
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

    // Check or create donor
    let donor = await Donor.findByEmail(email);
    let donorId;

    if (!donor) {
      donorId = await Donor.create({ name, email });
      donor = { id: donorId, name, email };
    } else {
      donorId = donor.id;
    }

    // Ensure Stripe customer exists
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

    // Save donation/subscription first (status = 'initiated')
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

    // Create Stripe checkout session
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
      payment_intent_data: {
        metadata: {
          donationId,
          projectId: project_id,
          donorId
        },
      },
      metadata: {
        projectId: project_id,
        donationId: donationId,
        donorId: donorId
      },
      success_url: `${config.clientUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}&project_id=${project_id}`,
      cancel_url: `${config.clientUrl}/donation/failure`,
    });

     // Update record with checkout_session_id
     if (recurring) {
      await Subscription.updateById(donationId, {
        stripe_checkout_session_id: session.id,
      });
    } else {
      await Donation.updateById(donationId, {
        stripe_checkout_session_id: session.id,
      });
    }
    // Redirect
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
      config.stripe.webhookSecret
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
        console.log(`⏰ Session ${session.id} expired automatically`);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const donationId = intent.metadata.donationId;
        console.log(`🔄 Payment intent failed for donation: ${JSON.stringify(intent, null, 2)}`);
        if (donationId) {
          await Donation.updateById(donationId, { status: "failed" });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        console.log(`🔄 Recurring payment succeeded for subscription: ${invoice.subscription}`);
        
        // Find the subscription in our database
        const subscription = await Subscription.findByStripeId(invoice.subscription);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${invoice.subscription}`);
          break;
        }
        
        // Create a new donation record for this recurring payment
        const donationData = {
          donor_id: subscription.donor_id,
          amount: (invoice.amount_paid / 100).toFixed(2),
          currency: invoice.currency,
          status: "completed",
          interval: subscription.interval,
          stripe_payment_intent: invoice.payment_intent,
          stripe_subscription_id: invoice.subscription,
          project_id: subscription.project_id
        };
        
        const donationId = await Donation.create(donationData);
        console.log(`✅ Created donation record ${donationId} for recurring payment`);
        
        // Update project totals
        if (subscription.project_id) {
          await Project.addDonation(subscription.project_id, parseFloat(donationData.amount));
          console.log(`📊 Updated project ${subscription.project_id} with donation ${donationData.amount}`);
        }
        
        // Reuse existing email functionality by creating a mock session object
        const mockSession = {
          id: `recurring-${donationId}`,
          customer_details: {
            email: subscription.donor_email,
            name: subscription.donor_name
          },
          amount_total: invoice.amount_paid,
          currency: invoice.currency,
          payment_intent: invoice.payment_intent,
          metadata: {
            projectId: subscription.project_id
          }
        };
        
        // Reuse the existing handleDonationSuccess function
        await handleDonationSuccess(mockSession);
        console.log(`✅ Recurring payment processed successfully`);
        
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log(`❌ Recurring payment failed for subscription: ${invoice.subscription}`);
        
        // Find the subscription in our database
        const subscription = await Subscription.findByStripeId(invoice.subscription);
        if (!subscription) {
          console.error(`❌ Subscription not found: ${invoice.subscription}`);
          break;
        }
        
        // Update subscription status to past_due
        await Subscription.updateById(subscription.id, { status: "past_due" });
        console.log(`⚠️ Updated subscription ${subscription.id} status to past_due`);
        
        // Check if this is a retry attempt or first failure
        const attemptCount = invoice.attempt_count || 1;
        const isRetry = attemptCount > 1;
        
        // Auto-cancel subscription after 5 failed attempts
        if (attemptCount >= 5) {
          console.log(`🚫 Auto-canceling subscription after ${attemptCount} failed attempts`);
          await stripe.subscriptions.cancel(invoice.subscription);
          await Subscription.updateById(subscription.id, { status: "canceled" });
          
          // Send cancellation notification email
          if (subscription.donor_email) {
            console.log(`📧 Sending subscription cancellation notification to: ${subscription.donor_email}`);
            
            const cancellationEmailOptions = {
              from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
              to: subscription.donor_email,
              subject: "Subscription Cancelled - Payment Failed",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #e74c3c;">Subscription Cancelled</h2>
                  <p>Dear ${subscription.donor_name || 'Valued Donor'},</p>
                  <p>We're writing to inform you that your recurring donation subscription has been cancelled due to repeated payment failures.</p>
                  <p><strong>What happened?</strong></p>
                  <p>After 5 failed attempts to process your payment of <strong>${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}</strong>, we've automatically cancelled your subscription to prevent further failed charges.</p>
                  <p><strong>What you can do:</strong></p>
                  <ul>
                    <li>Update your payment method and create a new subscription</li>
                    <li>Contact us if you believe this was an error</li>
                    <li>Make a one-time donation instead</li>
                  </ul>
                  <p>We truly appreciate your support and hope you'll consider resubscribing once your payment method is updated.</p>
                  <p>Thank you for your understanding!</p>
                  <p>Best regards,<br>Africa Access Water Team</p>
                </div>
              `
            };
            
            await sendMail(cancellationEmailOptions);
            console.log(`✅ Subscription cancellation notification sent to ${subscription.donor_email}`);
          }
        }
        
        // Send notification email to donor about failed payment (only if not cancelled)
        if (subscription.donor_email && attemptCount < 5) {
          console.log(`📧 Sending payment failure notification to: ${subscription.donor_email} (attempt ${attemptCount})`);
          
          const subject = isRetry 
            ? `Payment Still Failed - Attempt ${attemptCount}`
            : "Payment Failed - Action Required";
          
          const retryInfo = isRetry 
            ? `<p><strong>This was attempt #${attemptCount}</strong> - Stripe will continue retrying automatically.</p>`
            : `<p>Stripe will automatically retry this payment in a few days.</p>`;
          
          const emailOptions = {
            from: `"Africa Access Water" <${process.env.EMAIL_USER}>`,
            to: subscription.donor_email,
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Payment Failed</h2>
                <p>Dear ${subscription.donor_name || 'Valued Donor'},</p>
                <p>We encountered an issue processing your recurring donation of <strong>${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}</strong>.</p>
                ${retryInfo}
                <p><strong>What happened?</strong></p>
                <ul>
                  <li>Your payment method may have expired</li>
                  <li>Insufficient funds in your account</li>
                  <li>Your bank may have declined the transaction</li>
                </ul>
                <p><strong>What you can do:</strong></p>
                <ul>
                  <li>Update your payment method in your account</li>
                  <li>Ensure sufficient funds are available</li>
                  <li>Contact your bank if the issue persists</li>
                </ul>
                <p>If you continue to experience issues, please contact us.</p>
                <p>Thank you for your continued support!</p>
                <p>Best regards,<br>Africa Access Water Team</p>
              </div>
            `
          };
          
          await sendMail(emailOptions);
          console.log(`✅ Payment failure notification sent to ${subscription.donor_email}`);
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

