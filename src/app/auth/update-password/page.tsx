import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900/95 p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white text-center mb-2">Configurar contraseña</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Crea una contraseña para poder iniciar sesión en la TV con email y contraseña.
        </p>
        <UpdatePasswordForm />
      </div>
    </main>
  );
}
