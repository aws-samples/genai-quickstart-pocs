// amplify/functions/user-signup-notification/handler.mjs
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  console.log("Cognito trigger event:", JSON.stringify(event, null, 2));

  // Handle preSignUp trigger for email domain validation
  if (event.triggerSource === 'PreSignUp_SignUp') {
    const email = event?.request?.userAttributes?.email;
    
    if (!email || !email.endsWith('@amazon.com')) {
      throw new Error('Only @amazon.com email addresses are allowed');
    }
    
    console.log("Email domain validation passed for:", email);
    return event;
  }

  // Handle postConfirmation trigger for notifications
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    try {
      const attrs = event?.request?.userAttributes ?? {};
      const email = attrs.email;
      const name = attrs.name ?? "Not provided";

      if (process.env.SNS_TOPIC_ARN) {
        const subject = "🚨 New User Signup Alert";
        const body = [
          "New user has signed up!",
          "",
          `Email: ${email ?? "No email"}`,
          `Name: ${name}`,
          `Timestamp: ${new Date().toISOString()}`
        ].join("\n");

        await sns.send(new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: subject,
          Message: body,
        }));

        console.log("User signup notification sent.");
      } else {
        console.warn("SNS_TOPIC_ARN not set; skipping notification.");
      }
    } catch (err) {
      console.error("Error sending signup notification:", err);
      // Don't block sign-up on notification failure
    }
  }

  return event; // required by Cognito triggers
};
