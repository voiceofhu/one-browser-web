import { APP_NAME } from "@/app"
import type { LegalContentCollection } from "@/local/types"

export const enUSLegal = {
  terms: {
    title: "Terms of Service",
    description: `General terms for accessing and using ${APP_NAME}.`,
    sections: [
      {
        title: "1. Acceptance of terms",
        body: `By accessing or using ${APP_NAME}, you agree to follow these terms and any policies referenced from the service. If you use the service on behalf of an organization, you confirm that you are authorized to do so.`,
      },
      {
        title: "2. Account responsibilities",
        body: "You are responsible for keeping your account credentials secure and for activity performed through your account. Notify your administrator if you believe your account has been accessed without authorization.",
      },
      {
        title: "3. Acceptable use",
        body: "Use the service only for lawful and authorized purposes. Do not attempt to disrupt the service, bypass access controls, misuse data, or interfere with other users or systems.",
      },
      {
        title: "4. Service availability",
        body: "We aim to keep the service reliable, but availability may vary due to maintenance, updates, network conditions, or operational issues. Features may change as the product evolves.",
      },
      {
        title: "5. Content and data",
        body: "You retain responsibility for the data you submit or manage through the service. You should only upload, enter, or process information that you have the right to use.",
      },
      {
        title: "6. Limitation of liability",
        body: "The service is provided on a reasonable-effort basis. To the extent permitted by applicable law, we are not liable for indirect, incidental, or consequential damages arising from use of the service.",
      },
      {
        title: "7. Changes",
        body: "These terms may be updated from time to time. Continued use of the service after an update means you accept the revised terms.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: `A general overview of how ${APP_NAME} handles information.`,
    sections: [
      {
        title: "1. Information we process",
        body: `${APP_NAME} may process account details, profile settings, operational records, login records, browser or device metadata, and other information needed to provide administrative features.`,
      },
      {
        title: "2. How information is used",
        body: "Information is used to authenticate users, provide the product, maintain security, troubleshoot issues, audit operations, improve reliability, and support administrator workflows.",
      },
      {
        title: "3. Cookies and sessions",
        body: "The service may use cookies or similar browser storage to keep users signed in, remember preferences, and protect sessions. You can manage browser storage through your browser settings.",
      },
      {
        title: "4. Sharing",
        body: "Information is not sold. It may be shared with service providers or infrastructure systems when necessary to operate, secure, or support the service, or when required by law.",
      },
      {
        title: "5. Security and retention",
        body: "Reasonable technical and organizational safeguards are used to protect information. Data is kept only as long as needed for product, security, operational, or legal purposes.",
      },
      {
        title: "6. Your choices",
        body: "Depending on your organization and applicable law, you may request access, correction, export, or deletion of certain information through your administrator.",
      },
      {
        title: "7. Updates",
        body: "This policy may be updated as the service changes. Material updates should be reviewed before continuing to use the service.",
      },
    ],
  },
} satisfies LegalContentCollection
