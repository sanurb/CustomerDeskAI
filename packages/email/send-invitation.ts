/**
 * @fileoverview Organization invitation email handler.
 *
 * Single-purpose module for sending invitation emails.
 * Designed for direct use with Better-Auth nile plugin.
 */

import { resend as client } from ".";
import { keys } from "./keys";
import {
  OrgInvitationEmail,
  type OrgInvitationProps,
} from "./templates/org-invitation";

/**
 * Invitation data from Better-Auth nile plugin callback.
 */
export type InvitationData = {
  readonly id: string;
  readonly email: string;
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly logo?: string | null;
  };
  readonly inviter: {
    readonly user: {
      readonly id: string;
      readonly name: string;
      readonly email: string;
    };
  };
};

function buildInviteUrl(invitationId: string): string {
  const env = keys();
  const baseUrl =
    env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : env.BETTER_AUTH_URL;

  return `${baseUrl}/accept-invitation/${invitationId}`;
}

function mapToTemplateProps(data: InvitationData): OrgInvitationProps {
  return {
    username: data.email,
    invitedByUsername: data.inviter.user.name,
    invitedByEmail: data.inviter.user.email,
    teamName: data.organization.name,
    inviteLink: buildInviteUrl(data.id),
  };
}

/**
 * Sends organization invitation email.
 *
 * @example
 * ```ts
 * // In Better-Auth config
 * nile({
 *   sendInvitationEmail: sendOrganizationInvitation,
 * })
 * ```
 */
export async function sendOrganizationInvitation(
  data: InvitationData
): Promise<void> {
  const env = keys();
  const props = mapToTemplateProps(data);

  const { error, data: result } = await client.emails.send({
    from: env.RESEND_FROM,
    to: data.email,
    subject: `Join ${data.organization.name} on CustomerDeskAI`,
    react: OrgInvitationEmail(props),
  });

  if (error) {
    console.error(
      `[Email] Invitation failed for ${data.email}:`,
      error.message
    );
    throw new Error(`Failed to send invitation: ${error.message}`);
  }

  console.log(`[Email] Invitation sent to ${data.email}, id: ${result?.id}`);
}
