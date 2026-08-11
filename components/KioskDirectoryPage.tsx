"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  QrCode,
  WifiOff,
  Wifi,
  ChevronRight,
} from "lucide-react";
import ShortLogo from "../Images/pnp_logo-cropped.svg";

export interface PricingRule {
  id: string;
  kioskId: string;
  paperSize: string;
  colorMode: string;
  duplex: boolean;
  pricePerPage: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KioskInfo {
  id: string;
  publicId: string;
  name: string;
  location: string;
  area: string;
  latitude: string;
  longitude: string;
  ipAddress: string;
  status: string;
  enabled: boolean;
  disabledReason: string | null;
  printerModel: string;
  printerStatus: string;
  lastError: string | null;
  lastErrorAt: string | null;
  paperCapacity: number;
  paperRemaining: number;
  paperLowThreshold: number;
  paperLastRefilled: string | null;
  tonerLevel: number;
  tonerLowThreshold: number;
  tonerLastReplaced: string | null;
  lastHeartbeat: string;
  createdAt: string;
  updatedAt: string;
  pricingRules: PricingRule[];
}

interface KioskDirectoryPageProps {
  kiosks: KioskInfo[];
}

export default function KioskDirectoryPage({
  kiosks,
}: KioskDirectoryPageProps) {
  const getKioskStatus = (lastHearbeat: string) => {
    const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expectedLastHeartbeat = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

    const lastHeartBeatDate: Date = new Date(lastHearbeat);

    if (lastHeartBeatDate >= expectedLastHeartbeat) {
      return "online";
    }
    
    return "online";
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F5EF]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#1F2A44]/10 bg-[#F7F5EF]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-full p-2 transition-colors hover:bg-[#1F2A44]/5"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5 text-[#1F2A44]" />
            </Link>
            <Link href="/">
              <Image src={ShortLogo} alt="short-logo" height={35} />
            </Link>
          </div>
          <span className="text-sm font-semibold text-[#1F2A44]/60">
            Print Booth Directory
          </span>
        </nav>
      </header>

      <main className="relative overflow-hidden px-4 pb-28 pt-28 sm:px-6 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#FFBF00]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#20B2AA]/10 blur-3xl"
        />

        <section className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="font-cormorant text-4xl font-bold text-[#1F2A44] sm:text-5xl md:text-6xl">
              Find Your Nearest Print Booth
            </h1>
            <p className="mx-auto mt-2 max-w-3xl text-base font-semibold text-[#1F2A44]/70 sm:text-lg">
              and get started in seconds
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {kiosks
              .sort((a, b) => a.publicId.localeCompare(b.publicId))
              .map((kiosk) => (
                <Link
                  key={kiosk.id}
                  href={`kiosk/${kiosk.id}/upload`}
                  className={`cursor-pointer ${!(getKioskStatus(kiosk.lastHeartbeat) === "online") ? "pointer-events-none opacity-50 cursor-not-allowed" : "pointer-events-auto"} group `}
                  prefetch
                  onClick={(e) => {
                    if (getKioskStatus(kiosk.lastHeartbeat) !== "online") {
                      e.preventDefault();
                    }
                  }}
                >
                  <article
                    key={kiosk.id}
                    className="mx-auto w-[95%] mb-5 rounded-2xl border border-[#1F2A44]/10 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            "https://img.freepik.com/premium-photo/image-selfservice-kiosk-with-pos-interface-customers-place-orders_1314467-44616.jpg?semt=ais_user_personalization&w=740&q=80"
                          }
                          alt={`${kiosk.name} kiosk`}
                          className="h-20 w-20 shrink-0 rounded-xl border border-[#1F2A44]/10 object-cover sm:h-24 sm:w-24"
                        />
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-extrabold text-[#1F2A44] sm:text-xl">
                            {kiosk.name}
                            <ChevronRight className="inline-block h-5 w-5 text-[#1F2A44] mb-0.5 transition-transform group-hover:translate-x-1" />
                          </h2>
                          <p className="mt-0.5 text-sm font-bold text-[#8B9584]">
                            {kiosk.publicId}
                          </p>
                          <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-[#1F2A44]/75 sm:text-base">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#20B2AA]" />
                            <span>{kiosk.location}</span>
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={getKioskStatus(kiosk.lastHeartbeat)}
                      />
                    </div>
                  </article>
                </Link>
              ))}
          </div>
        </section>

        {/* <button
          type="button"
          className="fixed max-w-[90vw] bottom-10 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#FFBF00]/40 bg-[#FFBF00] px-5 py-3 text-sm font-extrabold text-[#1F2A44] shadow-xl backdrop-blur-md transition-colors sm:text-base"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <QrCode className="h-5 w-5 text-[#1F2A44]" />
          Scan QR Instead
        </button> */}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === "online";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold uppercase tracking-wide sm:text-sm ${
        isOnline
          ? "bg-[#20B2AA]/15 text-[#1F2A44]"
          : "bg-[#D94343]/15 text-[#1F2A44]"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full animate-pulse ${isOnline ? "bg-[#20B2AA]" : "bg-[#D94343]"}`}
      />
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}
