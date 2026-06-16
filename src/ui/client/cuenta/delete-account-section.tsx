"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AccountDeletionError,
  deleteClientAccount,
} from "@/services/client/client-service";
import { logout } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

const CONFIRMATION_TEXT = "ELIMINAR";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPendingOrders, setHasPendingOrders] = useState(false);

  const isConfirmationValid =
    confirmationValue.trim().toUpperCase() === CONFIRMATION_TEXT;

  function handleCancel() {
    setIsExpanded(false);
    setConfirmationValue("");
    setErrorMessage(null);
    setHasPendingOrders(false);
  }

  async function handleDeleteAccount() {
    if (!isConfirmationValid) {
      setErrorMessage(`Escribí ${CONFIRMATION_TEXT} para confirmar la baja.`);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    setHasPendingOrders(false);

    try {
      await deleteClientAccount();

      try {
        await logout();
      } finally {
        router.replace("/login?reason=account-deleted");
        router.refresh();
      }
    } catch (error) {
      if (error instanceof AccountDeletionError) {
        setErrorMessage(error.message);
        setHasPendingOrders(error.hasPendingOrders);
      } else {
        setErrorMessage("No se pudo eliminar la cuenta. Intentalo nuevamente.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white shadow-lg dark:border-red-500/30 dark:bg-slate-900">
      <div className="border-b border-red-100 px-5 py-5 dark:border-red-500/20">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
          Eliminar cuenta
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Esta acción es permanente y no se puede deshacer.
        </p>
      </div>

      <div className="space-y-4 p-5 text-sm text-gray-600 dark:text-slate-300">
        <p>
          Al eliminar tu cuenta, tus datos personales se borran para proteger tu
          privacidad. Tus calificaciones y comentarios en los locales se
          conservan, pero aparecerán como{" "}
          <span className="font-bold text-gray-800 dark:text-slate-100">
            Anónimo
          </span>
          .
        </p>
        <p>
          El correo asociado no podrá reutilizarse para crear una nueva cuenta.
        </p>
        <p>
          Solo podés dar de baja la cuenta si no tenés pedidos pendientes
          (carrito activo, pago en curso o pedidos en preparación o entrega).
        </p>

        {!isExpanded ? (
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setErrorMessage(null);
              setHasPendingOrders(false);
            }}
            className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Quiero eliminar mi cuenta
          </button>
        ) : (
          <div className="space-y-4 rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
            <p className="font-medium text-red-700 dark:text-red-300">
              ¿Estás seguro? Vas a perder el acceso a tu cuenta y no vas a
              poder recuperarla.
            </p>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-slate-200">
                Escribí{" "}
                <span className="font-extrabold text-red-600 dark:text-red-400">
                  {CONFIRMATION_TEXT}
                </span>{" "}
                para confirmar
              </span>
              <input
                type="text"
                value={confirmationValue}
                onChange={(event) => setConfirmationValue(event.target.value)}
                disabled={isDeleting}
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-red-500/20"
              />
            </label>

            {errorMessage && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
                {hasPendingOrders && (
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Revisá tu{" "}
                    <Link
                      href="/client/cart"
                      className="font-bold text-orange-700 hover:underline dark:text-orange-400"
                    >
                      carrito
                    </Link>{" "}
                    o tu{" "}
                    <Link
                      href="/client/order-history"
                      className="font-bold text-orange-700 hover:underline dark:text-orange-400"
                    >
                      historial de pedidos
                    </Link>{" "}
                    para resolver los pedidos pendientes.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <LoadingButton
                type="button"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
                loadingText="Eliminando..."
                disabled={!isConfirmationValid}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Eliminar cuenta permanentemente
              </LoadingButton>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isDeleting}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
