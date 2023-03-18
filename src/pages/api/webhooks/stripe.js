import Cors from "micro-cors";
import stripeInit from "stripe";
import verifyStripe from "@webdeveducation/next-verify-stripe";

import clientPromise from "../../../lib/mongoDB";

const cors = Cors({ allowMethods: ["POST", "HEAD"] });
const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    let event;
    try {
      event = await verifyStripe({
        req,
        stripe,
        endpointSecret,
      });
    } catch (e) {
      console.error(e);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const client = await clientPromise;
        const db = client.db("roblog-next");

        const paymentIntent = event.data.object;
        const auth0id = paymentIntent.metadata.sub;

        const userProfile = await db.collection("users").updateOne(
          {
            auth0id,
          },
          {
            $inc: {
              availableTokens: 10,
            },
            $setOnInsert: {
              auth0id,
            },
          },
          {
            upsert: true,
          }
        );
      }
      default:
        console.log("UNHANDLED EVENT: ", event.type);
    }
    res.status(200).json({ received: true });
  }
};

export default cors(handler);
