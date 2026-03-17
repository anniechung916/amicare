import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmiCare - Never Fight Insurance Again | Get Reimbursed for Out-of-Network Care",
  description:
    "AmiCare handles insurance claims, denials, and appeals so you can see any doctor. We predict reimbursement, fight for your money, and only charge when you win.",
  openGraph: {
    title: "AmiCare - Never Fight Insurance Again",
    description:
      "See any doctor you want. We handle insurance claims, denials, and appeals. Only pay when you get paid.",
    type: "website",
    url: "https://amicare.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "AmiCare - Never Fight Insurance Again",
    description:
      "See any doctor you want. We handle insurance claims, denials, and appeals. Only pay when you get paid.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
