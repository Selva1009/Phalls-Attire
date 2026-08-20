"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Mail, Phone, MessageCircle, AtSign, X } from "lucide-react";
import styles from "./NeedHelpModal.module.css";

export default function NeedHelpModal({
  open,
  onClose,
  title = "What help do you need?",
  description = "Contact our support team for assistance.",
  email,
  phone,
  orderNumber,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const computed = useMemo(() => {
    const normalizedPhone = String(phone || "").replace(/[\\s()-]/g, "");
    const phoneDigits = normalizedPhone.replace(/\\D/g, "");
    const orderSuffix = orderNumber ? ` - Order ${orderNumber}` : "";
    const subject = `Support Request${orderSuffix}`;
    const baseBody = [
      "Hi Phalls Support,",
      "",
      orderNumber
        ? `I need assistance regarding order #${orderNumber}.`
        : "I need assistance.",
      "",
      "Issue details:",
      "-",
      "",
      "Thanks & regards,",
    ].join("\\n");
    const waBody = [
      "Hi Phalls Support,",
      "",
      orderNumber
        ? `I need assistance regarding order #${orderNumber}.`
        : "I need assistance.",
      "",
      "Issue details:",
      "[Describe Your Complaint]",
      "",
      "Thanks.",
    ].join("\n");

    const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(baseBody)}`;
    const mailtoHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(baseBody)}`;
    const phoneHref = `tel:${normalizedPhone}`;
    const whatsappWebHref = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waBody)}`;
    const whatsappAppHref = `whatsapp://send?phone=${phoneDigits}&text=${encodeURIComponent(waBody)}`;

    return { gmailHref, mailtoHref, phoneHref, whatsappWebHref, whatsappAppHref };
  }, [email, phone, orderNumber]);

  const handleWhatsappClick = useCallback(
    (event) => {
      event.preventDefault();
      if (typeof window === "undefined") return;
      window.location.href = computed.whatsappAppHref;
      window.setTimeout(() => {
        window.open(computed.whatsappWebHref, "_blank", "noopener,noreferrer");
      }, 600);
    },
    [computed]
  );

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} aria-hidden="true">
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="Need help"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Support</p>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <a className={styles.linkCard} href={computed.gmailHref} target="_blank" rel="noreferrer">
            <div className={styles.linkIcon}>
              <Mail size={16} />
            </div>
            <div>
              <p className={styles.linkLabel}>Email support (Gmail)</p>
              <p className={styles.linkValue}>{email}</p>
              {/* <p className={styles.linkHint}>Opens Gmail compose in a new tab</p> */}
            </div>
          </a>

          <a className={styles.linkCard} href={computed.mailtoHref}>
            <div className={styles.linkIcon}>
              <AtSign size={16} />
            </div>
            <div>
              <p className={styles.linkLabel}>Mail to</p>
              <p className={styles.linkValue}>{email}</p>
              {/* <p className={styles.linkHint}>Opens your default mail client</p> */}
            </div>
          </a>

          <a className={styles.linkCard} href={computed.phoneHref}>
            <div className={styles.linkIcon}>
              <Phone size={16} />
            </div>
            <div>
              <p className={styles.linkLabel}>Call support</p>
              <p className={styles.linkHint}>Tap to open your dial pad</p>
            </div>
          </a>

          <a
            className={styles.linkCard}
            href={computed.whatsappWebHref}
            onClick={handleWhatsappClick}
          >
            <div className={styles.linkIcon}>
              <MessageCircle size={16} />
            </div>
            <div>
              <p className={styles.linkLabel}>WhatsApp support</p>
              <p className={styles.linkHint}>Opens WhatsApp</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
