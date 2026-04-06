"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import AuthButton from "@/components/AuthButton";
import AuthShell from "@/components/AuthShell";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LoginGithub from "@/components/LoginGithub";
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
      await loginWithCreds(formData);
    } catch {
      toast.error("Something went wrong!");
      form.setError("root", {
        message: "Invalid credentials",
      });
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
                <FormLabel className="text-[#6a6255]">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    {...field}
                    className="h-12 rounded-xl border-white/10 bg-[#0d0d0d] px-4 text-[#f5efe6] placeholder:text-[#4a453d]"
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
                <FormLabel className="text-[#6a6255]">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    className="h-12 rounded-xl border-white/10 bg-[#0d0d0d] px-4 text-[#f5efe6] placeholder:text-[#4a453d]"
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
      </Form>
    </AuthShell>
  );
};

export default SignIn;
