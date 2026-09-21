"use client"

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
import React from "react"
import { toast } from "./ui/toast"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export function SignupForm() {
  const [loading, updateLoading] = React.useState(false)
  const router = useRouter()
  
  const handleSubmit = async(formdata: FormData) => {
    try {
      updateLoading(true)

      const {data, error} = await authClient.signUp.email({
        email: formdata.get("email") as string,
        name: formdata.get("name") as string,
        password: formdata.get("password") as string
      })

      if(error) {
        throw new Error(error.message)
      }

      toast.add({
        type: "success",
        title: "Account Created",
        description: "Account created successfully.",
      })
      router.push("/sign-in")
    } catch (error) {
      toast.add({
        type: "error",
        title: "Signup Error",
        description: error instanceof Error ? error.message : "Failed to create account.",
      })
      
    } finally {
      updateLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6")} action={handleSubmit}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            name="password"
            className="bg-background"
          />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit">{loading ? "Creating Account..." : "Create Account"}</Button>
        </Field>
        <FieldDescription className="text-center">
          Already have an account?{" "}
          <a href="/sign-in" className="underline underline-offset-4">
            Sign in
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
