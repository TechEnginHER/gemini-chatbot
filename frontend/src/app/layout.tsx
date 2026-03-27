import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const metadata = {
  title: "Petals",
  description: "A creative canvas for your memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} antialiased text-[#301934]`}
      >
        <div className="fixed inset-0 bg-gradient-to-br from-[#E6E6FA] via-[#FFD1DC] to-[#FDFBF7] -z-10" />
        {children}
      </body>
    </html>
  );
}
