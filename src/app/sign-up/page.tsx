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
import { registerWithCreds } from "@/actions/auth";
import { toast } from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  // level: z.string().min(1, { message: "Please select your level" }),
  // expertise: z.string().min(1, { message: "Please enter your area of expertise" }),
  // learningStyle: z.string().min(1, { message: "Please select your learning style" }),
  // goals: z.array(z.string()).min(1, { message: "Please select at least one goal" }),
});

const SignUp = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      await registerWithCreds(formData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
      form.setError("root", {
        message,
      });
    }
  }

  return (
    <AuthShell
      mode="sign-up"
      title="Create an account for guided prompt practice."
      subtitle="Set up a focused workspace where each challenge starts with a problem statement and ends with a sharper prompt."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#6a6255]">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name"
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

          <AuthButton
            label="Create account"
            pending={form.formState.isSubmitting}
          />
        </form>
        <LoginGithub />
      </Form>
    </AuthShell>
  );
};
export default SignUp;
