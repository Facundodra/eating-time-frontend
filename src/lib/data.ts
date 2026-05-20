import profileImg from "@/ui/img/profile.png";

export const Usuario ={
    nombre: "Admin",
    email: "test@eatingtime.com",
    tipo_usuario: "local", // local, admin, cliente
    foto: profileImg.src
}

export const Local ={
    calificacion: 4.5,
    estado: 0, // 0: cerrado, 1: abierto
}