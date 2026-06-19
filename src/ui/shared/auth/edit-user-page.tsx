"use client";

import { CloudArrowUpIcon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import {
    type ChangeEvent,
    type DragEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { editUserData, getCurrentSession } from "@/services/shared/auth-service";
import LoadingButton from "@/ui/shared/buttons/loading-button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Props = { backHref: string; showPhoto?: boolean };

export default function EditUserPage({ backHref, showPhoto = true }: Props){
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profilePreviewUrl = useMemo(
        () => (profilePic ? URL.createObjectURL(profilePic) : null),
        [profilePic],
    );

    useEffect(() => {
        return () => {
            if (profilePreviewUrl) {
                URL.revokeObjectURL(profilePreviewUrl);
            }
        };
    }, [profilePreviewUrl]);

    useEffect(() => {
        let cancelled = false;

        async function loadSession(){
            try {
                const session = await getCurrentSession();
                if (cancelled || !session) return;
                setName(session.nombre ?? "");
                setPhone(session.telefono ?? "");
                setCurrentPhotoUrl(session.urlFoto ?? null);
            } catch {
                // si falla, dejamos los campos vacíos para que el usuario los complete
            }
        }

        loadSession();
        return () => { cancelled = true; };
    }, []);

    function selectProfilePic(file?: File){
        if (!file) return;

        if (!file.type.startsWith("image/")){
            setFileError("Solo se permiten imágenes");
            return;
        }

        if (file.size > MAX_FILE_SIZE){
            setFileError("La foto no puede superar 5 MB");
            return;
        }

        setProfilePic(file);
        setFileError(null);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>){
        selectProfilePic(event.target.files?.[0]);
        event.target.value = "";
    }

    function handleDrop(event: DragEvent<HTMLDivElement>){
        event.preventDefault();
        selectProfilePic(event.dataTransfer.files[0]);
    }

    function removeProfilePic(){
        setProfilePic(null);
        setFileError(null);
        if (fileInputRef.current){
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }){
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const nombre = String(formData.get("name") ?? "");
        const phone = String(formData.get("phone") ?? "");

        setErrorMessage("");
        setIsSubmitting(true);

        try{
            await editUserData(nombre, phone, showPhoto ? profilePic : null);
            router.refresh();
            setDone(true);
        } catch (err){
            if(err instanceof Error && err.message === "Tu sesión expiró."){
                router.replace("/login");
                return;
            }
            setErrorMessage(
                err instanceof Error ? err.message : "No se pudo editar el usuario. Intentalo nuevamente.",
            );
        } finally{
            setIsSubmitting(false);
        }
    }

    const previewUrl = profilePreviewUrl ?? currentPhotoUrl;

    return (
        <section className="mt-6 max-w-lg">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                            <UserCircleIcon className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar perfil</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Actualizá tus datos personales y tu foto de perfil.
                            </p>
                        </div>
                    </div>
                </div>

                {done ? (
                    <div className="flex flex-col items-center text-center px-5 py-10">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                            <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            ¡Datos actualizados!
                        </h2>
                        <p className="mt-3 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                            Tus datos fueron actualizados correctamente.
                        </p>
                        <button
                            onClick={() => router.push(backHref)}
                            className="mt-7 h-[44px] cursor-pointer rounded-2xl bg-orange-600 px-8 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(234,88,12,0.18)] transition hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                        >
                            Volver a mi cuenta
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
                        <div>
                            <label htmlFor="name" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                Nombre
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                Teléfono
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                autoComplete="tel"
                                placeholder="Ej: 099123456"
                                className="field"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                            />
                        </div>

                        {showPhoto && (
                        <div>
                            <label htmlFor="photo_url" className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                                Foto de perfil
                            </label>
                            <div
                                role="button"
                                tabIndex={0}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " "){
                                        event.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className="flex min-h-[92px] w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-4 text-center transition hover:border-orange-500 hover:bg-orange-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none dark:border-orange-500/40 dark:bg-orange-500/10 dark:hover:border-orange-400 dark:hover:bg-orange-500/15 dark:focus:ring-orange-500/20"
                            >
                                {previewUrl ? (
                                    <div className="flex w-full items-center gap-3 text-left">
                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-orange-200 bg-white dark:border-orange-500/30 dark:bg-slate-950">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={previewUrl}
                                                alt={profilePic?.name ?? "Foto de perfil"}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                                                {profilePic ? profilePic.name : "Foto actual"}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                                Click para cambiar la imagen
                                            </p>
                                        </div>
                                        {profilePic ? (
                                            <button
                                                type="button"
                                                aria-label="Quitar foto seleccionada"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    removeProfilePic();
                                                }}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-orange-600 hover:text-white dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-orange-500 dark:hover:text-white"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="flex w-full items-center gap-3 text-left">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-200 bg-white text-orange-300 dark:border-orange-500/30 dark:bg-slate-950 dark:text-orange-400">
                                            <UserIcon className="h-8 w-8" />
                                        </div>
                                        <span className="flex flex-1 items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-300">
                                            <CloudArrowUpIcon className="h-5 w-5" />
                                            Arrastrar imagen o seleccionar archivo
                                        </span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                id="photo_url"
                                name="photo_url"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                            />
                            {fileError ? (
                                <span className="mt-2 block text-xs font-semibold text-rose-600 dark:text-rose-300">
                                    {fileError}
                                </span>
                            ) : (
                                <span className="mt-2 block text-xs text-slate-400 dark:text-slate-500">
                                    Opcional · Máximo 5 MB · JPG, PNG o similar
                                </span>
                            )}
                        </div>
                        )}

                        {errorMessage && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                                <p className="text-sm font-medium text-rose-700 dark:text-rose-200">{errorMessage}</p>
                            </div>
                        )}

                        <LoadingButton
                            type="submit"
                            isLoading={isSubmitting}
                            loadingText="Guardando..."
                            disabled={!!fileError}
                            className="h-[48px] w-full cursor-pointer rounded-2xl bg-orange-600 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(234,88,12,0.18)] transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-500/20"
                        >
                            Guardar cambios
                        </LoadingButton>
                    </form>
                )}
            </div>
        </section>
    );
}
