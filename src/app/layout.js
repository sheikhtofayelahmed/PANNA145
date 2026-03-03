import "src/globals.css";
import { Hind_Siliguri } from "next/font/google";

const banglaFont = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "700"],
  variable: "--font-bangla",
  display: "swap",
});

export default function RooN786yout({ children }) {
  return (
    <html lang="bn" className={banglaFont.variable} suppressHydrationWarning>
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
