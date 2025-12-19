
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {sendInviteEmail} from "./send-invite-email";

// Initialize the Firebase Admin SDK.
admin.initializeApp();


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  const serverTime = admin.firestore.Timestamp.now().toDate().toISOString();
  response.send(`Hello from Firebase! The server time is: ${serverTime}`);
});

export const sendInvite = onCall(async (request) => {
  logger.info("sendInvite function triggered", { data: request.data });
  try {
    const result = await sendInviteEmail(request.data);
    logger.info("sendInviteEmail flow completed", { result });
    return result;
  } catch (error) {
    logger.error("Error calling sendInviteEmail flow", { error });
    if (error instanceof Error) {
      throw new HttpsError('internal', error.message, { stack: error.stack });
    }
    throw new HttpsError('internal', "An unknown error occurred when calling the sendInviteEmail flow.");
  }
});
