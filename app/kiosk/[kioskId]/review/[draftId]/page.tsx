"use client";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  PenIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import NotificationMessages, {
  getErrorMessage,
} from "@/components/NotificationMessages";
import { useRouter, useParams } from "next/navigation";
import { useNotification } from "@/components/Notification";
import Loading from "@/components/Loading";
import Link from "next/link";
import Image from "next/image";
import ShortLogo from "@/Images/pnp_logo-cropped.svg";
import userInfoModal from "../../../../../components/UserInfoModal";
import UserInfoModal from "../../../../../components/UserInfoModal";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import Script from "next/script";

interface OrderPreviewProps {
  fileName: string;
  pageCount: number;
  paperSize?: string;
  copies: number;
  colorMode: string;
  sides: string;
  kioskId?: string;
  subtotal: number;
  total: number;
  paymentRef?: string;
  paymentComplete?: boolean;
  isProcessing?: boolean;
  handlePayment: () => void;
  ArchivePrintJob: () => void;
  basePriceType: string;
  basePrice: number;
  onConfirm?: () => void;
}

interface PrintDraftObject {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
  userEmail: string | null;
  userPhone: string | null;
  sessionId: string;
  expiresAt: Date;
  fileId: string;
  status: string;
  kioskId: string;
  copies: number;
  colorMode: string;
  paperSize: string;
  pagesToPrint: string;
  duplex: boolean;
  orientation: string | null;
  pricePerPage: string;
  totalPages: number;
  sheetsNeeded: number;
  totalPrice: string;
  paymentId: string | null;
  paymentStatus: string | null;
  printJobId: string | null;
  completedAt: Date | null;
  subtotal: string;
  gstRatePercent: number;
  gstAmount: string;
}

export interface CurrentFileDetails {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  pageCount: number;
  uploadedAt: Date;
  previewAvailable: string;
}

export interface CurrentKioskDetails {
  id: string;
  publicId: string;
  name: string;
  location: string;
  lastHeartBeat: string;
  paperRemaining: number;
}

interface PrintDraftResponse {
  draft: PrintDraftObject;
  file: CurrentFileDetails;
  kiosk: CurrentKioskDetails;
}

interface kioskObject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  publicId: string;
  location: string;
  area: string | null;
  latitude: string | null;
  longitude: string | null;
  ipAddress: string | null;
  status: string;
  enabled: boolean;
  disabledReason: string | null;
  printerModel: string | null;
  printerStatus: string | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  paperCapacity: number;
  paperRemaining: number;
  paperLowThreshold: number;
  paperLastRefilled: Date | null;
  tonerLevel: number;
  tonerLowThreshold: number;
  tonerLastReplaced: Date | null;
  lastHeartbeat: Date | null;
}

interface PaymentData {
  orderId: string;
  state: string;
  expiresAt: number;
  redirectUrl: string;
}
interface PaymentResponse {
  success: string;
  payData: PaymentData;
}

interface userDetailsReponse {
  isLoggedIn: boolean;
  user?: User;
  draftPhoneNumber?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
}

export interface PrintJobObject {
  id: string;
  printCode: string;
  fileId: string;
  fileName: string;
  kioskId: string | null;
  kioskName: string;
  kioskLocation: string | null;
  copies: number;
  colorMode: string;
  paperSize: string;
  pagesToPrint: string;
  duplex: boolean;
  pageCount: number;
  totalPages: number;
  sheetsUsed: number;
  pricePerPage: string;
  totalPrice: string;
  paymentStatus: string;
  status: string;
  codeExpiresAt: Date;
  createdAt: Date;
}

interface PrintJobResponse {
  success: boolean;
  message: string;
  job: PrintJobObject;
  notifications: {
    email: boolean;
  };
  warnings: string[];
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

function formatLabel(mode: string) {
  return mode === "color" ? "Color" : "B/W";
}

function formatPaperSize(size?: string) {
  if (!size) return "A4";
  return size.toUpperCase();
}

declare global {
  interface Window {
    PhonePeCheckout: any;
  }
}


export default function OrderPreview() {
  // {
  //   fileName,
  //   pageCount,
  //   paperSize,
  //   copies,
  //   colorMode,
  //   sides,
  //   kioskId = "kiosk_001",
  //   subtotal,
  //   total,
  //   paymentRef = "TXN-20240218112345",
  //   paymentComplete = false,
  //   isProcessing = false,
  //   handlePayment = () => {},
  //   ArchivePrintJob = () => {},
  //   basePrice,
  //   basePriceType,
  //   onConfirm,
  // }: OrderPreviewProps) {
  const params = useParams<{ draftId: string; kioskId: string }>();
  const router = useRouter();
  const { showError } = useNotification();
  const draftId = params?.draftId;
  const kioskId = params?.kioskId;

  const pricing = {
    bw: { single: 1.86, double: 3.50 },
    color: { single: 8.50, double: 16.50 },
  };

  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [currentDraftDetails, setCurrentDraftDetails] =
    useState<PrintDraftObject | null>(null);
  const [currentFileDetails, setCurrentFileDetails] =
    useState<CurrentFileDetails | null>(null);
  const [currentKioskDetails, setCurrentKioskDetails] =
    useState<CurrentKioskDetails | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [res, setRes] = useState<PaymentResponse>();
  const [phonepeScriptUploaded, setPhonepeScriptUploaded] =
    useState<Boolean>(false);
  const [userLoggedIn, SetUserLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [showUserInfoModal, setShowuserInfoPhoneModal] = useState(false);
  const [printJobId, setPrintJobId] = useState<string>("");
  const [Total, setTotal] = useState<number>(0);
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PHONE_CACHE_KEY = "pnp_phone";

  function getCachedPhone(): string | null {
    if (typeof window === "undefined") return null;
    try {
      console.log(
        "Cached phone number retrieved:",
        localStorage.getItem(PHONE_CACHE_KEY),
      );
      return localStorage.getItem(PHONE_CACHE_KEY);
    } catch {
      // Safari private browsing, storage disabled, etc.
      return null;
    }
  }

  function setCachedPhone(phone: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PHONE_CACHE_KEY, phone);
      console.log("Phone number cached:", phone);
    } catch {
      // non-fatal — just means it won't prefill next time
    }
  }

  async function handlePay(phone?: string) {
    console.log("Handling payment with phone:", phone);
    setError(null);

    if (!scriptReady || !window.Razorpay) {
      showError(
        getErrorMessage(
          undefined,
          "Payment gateway is still loading. Please try again in a moment.",
        ),
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: create order server-side

      const orderRes = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payment/create-order`,
        { draftId },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!orderRes.data) {
        const body = await orderRes.data.catch(() => ({}));
        throw new Error(body.error || "Could not start payment");
      }

      const order = await orderRes.data;

      // Step 2: open Razorpay Standard Checkout modal
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "PayNPrint",
        description: "Print job payment",
        order_id: order.order_id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: phone || "",
        },
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          paylater: false,
        },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(true);
          setIsLoading(true);
          setLoadingMessage("Confirming your payment");
          try {
            const verifyRes = await axios.post(
              `${process.env.NEXT_PUBLIC_SERVER_URL}/api/payment/verify-payment`,
              JSON.stringify({ ...response, draftId }),
              {
                withCredentials: true,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );

            const verifyBody = await verifyRes.data;

            if (verifyRes.status !== 200 || !verifyBody.success) {
              throw new Error(
                verifyBody.error || "Payment verification failed",
              );
            }
            setShowuserInfoPhoneModal(false);
            setPrintJobId(verifyBody.printJobId);
            setPaymentStatus("success");

            // onSuccess({
            //   printJobId: verifyBody.printJobId,
            //   printCode: verifyBody.printCode,
            //   expiresAt: verifyBody.expiresAt,
            // });
          } catch (err: any) {
            setShowuserInfoPhoneModal(false);
            setPaymentStatus("error");
            const message = err.message || "Payment verification failed";
            showError(getErrorMessage(message, "Payment verification failed."));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed the modal without paying
          ondismiss: () => {
            setLoading(false);
            setShowuserInfoPhoneModal(false);
            setPaymentStatus("idle");
            showError(getErrorMessage(undefined, "Payment cancelled."));
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Payment failed inside the modal (card declined, etc.)
      rzp.on("payment.failed", (resp: any) => {
        setLoading(false);
        setShowuserInfoPhoneModal(false);
        setPaymentStatus("error");
        showError(
          getErrorMessage(undefined, "Payment failed. Please try again."),
        );
      });

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setShowuserInfoPhoneModal(false);
      setPaymentStatus("error");
      showError(
        getErrorMessage(undefined, "Something went wrong. Please try again."),
      );
    }
  }

  const saveDraftPhoneNumber = async (phone: string) => {
    console.log("Saving phone number to draft:", phone);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/drafts/${draftId}/phone`,
        { userPhone: phone },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err: any) {
      console.error("Error saving phone number to draft:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          "Failed to save your phone number. You can still continue with payment.",
        ),
      );
    }
  };

  const calculateTotal = () => {
    const pages = currentFileDetails?.pageCount ?? 0;
    const copies = currentDraftDetails?.copies;
    const pricingObject =
      currentDraftDetails?.colorMode === "bw" ? "bw" : "color";
    const price = pricing[pricingObject];
    if (currentDraftDetails?.duplex !== true) {
      return {
        subtotal: pages * price.single,
        total: pages * price.single * (copies ?? 1),
      };
    }
    const sheets = Math.floor(pages / 2);
    const hasExtraPage = pages % 2 !== 0;

    const perCopyTotal =
      sheets * price.double + (hasExtraPage ? price.single : 0);

    return {
      subtotal: perCopyTotal,
      total: perCopyTotal * (copies ?? 1),
    };
  };

  const generateMerchantOrderId = (): string => {
    const randomStr = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();
    return `PNP-${randomStr}-${timestamp}`;
  };

  // function callback(response: string) {
  //   if (response === "USER_CANCEL") {
  //     /* Add merchant's logic if they have any custom thing to trigger on UI after the transaction is cancelled by the user*/
  //     console.log("Transaction cancelled by user");
  //     setPaymentStatus("idle");
  //     setIsLoading(false);
  //     setRes(undefined);
  //     return;
  //   } else if (response === "CONCLUDED") {
  //     console.log("Transaction concluded successfully");
  //     setShowuserInfoPhoneModal(false);
  //     setPaymentStatus("success");
  //     // setIsLoading(false);
  //     /* Add merchant's logic if they have any custom thing to trigger on UI after the transaction is in terminal state*/
  //     return;
  //   }
  // }

  const updateJobPaymentStatus = async (jobId: string, status: string) => {
    setIsLoading(true);
    setLoadingMessage("Updating payment status");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/printorder/updatePayment/${jobId}`,
        {
          status: status,
          transactionId: res?.payData.orderId || "N/A",
        },
      );
      if (response.status === 200) {
        console.log("Payment status updated successfully");
      }
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          NotificationMessages.PAYMENT_STATUS_UPDATE,
        ),
      );
    }
  };

  // const handlePayment = async () => {
  //   setIsLoading(true);
  //   setLoadingMessage("Redirecting to payment gateway");
  //   setPaymentStatus("processing");
  //   const merchantOrderId = generateMerchantOrderId();
  //   try {
  //     const ApiRes = await axios.post("/api/phonepe/createPayment", {
  //       merchantOrderId: merchantOrderId,
  //       amount: Number(currentDraftDetails!.totalPrice) * 100, // Amount in paise
  //     });
  //     console.log("Response:", ApiRes.data);
  //     setRes(ApiRes.data as PaymentResponse);

  //     if (window && window.PhonePeCheckout && window.PhonePeCheckout.transact) {
  //       console.log("PhonePeCheckout is available", window.PhonePeCheckout);
  //       console.log("res : ", res);
  //       console.log("response : ", ApiRes.data);
  //       window.PhonePeCheckout.transact({
  //         tokenUrl: ApiRes.data?.payData.redirectUrl,
  //         callback,
  //         type: "IFRAME",
  //       });
  //     }
  //   } catch (err: any) {
  //     console.error("Axios error:", err.response?.data || err.message);
  //     showError(
  //       getErrorMessage(
  //         err?.response?.data?.error,
  //         NotificationMessages.PAYMENT_INIT,
  //       ),
  //     );
  //     setPaymentStatus("error");
  //     // setIsLoading(false);
  //   }
  // };

  const handleUserPayClick = async () => {
    console.log("Handling user pay click");
    setIsLoading(true);
    setLoadingMessage("Fetching Your Details");
    if (
      currentFileDetails?.pageCount &&
      currentDraftDetails?.copies &&
      currentKioskDetails?.paperRemaining
    ) {
      if (
        currentFileDetails?.pageCount * currentDraftDetails?.copies >
        currentKioskDetails?.paperRemaining
      ) {
        showError(
          getErrorMessage(
            undefined,
            "Not enough paper in the print booth to complete this print order. Please contact support.",
          ),
        );
        setIsLoading(false);
        return;
      }
    }
    console.log("page count ok");
    try {
      const userDetails = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/user/${draftId}`,
        { withCredentials: true },
      );
      console.log(
        "Auth user details response:",
        userDetails,
        userDetails.status,
      );
      if (userDetails.status === 200) {
        const userDataResponse = userDetails.data as userDetailsReponse;
        if (userDataResponse.isLoggedIn) {
          SetUserLoggedIn(true);
          setUser(userDataResponse.user);
          const prefillPhone =
            userDataResponse.user?.phoneNumber ||
            userDataResponse.draftPhoneNumber ||
            getCachedPhone() ||
            undefined;

          console.log("Prefill phone number:", prefillPhone);

          if (prefillPhone) {
            setPhoneNumber(prefillPhone);
          }
          setShowuserInfoPhoneModal(true);
          setIsLoading(false);
          return;
        }
        const prefillPhone = getCachedPhone() || undefined;

        console.log("Prefill phone number:", prefillPhone);

        if (prefillPhone) {
          setPhoneNumber(prefillPhone);
        }
        setShowuserInfoPhoneModal(true);
      }
      SetUserLoggedIn(false);
      setUser(undefined);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching user status:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          NotificationMessages.USER_FETCH,
        ),
      );
    }
  };

  // const createPrintJob = async () => {
  //   setIsLoading(true);
  //   setLoadingMessage("Getting everything ready for your print");
  //   try {
  //     const printJobResponse = await axios.post(
  //       `${process.env.NEXT_PUBLIC_SERVER_URL}/api/printorder/`,
  //       {
  //         draftId: draftId,
  //       },
  //       {
  //         withCredentials: true,
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       },
  //     );

  //     if (printJobResponse.status === 201) {
  //       const printJobResponseData = printJobResponse.data as PrintJobResponse;
  //       setPrintJobId(printJobResponseData.job.id);
  //       await handlePayment();
  //       // setPaymentStatus("success");
  //     }
  //   } catch (err: any) {
  //     console.error("Error creating print job:", err);
  //     showError(
  //       getErrorMessage(
  //         err?.response?.data?.error,
  //         NotificationMessages.PRINT_JOB_CREATE,
  //       ),
  //     );
  //   }
  // };

  const sendEmail = async () => {
    setIsLoading(true);
    setLoadingMessage("Sending confirmation email");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/printorder/sendEmail/${printJobId}`,
        {
          email: "yashrajvarma9@gmail.com",
        },
      );
      setEmailSent(true);
    } catch (err: any) {
      console.error("Error sending email:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          NotificationMessages.EMAIL_SEND,
        ),
      );
      setEmailSent(false);
    }
  };

  const sendWhatsappMessage = async () => {
    setIsLoading(true);
    setLoadingMessage("Sending Whatsapp Message");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/printorder/sendWhatsapp/${printJobId}`,
        {
          phoneNumber: phoneNumber,
        },
      );
      setEmailSent(true);
    } catch (err: any) {
      console.error("Error sending Whatsapp Message:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          NotificationMessages.WHATSAPP_SEND,
        ),
      );
      setEmailSent(false);
    }
  };

  const editPrintDetails = () => {
    if (draftId) {
      router.push(`/kiosk/${kioskId}/upload?drId=${draftId}`);
      setIsLoading(false);
      return;
    }
    showError(
      getErrorMessage(
        undefined,
        "Something Went Wrong, Please try again Later!",
      ),
    );
  };

  const SetDraftDetailsFromServer = async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setLoadingMessage("Getting things ready for your print");
    try {
      const printDraftResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/drafts/${draftId}`,
        { withCredentials: true },
      );
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(2000 - elapsed, 0);
      setTimeout(() => {
        if (printDraftResponse.status == 200) {
          const responseData = printDraftResponse.data as PrintDraftResponse;
          setCurrentDraftDetails(responseData.draft);
          setCurrentFileDetails(responseData.file);
          setCurrentKioskDetails(responseData.kiosk);
          setIsLoading(false);
          return responseData;
        }
        throw new Error(
          `Failed to Fetch print job: ${printDraftResponse.statusText}`,
        );
      }, remaining);
    } catch (err: any) {
      console.error("Error Fetching print job details:", err);
      showError(
        getErrorMessage(
          err?.response?.data?.error,
          NotificationMessages.REVIEW_FETCH,
        ),
      );
      setIsLoading(false);
      return {
        draft: {} as PrintDraftObject,
        file: {} as CurrentFileDetails,
        kiosk: {} as CurrentKioskDetails,
      } as PrintDraftResponse;
    }
  };

  useEffect(() => {
    if (currentKioskDetails) {
      const kioskStatus = getKioskStatus(currentKioskDetails.lastHeartBeat);
      if (kioskStatus !== "online") {
        setPhonepeScriptUploaded(false);
      }
    }
  }, [currentKioskDetails]);

  useEffect(() => {
    if (!draftId) {
      router.push("/upload");
      return;
    }
    SetDraftDetailsFromServer();
  }, [draftId]);

  useEffect(() => {
    if (paymentStatus === "success") {
      // sendEmail(); // Should be from backend
      // sendWhatsappMessage(); // Should be from backend
      router.push(`/kiosk/${kioskId}/success/${printJobId}`);
    }
  }, [paymentStatus]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const script = document.createElement("script");
    script.src = "https://mercury.phonepe.com/web/bundle/checkout.js";
    script.async = true;
    script.onload = () => {
      setPhonepeScriptUploaded(true);
      console.log("PhonePe script loaded", window.PhonePeCheckout);
    };
    document.body.appendChild(script);
  }, []);

  const getKioskStatus = (lastHearbeat: string) => {
    // const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
    // const expectedLastHeartbeat = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

    // const lastHeartBeatDate: Date = new Date(lastHearbeat);

    // if (lastHeartBeatDate >= expectedLastHeartbeat) {
    //   return "online";
    // }

    // return "offline";

    return "online";
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] w-full max-w-full">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="afterInteractive"
      />
      {isLoading ? (
        <Loading text={loadingMessage} />
      ) : (
        <>
          <header className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5EF]/95 backdrop-blur-md border-b border-[#1F2A44]/10">
            <nav className="max-w-7xl w-full mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`${draftId ? `/kiosk/${kioskId}/upload?drId=${draftId}` : `/kiosk/${kioskId}/upload`}`}
                  className="p-2 hover:bg-[#1F2A44]/5 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1F2A44]" />
                </Link>
                {/* <Link href="/kiosks"> */}
                <Image src={ShortLogo} alt="short-logo" height={35} />
                {/* </Link> */}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-[#1F2A44]/60">Step 2 of 3</span>
              </div>
            </nav>
          </header>
          <UserInfoModal
            isOpen={showUserInfoModal}
            initialPhone={phoneNumber}
            onConfirm={(phone) => {
              setPhoneNumber(phone);
              setCachedPhone(phone);
              saveDraftPhoneNumber(phone);
              console.log("User confirmed phone number:", phone);
              handlePay(phone);
            }}
            onSkip={() => {
              setShowuserInfoPhoneModal(false);
            }}
            user={user}
          />
          <section className="relative isolate overflow-hidden rounded-3xl bg-[#F7F5EF] p-4 sm:p-6 md:p-8 mt-18">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#FFBF00]/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#20B2AA]/10 blur-3xl"
            />

            <div className="relative mx-auto w-full max-w-245">
              <header className="text-center">
                <h2 className="font-cormorant text-4xl font-bold leading-tight text-[#1F2A44] sm:text-5xl md:text-6xl">
                  Review Your Order
                </h2>
                <p className="mt-2 text-base font-semibold text-[#1F2A44]/70 sm:text-lg">
                  Preview, pay, print. Done.
                </p>
              </header>

              <div className="mt-12 space-y-10 sm:space-y-12">
                <section>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-cormorant text-5xl leading-none text-[#E6C88E] sm:text-6xl">
                      01
                    </span>
                    <h3 className="font-cormorant text-4xl font-bold leading-none text-[#1F2A44] sm:text-5xl">
                      Print Details
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-[#1F2A44]/10 bg-white p-5 shadow-[0_8px_20px_rgba(31,42,68,0.08)] sm:p-6 md:p-7">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFBF00]/10 text-[#FFBF00]">
                        <FileText className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#1F2A44] sm:text-base wrap-break-word w-70">
                          {currentFileDetails?.originalName}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#1F2A44]/60 sm:text-sm">
                          {currentFileDetails?.pageCount} pages •{" "}
                          {formatPaperSize()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
                      <Metric
                        label="Copies"
                        value={`${currentDraftDetails?.copies}`}
                        valueClass="text-[#FFBF00]"
                      />
                      <Metric
                        label="Color"
                        value={formatLabel(
                          currentDraftDetails?.colorMode ?? "bw",
                        )}
                        valueClass="text-[#20B2AA]"
                      />
                      <Metric
                        label="Sides"
                        value={
                          currentDraftDetails?.duplex === true
                            ? "Double"
                            : "Single"
                        }
                        valueClass="text-[#8B9584]"
                      />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B9584]">
                          Location
                        </p>
                        <p className="mt-1 text-[15px] font-extrabold leading-none tracking-wide text-[#1F2A44] sm:text-[18px]">
                          {currentKioskDetails?.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* <section>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-cormorant text-5xl leading-none text-[#8FD4D0] sm:text-6xl">
                      02
                    </span>
                    <h3 className="font-cormorant text-4xl font-bold leading-none text-[#1F2A44] sm:text-5xl">
                      Pricing
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-[#1F2A44]/10 bg-white p-5 shadow-[0_8px_20px_rgba(31,42,68,0.08)] sm:p-6 md:p-7">
                    <div className="space-y-3 text-sm font-semibold sm:text-base">
                      <PriceRow
                        label="Base Price"
                        value={`${currency.format(currentDraftDetails?.pricePerPage as Intl.StringNumericLiteral)} / ${currentDraftDetails?.duplex ? "Paper" : "page"}`}
                      />
                    </div>
                    <div className="space-y-3 text-sm font-semibold sm:text-base">
                      <PriceRow
                        label="Subtotal"
                        value={currency.format(
                          Number(currentDraftDetails?.totalPrice) /
                            (currentDraftDetails?.copies === undefined
                              ? 1
                              : currentDraftDetails?.copies),
                        )}
                      />
                    </div>

                    <div className="my-5 h-px bg-[#E5E0D6]" />

                    <div className="flex items-center justify-between">
                      <p className="font-cormorant text-[34px] font-bold leading-none text-[#1F2A44] sm:text-[38px]">
                        Total
                      </p>
                      <p className="text-[30px] font-bold leading-none text-[#FFBF00] sm:text-[35px]">
                        {currency.format(
                          Number(currentDraftDetails?.totalPrice),
                        )}
                      </p>
                    </div>
                    <div className="mt-6 bg-[#FFBF00]/5 rounded-2xl p-6 border border-[#FFBF00]/20">
                      <h4 className="font-bold text-[#1F2A44] mb-3">
                        Pricing Guide
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#1F2A44]/70">B&W Single</span>
                          <span className="font-semibold text-[#1F2A44]">
                            ₹{pricing["bw"].single}/page
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1F2A44]/70">B&W Double</span>
                          <span className="font-semibold text-[#1F2A44]">
                            ₹{pricing["bw"].double}/page
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1F2A44]/70">
                            Color Single
                          </span>
                          <span className="font-semibold text-[#1F2A44]">
                            ₹{pricing["color"].single}/page
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1F2A44]/70">
                            Color Double
                          </span>
                          <span className="font-semibold text-[#1F2A44]">
                            ₹{pricing["color"].double}/page
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section> */}

                <section>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-cormorant text-5xl leading-none text-[#8FD4D0] sm:text-6xl">
                      02
                    </span>
                    <h3 className="font-cormorant text-4xl font-bold leading-none text-[#1F2A44] sm:text-5xl">
                      Pricing
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-[#1F2A44]/10 bg-white p-5 shadow-[0_8px_20px_rgba(31,42,68,0.08)] sm:p-6 md:p-7">
                    <div className="space-y-3 text-sm font-semibold sm:text-base">
                      <PriceRow
                        label="Base Price"
                        value={`${currency.format(Number(currentDraftDetails?.pricePerPage))} / ${currentDraftDetails?.duplex ? "sheet" : "page"}`}
                      />
                      <PriceRow
                        label="Subtotal"
                        value={currency.format(
                          Number(currentDraftDetails?.subtotal),
                        )}
                      />
                      <PriceRow
                        label={`GST (${currentDraftDetails?.gstRatePercent ?? 18}%)`}
                        value={currency.format(
                          Number(currentDraftDetails?.gstAmount),
                        )}
                      />
                    </div>

                    <div className="my-5 h-px bg-[#E5E0D6]" />

                    <div className="flex items-center justify-between">
                      <p className="font-cormorant text-[34px] font-bold leading-none text-[#1F2A44] sm:text-[38px]">
                        Total
                      </p>
                      <p className="text-[30px] font-bold leading-none text-[#FFBF00] sm:text-[35px]">
                        {currency.format(
                          Number(currentDraftDetails?.totalPrice),
                        )}
                      </p>
                    </div>
                  <div className="mt-6 bg-[#FFBF00]/5 rounded-2xl p-6 border border-[#FFBF00]/20">
                    <h4 className="font-bold text-[#1F2A44] mb-3">
                      Pricing Guide
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#1F2A44]/70">B&W Single</span>
                        <span className="font-semibold text-[#1F2A44]">
                          ₹{pricing["bw"].single}/page
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1F2A44]/70">B&W Double</span>
                        <span className="font-semibold text-[#1F2A44]">
                          ₹{pricing["bw"].double}/page
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1F2A44]/70">Color Single</span>
                        <span className="font-semibold text-[#1F2A44]">
                          ₹{pricing["color"].single}/page
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#1F2A44]/70">Color Double</span>
                        <span className="font-semibold text-[#1F2A44]">
                          ₹{pricing["color"].double}/page
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </section>

                <section>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-cormorant text-5xl leading-none text-[#D9D0BC] sm:text-6xl">
                      03
                    </span>
                    <h3 className="font-cormorant text-4xl font-bold leading-none text-[#1F2A44] sm:text-5xl">
                      Payment
                    </h3>
                  </div>

                  <div
                    className={` ${phonepeScriptUploaded ? "pointer-events-auto" : "pointer-events-none"} rounded-3xl border border-[#1F2A44]/10 bg-white p-5 shadow-[0_8px_20px_rgba(31,42,68,0.08)] sm:p-6 md:p-7`}
                  >
                    <div className="flex items-start gap-4">
                      {phonepeScriptUploaded ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D7F4F1] text-[#20B2AA]">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f4d7d7] text-[#b22020]">
                          <X className="h-5 w-5" />
                        </div>
                      )}

                      <div>
                        <p className="text-base font-bold text-[#1F2A44]">
                          {phonepeScriptUploaded
                            ? "Ready to Pay"
                            : "Service Temporarily Unavailable."}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-[#1F2A44]/60 sm:text-sm">
                          {phonepeScriptUploaded
                            ? "Confirm your payment to release print job."
                            : " Please try again shortly."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-10 flex justify-center sm:mt-12 gap-3">
                <button
                  type="button"
                  onClick={editPrintDetails}
                  className="inline-flex select-none items-center gap-2 rounded-xl bg-[#1F2A44] px-7 py-3.5 text-sm font-bold text-[#FFBF00] shadow-[0_8px_18px_rgba(255,191,0,0.35)] transition-colors duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <PenIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleUserPayClick}
                  disabled={!phonepeScriptUploaded}
                  className="inline-flex select-none items-center gap-2 rounded-xl text-[#1F2A44] px-7 py-3.5 text-sm font-bold bg-[#FFBF00] shadow-[0_8px_18px_rgba(255,191,0,0.35)] transition-colors duration-150 hover:bg-[#f4b500] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Lock className="h-4 w-4" />
                  Confirm & Pay
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B9584]">
        {label}
      </p>
      <p
        className={`mt-1 text-[28px] font-bold leading-none sm:text-[30px] ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-semibold text-[#8B9584]">{label}</p>
      <p className="font-bold text-[#1F2A44]">{value}</p>
    </div>
  );
}
