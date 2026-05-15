import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/about")({
  component: AdminAbout,
});

interface AboutContent {
  id: string;
  heading: string;
  body_paragraph_1: string;
  body_paragraph_2: string;
  contact_heading: string;
  contact_body: string;
  email: string;
}

function AdminAbout() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [heading, setHeading] = useState("");
  const [body1, setBody1] = useState("");
  const [body2, setBody2] = useState("");
  const [contactHeading, setContactHeading] = useState("");
  const [contactBody, setContactBody] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase
      .from("page_content")
      .select("id,heading,body_paragraph_1,body_paragraph_2,contact_heading,contact_body,email")
      .eq("page", "about")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
        }
        if (data) {
          setContentId(data.id);
          setHeading(data.heading);
          setBody1(data.body_paragraph_1);
          setBody2(data.body_paragraph_2);
          setContactHeading(data.contact_heading);
          setContactBody(data.contact_body);
          setEmail(data.email);
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...(contentId ? { id: contentId } : {}),
      page: "about",
      heading: heading.trim(),
      body_paragraph_1: body1.trim(),
      body_paragraph_2: body2.trim(),
      contact_heading: contactHeading.trim(),
      contact_body: contactBody.trim(),
      email: email.trim(),
    };

    const { data: upserted, error } = await supabase
      .from("page_content")
      .upsert(payload, { onConflict: "id" })
      .select("id")
      .maybeSingle();

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      if (upserted?.id && !contentId) setContentId(upserted.id);
      toast.success("About page updated");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-foreground">About page</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the text content shown on your About page.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-card border border-border/60 p-8 shadow-elegant space-y-6"
        >
          <div>
            <Label htmlFor="heading">Main heading</Label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="body1">Body paragraph 1</Label>
            <Textarea
              id="body1"
              value={body1}
              onChange={(e) => setBody1(e.target.value)}
              rows={5}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="body2">Body paragraph 2</Label>
            <Textarea
              id="body2"
              value={body2}
              onChange={(e) => setBody2(e.target.value)}
              rows={5}
              className="mt-1.5"
            />
          </div>

          <div className="pt-4 border-t border-border/60">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Contact section
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactHeading">Contact heading</Label>
                <Input
                  id="contactHeading"
                  value={contactHeading}
                  onChange={(e) => setContactHeading(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="contactBody">Contact description</Label>
                <Textarea
                  id="contactBody"
                  value={contactBody}
                  onChange={(e) => setContactBody(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
