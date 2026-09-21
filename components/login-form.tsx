import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "./ui/toast"
import { authClient } from "@/lib/auth-client"
import React from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [loading, updateLoading] = React.useState(false)
  const router = useRouter();
  
  const handleSubmit = async(formdata: FormData) => {
    try {
      updateLoading(true)

      const {data, error} = await authClient.signIn.email({
        email: formdata.get("email") as string,
        password: formdata.get("password") as string
      })

      if(error) {
        throw new Error(error.message)
      }

      toast.add({
        type: "success",
        title: "Login Successful",
        description: "You have been logged in successfully.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast.add({
        type: "error",
        title: "Login Error",
        description: error instanceof Error ? error.message : "Failed to log in.",
      })
    } finally {
      updateLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6")} action={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" name="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">{loading ? "Logging in..." : "Login"}</Button>
        </Field>
        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="underline underline-offset-4">
            Sign up
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
