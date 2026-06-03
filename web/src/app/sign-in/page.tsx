"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AuthButton from "@/components/shared/AuthButton";
import AuthShell from "@/components/shared/AuthShell";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoginGithub from "@/components/shared/LoginGithub";
import LoginGoogle from "@/components/shared/LoginGoogle";
import { loginWithCreds } from "@/actions/auth";
import { toast } from "react-hot-toast";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const SignIn = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      const result = await loginWithCreds(formData);
      if (result?.error) {
        toast.error(result.error);
        form.setError("root", {
          message: result.error,
        });
      }
    } catch (error) {
      // Ignore Next.js redirect errors as they are expected
      if (!(error instanceof Error && error.message === "NEXT_REDIRECT")) {
        toast.error("Something went wrong!");
        form.setError("root", {
          message: "An unexpected error occurred",
        });
      }
    }
  }

  return (
    <AuthShell
      mode="sign-in"
      title="Sign in to continue practicing."
      subtitle="Open your workspace, review the current challenge, and keep refining the next prompt revision."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-[0.1em] text-[#8f978b]">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    {...field}
                    className="h-12 rounded-none border border-white/10 bg-[#060706] px-4 font-mono text-sm text-[#f7f2e8] placeholder:text-[#555d52] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
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
                <FormLabel className="font-mono text-xs uppercase tracking-[0.1em] text-[#8f978b]">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    className="h-12 rounded-none border border-white/10 bg-[#060706] px-4 font-mono text-sm text-[#f7f2e8] placeholder:text-[#555d52] focus-visible:border-[#48d8a4]/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-sm text-red-400">
              {form.formState.errors.root.message}
            </p>
          )}

          <AuthButton label="Sign in" pending={form.formState.isSubmitting} />
        </form>
        <LoginGithub />
        <LoginGoogle />
      </Form>
    </AuthShell>
  );
};

export default SignIn;
