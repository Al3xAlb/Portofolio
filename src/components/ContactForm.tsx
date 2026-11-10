import { useState } from "react";
import { z } from "zod";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be under 255 characters"),
  message: z.string().trim().min(1, "Please write a message").max(2000, "Message must be under 2000 characters"),
});

type FormValues = z.infer<typeof contactSchema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const ContactForm = () => {
  const [values, setValues] = useState<FormValues>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: result.data.name,
      email: result.data.email,
      message: result.data.message,
    });
    setSending(false);

    if (error) {
      toast.error("Your message couldn't be sent. Please try again.");
      return;
    }
    setSent(true);
    setValues({ name: "", email: "", message: "" });
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center">
        <p className="font-display text-2xl">Thank you!</p>
        <p className="mt-2 text-sm text-muted-foreground">Your message is on its way. I'll get back to you soon.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            aria-label="Your name"
            placeholder="Your name"
            value={values.name}
            onChange={update("name")}
            maxLength={100}
            className="h-12 rounded-xl bg-card"
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>
        <div>
          <Input
            aria-label="Your email"
            type="email"
            placeholder="Your email"
            value={values.email}
            onChange={update("email")}
            maxLength={255}
            className="h-12 rounded-xl bg-card"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div>
        <Textarea
          aria-label="Your message"
          placeholder="Tell me about your project…"
          value={values.message}
          onChange={update("message")}
          maxLength={2000}
          rows={5}
          className="rounded-xl bg-card resize-none"
        />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" disabled={sending} className="h-12 rounded-full px-8">
        {sending ? "Sending…" : "Send message"}
        <Send size={16} />
      </Button>
    </form>
  );
};

export default ContactForm;
