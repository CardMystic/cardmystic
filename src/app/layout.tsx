import {
  Navbar,
  NavbarItem,
  NavbarSection,
} from "@/components/catalyst/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarItem,
  SidebarSection,
} from "@/components/catalyst/sidebar";
import { StackedLayout } from "@/components/catalyst/stacked-layout";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "mana-font/css/mana.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CardMystic",
  description: "CardMystic is an AI search applicaation for magic cards.",
};

const navItems = [
  { label: "Home", url: "/" },
  { label: "Search", url: "/search" },
  { label: "About", url: "/about" },
];
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StackedLayout
          navbar={
            <Navbar>
              <NavbarSection className="max-lg:hidden">
                {navItems.map(({ label, url }) => (
                  <NavbarItem key={label} href={url}>
                    {label}
                  </NavbarItem>
                ))}
              </NavbarSection>
            </Navbar>
          }
          sidebar={
            <Sidebar>
              <SidebarBody>
                <SidebarSection>
                  {navItems.map(({ label, url }) => (
                    <SidebarItem key={label} href={url}>
                      {label}
                    </SidebarItem>
                  ))}
                </SidebarSection>
              </SidebarBody>
            </Sidebar>
          }
        >
          {children}
        </StackedLayout>
      </body>
    </html>
  );
}
