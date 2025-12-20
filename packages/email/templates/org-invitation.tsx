import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type OrgInvitationProps = {
  readonly username: string;
  readonly invitedByUsername: string;
  readonly invitedByEmail: string;
  readonly teamName: string;
  readonly inviteLink: string;
};

export function OrgInvitationEmail({
  username,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: OrgInvitationProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          {invitedByUsername} invited you to join {teamName}
        </Preview>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[480px] px-6 py-16">
            <Section>
              <Text className="m-0 text-base text-neutral-800 leading-7">
                <strong>{invitedByUsername}</strong> has invited you to join{" "}
                <strong>{teamName}</strong>.
              </Text>

              <Text className="mt-4 mb-8 text-base text-neutral-500 leading-7">
                Accept the invitation to start collaborating with your team.
              </Text>

              <Button
                className="inline-block rounded-lg bg-neutral-900 px-5 py-3 text-center font-medium text-sm text-white no-underline"
                href={inviteLink}
              >
                Join {teamName}
              </Button>
            </Section>

            <Section className="mt-12">
              <Text className="m-0 text-neutral-400 text-sm leading-6">
                If the button doesn't work, copy this link:
              </Text>
              <Text className="m-0 mt-1">
                <Link
                  className="text-neutral-500 text-sm leading-6 underline"
                  href={inviteLink}
                >
                  {inviteLink}
                </Link>
              </Text>
            </Section>

            <Section className="mt-12 border-neutral-100 border-t pt-8">
              <Text className="m-0 text-neutral-400 text-xs leading-5">
                This invitation was sent to {username} by{" "}
                <Link
                  className="text-neutral-400 underline"
                  href={`mailto:${invitedByEmail}`}
                >
                  {invitedByEmail}
                </Link>
                . If you weren't expecting this, ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

OrgInvitationEmail.PreviewProps = {
  username: "john.doe@example.com",
  invitedByUsername: "Jane Smith",
  invitedByEmail: "jane@acme.com",
  teamName: "Acme Inc",
  inviteLink: "https://app.example.com/accept-invitation/abc123",
} satisfies OrgInvitationProps;
