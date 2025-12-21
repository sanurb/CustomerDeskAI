/**
 * @fileoverview Email verification handler.
 *
 * Single-purpose module for sending verification emails.
 * Designed for direct use with Better-Auth emailVerification config.
 */

import { resend as client } from ".";
import { keys } from "./keys";
import {
  EmailVerificationEmail,
  type EmailVerificationProps,
} from "./templates/email-verification";

/**
 * Verification data from Better-Auth callback.
 */
export type VerificationData = {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name?: string | null;
    readonly emailVerified: boolean;
  };
  readonly url: string;
  readonly token: string;
};

function mapToTemplateProps(data: VerificationData): EmailVerificationProps {
  return {
    username: data.user.email,
    verifyLink: data.url,
  };
}

/**
 * Sends email verification.
 *
 * @example
 * ```ts
 * // In Better-Auth config
 * emailVerification: {
 *   sendVerificationEmail: sendEmailVerification,
 *   sendOnSignUp: true,
 * }
 * ```
 */
export async function sendEmailVerification(
  data: VerificationData
): Promise<void> {
  const env = keys();
  const props = mapToTemplateProps(data);

  const { error, data: result } = await client.emails.send({
    from: env.RESEND_FROM,
    to: data.user.email,
    subject: "Verify your email address",
    react: EmailVerificationEmail(props),
  });

  if (error) {
    console.error(
      `[Email] Verification failed for ${data.user.email}:`,
      error.message
    );
    throw new Error(`Failed to send verification: ${error.message}`);
  }

  console.log(
    `[Email] Verification sent to ${data.user.email}, id: ${result?.id}`
  );
}
