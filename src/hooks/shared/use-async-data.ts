"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AsyncDataState<TData> = {
  data: TData | null;
  error: Error | null;
  isLoading: boolean;
};

type UseAsyncDataOptions<TData> = {
  onSuccess?: (data: TData) => void;
};

export function useAsyncData<TData>(
  loadData: () => Promise<TData>,
  options: UseAsyncDataOptions<TData> = {},
) {
  // Mantiene el callback mas reciente sin obligar a reiniciar la carga cuando
  // cambia una funcion inline del componente consumidor.
  const onSuccessRef = useRef(options.onSuccess);
  const [state, setState] = useState<AsyncDataState<TData>>({
    data: null,
    error: null,
    isLoading: true,
  });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
  }, [options.onSuccess]);

  const reload = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      error: null,
      isLoading: true,
    }));
    setReloadToken((currentToken) => currentToken + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    // El Promise inicial evita setState sincronico dentro del effect y permite
    // mostrar loading tanto en la primera carga como en cambios de filtros/retry.
    Promise.resolve()
      .then(() => {
        if (!isActive) return null;
        setState((currentState) => ({
          ...currentState,
          error: null,
          isLoading: true,
        }));
        return loadData();
      })
      .then((data) => {
        if (!isActive || data == null) return;
        onSuccessRef.current?.(data);
        setState({ data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setState({
          data: null,
          error: error instanceof Error ? error : new Error("Error inesperado."),
          isLoading: false,
        });
      });

    return () => {
      isActive = false;
    };
  }, [loadData, reloadToken]);

  return {
    ...state,
    reload,
  };
}
