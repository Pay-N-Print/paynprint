"use client";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { User } from "@/app/kiosk/[kioskId]/review/[draftId]/page"

interface Props {
  isOpen: boolean;
  onConfirm: (phone: string) => void;
  onSkip: () => void;
  user?: User;
  initialPhone?: string;
}

export default function UserInfoModal({ isOpen, onConfirm, initialPhone, onSkip, user }: Props) {
  const [rawDigits, setRawDigits] = useState(initialPhone ? initialPhone.slice(2) : ""); // store only 10 digits, remove +91 if present
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400); // reset after animation
  };

  // Animate in when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10); // small delay triggers CSS transition
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Display: "98765 43210" — space after 5 digits
  const formatDisplay = (digits: string) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      setRawDigits((prev) => prev.slice(0, -1));
      setError("");
      return;
    }
    // Block non-digits
    if (e.key.length === 1 && !/\d/.test(e.key)) {
        e.preventDefault();
        triggerShake();
      return;
    }
    // Block beyond 10 digits
    if (/\d/.test(e.key) && rawDigits.length >= 10) {
      e.preventDefault();
      triggerShake();
      return;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawDigits(digits);
    setError("");
  };

  const handleConfirm = () => {
    if (rawDigits.length !== 10) {
      setError("Please enter a valid 10-digit number");
      return;
    }
    onConfirm(`91${rawDigits}`); // internally always clean 10 digits with country code
  };

  const isValid = rawDigits.length === 10;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{
        background: visible ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)",
        transition: "background 0.3s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      {/* Sheet — slides up */}
      <div
        className="w-full bg-white rounded-t-2xl px-6 pt-4 pb-10"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#25D366" }}
          >
            <WhatsAppIcon />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">
              Get your print code on WhatsApp
            </p>
            <p className="text-xs text-gray-500">
              We don't have your phone number yet
            </p>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Your print code will be sent after payment. Add your WhatsApp number
          to receive it instantly.
        </p>

        {/* Phone input */}
        <div
          className={`flex items-center border rounded-lg overflow-hidden mb-1
  ${error ? "border-red-400" : "border-gray-200 focus-within:border-gray-400"}
  ${shake ? "border-red-600 animate-shake" : ""}
`}
        >
          <span className="px-3 text-sm text-gray-500 border-r border-gray-300 h-12 flex items-center font-medium">
            +91
          </span>
          <input
            ref={inputRef}
            type="tel"
            value={formatDisplay(rawDigits)} // display with space
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="89198 92827"
            className="flex-1 px-3 h-12 text-base outline-none bg-transparent tracking-wide"
            inputMode="numeric"
          />
          {rawDigits.length > 0 && (
            <span className="px-3 -ml-6 text-xs text-gray-400 tabular-nums">
              {rawDigits.length}/10
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-500 mb-3 h-4">{error}</p>
        ) : (
          <div className="mb-3 h-4" />
        )}

        <div className="flex w-full h-full justify-center items-center">
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-fit px-6 h-12 rounded-lg text-sm font-bold text-[#1F2A44]
            bg-[#FFBF00] disabled:opacity-60 transition-opacity mb-2"
          >
            Confirm & continue
          </button>
        </div>

        <div className="flex flex-row w-full h-full justify-center items-center">
          <div className="h-px mr-2 w-[33%] bg-gray-500"></div>
          OR
          <div className="h-px ml-2 w-[33%] bg-gray-500"></div>
        </div>

        {/* <button onClick={onSkip} className="w-full h-10 text-xs text-gray-400">
          Skip, send to email only
        </button> */}

        <button
          type="button"
          className="flex mt-2 w-full items-center justify-center gap-3 rounded-xl border border-[#1F2A44]/15 bg-white px-5 py-4 text-base font-bold text-[#1F2A44] transition-all hover:-translate-y-px hover:border-[#1F2A44]/30 hover:shadow-md"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <GoogleIcon />
          {user ? "Continue with Google" : "Sign up with Google"}
        </button>

        <p className="mt-4 text-center text-xs font-semibold text-[#1F2A44]/60 sm:text-sm">
          By signing in with Google, your print code will be sent to your Google
          account's email inbox.
        </p>
      </div>
    </div>
  );
}

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.528 5.845L0 24l6.335-1.508A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.794 9.794 0 01-5.007-1.374l-.36-.214-3.726.887.926-3.618-.235-.372A9.794 9.794 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
  </svg>
);

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.194 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.841 1.154 7.955 3.045l5.657-5.657C34.139 6.053 29.318 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819A11.958 11.958 0 0 1 24 12c3.059 0 5.841 1.154 7.955 3.045l5.657-5.657C34.139 6.053 29.318 4 24 4c-7.681 0-14.355 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.212 0 9.996-1.997 13.557-5.255l-6.264-5.299A11.944 11.944 0 0 1 24 36c-5.173 0-9.62-3.316-11.283-7.946l-6.524 5.025C9.499 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.057 12.057 0 0 1-4.01 5.446l.003-.002 6.264 5.299C37.156 39.09 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

