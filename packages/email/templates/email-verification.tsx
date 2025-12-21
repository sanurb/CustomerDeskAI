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

export type EmailVerificationProps = {
  readonly username: string;
  readonly verifyLink: string;
};

export function EmailVerificationEmail({
  username,
  verifyLink,
}: EmailVerificationProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Verify your email address</Preview>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[480px] px-6 py-16">
            <Section>
              <Text className="m-0 font-semibold text-2xl text-neutral-800 leading-8">
                Verify your email
              </Text>

              <Text className="mt-4 mb-8 text-base text-neutral-500 leading-7">
                Thanks for signing up! Please verify your email address to get
                started.
              </Text>

              <Button
                className="inline-block rounded-lg bg-neutral-900 px-5 py-3 text-center font-medium text-sm text-white no-underline"
                href={verifyLink}
              >
                Verify email address
              </Button>
            </Section>

            <Section className="mt-12">
              <Text className="m-0 text-neutral-400 text-sm leading-6">
                If the button doesn't work, copy this link:
              </Text>
              <Text className="m-0 mt-1">
                <Link
                  className="text-neutral-500 text-sm leading-6 underline"
                  href={verifyLink}
                >
                  {verifyLink}
                </Link>
              </Text>
            </Section>

            <Section className="mt-12 border-neutral-100 border-t pt-8">
              <Text className="m-0 text-neutral-400 text-xs leading-5">
                This verification was requested for {username}. If you didn't
                create an account, you can safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

EmailVerificationEmail.PreviewProps = {
  username: "john.doe@example.com",
  verifyLink: "https://app.example.com/verify-email?token=abc123",
} satisfies EmailVerificationProps;
