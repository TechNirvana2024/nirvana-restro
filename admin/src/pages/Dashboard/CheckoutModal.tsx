import React, { useState } from "react";
import { FaMoneyBillWave, FaQrcode } from "react-icons/fa";
import styles from "./CheckoutModal.module.css";
import QR_IMAGE from "@/assets/qr-code.png";

// Define interfaces
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  specialInstructions: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: "dineIn" | "takeaway" | "delivery";
  tableId: string | null;
  tableName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  status: "preparing" | "ready" | "completed";
  orderNote: string;
  estimatedTime: number;
  createdAt: string;
  updatedAt: string;
}

interface Table {
  id: number;
  floor: { id: number; floorNo: string };
  tableNo: string;
  name: string | null;
  type: "indoor" | "outdoor" | "vip" | "regular";
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentSessionId: string | null;
  sessionStartTime: string | null;
  isActive: boolean;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | undefined;
  order: Order | undefined;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  table,
  order,
}) => {
  const [paymentType, setPaymentType] = useState<"cash" | "qr">("cash");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const handlePayment = () => {
    setIsPaymentSuccess(true);
    setTimeout(() => {
      setIsPaymentSuccess(false);
      onClose();
    }, 2000); // Close modal after 2 seconds
  };

  if (!isOpen || !table || !order) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {isPaymentSuccess ? (
          <div className={styles.successContainer}>
            <div className={styles.checkmarkContainer}>
              <svg
                className={styles.checkmark}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle
                  className={styles.checkmarkCircle}
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className={styles.checkmarkCheck}
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <p className={styles.successMessage}>Payment Successful!</p>
          </div>
        ) : (
          <>
            <h2 className={styles.modalTitle}>
              Checkout for Table {table.tableNo}
            </h2>
            <p className={styles.totalAmount}>
              Total Amount: ${order.totalAmount.toFixed(2)}
            </p>
            <div className={styles.paymentOptions}>
              <p className={styles.paymentLabel}>Select Payment Type:</p>
              <div className={styles.paymentGrid}>
                <div
                  className={`${styles.paymentBox} ${paymentType === "cash" ? styles.paymentBoxSelectedCash : ""}`}
                  onClick={() => setPaymentType("cash")}
                >
                  <FaMoneyBillWave className={styles.paymentIconCash} />
                  <span className={styles.paymentText}>Cash</span>
                </div>
                <div
                  className={`${styles.paymentBox} ${paymentType === "qr" ? styles.paymentBoxSelectedQr : ""}`}
                  onClick={() => setPaymentType("qr")}
                >
                  <FaQrcode className={styles.paymentIconQr} />
                  <span className={styles.paymentText}>QR (E-Payment)</span>
                </div>
              </div>
            </div>
            {paymentType === "qr" && (
              <div className={styles.qrContainer}>
                <img
                  src={QR_IMAGE}
                  alt="QR Code for Payment"
                  className={styles.qrImage}
                />
              </div>
            )}
            <div className={styles.buttonContainer}>
              <button onClick={onClose} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handlePayment} className={styles.actionButton}>
                {paymentType === "cash" ? "Submit" : "Complete Payment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
