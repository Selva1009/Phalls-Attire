import Swal from "sweetalert2";

const baseClasses = {
  popup: "swal-soft-popup",
  title: "swal-soft-title",
  htmlContainer: "swal-soft-text",
  confirmButton: "swal-soft-confirm",
  cancelButton: "swal-soft-cancel",
};

export const showAuthSuccess = ({
  title,
  text,
  confirmButtonText = "OK",
  confirmButtonColor = "#E91E63",
}) =>
  Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText,
    confirmButtonColor,
    customClass: {
      popup: baseClasses.popup,
      title: baseClasses.title,
      htmlContainer: baseClasses.htmlContainer,
      confirmButton: baseClasses.confirmButton,
    },
  });

export const showLogoutSuccess = (text = "You have been signed out.") =>
  showAuthSuccess({
    title: "Logged out",
    text,
    confirmButtonText: "OK",
  });
