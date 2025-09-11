// src/pages/Register.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, Phone } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Nome deve ter pelo menos 2 caracteres",
    }),
    email: z.string().email({
      message: "Email inválido",
    }),
    phone: z.string().optional(),
    password: z.string().min(6, {
      message: "Senha deve ter pelo menos 6 caracteres",
    }),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { slug } = useParams(); // 👈 pega slug da URL
  const [empresa, setEmpresa] = useState<any | null>(null);

  // Busca empresa pelo slug
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome, slug")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa pelo slug:", error.message);
        setError("Empresa não encontrada.");
      } else {
        setEmpresa(data);
      }
    };

    fetchEmpresa();
  }, [slug]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setError("");
      setLoading(true);

      if (!empresa?.id) {
        throw new Error("Empresa inválida. Não foi possível criar a conta.");
      }

      await signUp(
        values.email,
        values.password,
        values.name,
        values.phone,
        empresa.id // 👈 agora está definido corretamente
      );

      toast({
        title: "Conta criada com sucesso",
        description: `Você foi registrado na empresa ${empresa.nome}`,
      });

      navigate(`/${slug}/login`);
    } catch (error: any) {
      console.error("Erro no signup:", error.message);
      setError("Falha ao criar conta. Verifique seus dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Criar conta em {empresa?.nome || slug}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{" "}
            <Link
              to={slug ? `/${slug}/login` : "/login"}
              className="font-medium text-brand hover:text-brand-600"
            >
              faça login com sua conta existente
            </Link>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Seu nome completo"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="seu@email.com"
                        className="pl-10"
                        type="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="(00) 00000-0000"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="••••••••"
                        className="pl-10"
                        type="password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="••••••••"
                        className="pl-10"
                        type="password"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-600"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Register;
