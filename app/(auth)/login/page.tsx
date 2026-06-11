"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { LuLoaderCircle } from "react-icons/lu";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@freightflow.com");
  const [password, setPassword] = useState("admin123");
  const [inputType, setInputType] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError("Credenciales inválidas");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    sessionStorage.setItem("welcome", "true");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      window.location.href = window.location.origin + "/dashboard";
    } else {
      setError("Credenciales inválidas");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Card className="w-full bg-white max-w-sm border-border rounded-2xl shadow-lg px-4">
        <CardHeader className="flex flex-col justify-center items-center pb-2 pt-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl text-gray-800">MiBuss</CardTitle>
          <p className="text-sm text-gray-600">Panel administrativo</p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-800">
                Correo electrónico
              </label>
              <div className="relative">
                <FaUser className="absolute left-2 top-2 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@freightflow.com"
                  required
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-800">
                Contraseña
              </label>
              <div className="relative">
                <FaLock className="absolute left-2 top-2 text-gray-400" />
                <Input
                  type={inputType}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="contraseña"
                  required
                  className="pl-8"
                />
                {inputType === "password" ? (
                  <FaEyeSlash
                    className="absolute right-2 top-2 text-gray-600 cursor-pointer"
                    onClick={() =>
                      setInputType(
                        inputType === "password" ? "text" : "password",
                      )
                    }
                  />
                ) : (
                  <FaEye
                    className="absolute right-2 top-2 text-gray-600 cursor-pointer"
                    onClick={() =>
                      setInputType(
                        inputType === "password" ? "text" : "password",
                      )
                    }
                  />
                )}
              </div>
            </div>
            {error && <p className="text-sm text-[#EF4444]">{error}</p>}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LuLoaderCircle className="h-5 w-5 animate-spin" />
                  <span className="ml-2 text-gray-200">
                    Iniciando sesión...
                  </span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
