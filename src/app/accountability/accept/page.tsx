"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "invalid">("loading");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!code) {
      setStatus("invalid");
      setMessage("No invite code provided.");
      return;
    }

    const processInvite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/accountability/accept?code=${code}`);
        return;
      }

      try {
        const response = await fetch(`/api/accountability/invite/by-code?code=${code}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setStatus("invalid");
            setMessage("This invite link is invalid or has already been used.");
          } else {
            throw new Error(data.error);
          }
          return;
        }

        const invite = data.invite;

        if (invite.fromUserId === user.id) {
          setStatus("error");
          setMessage("You cannot accept your own invite.");
          return;
        }

        if (invite.status === "ACCEPTED") {
          setStatus("invalid");
          setMessage("This invite has already been accepted.");
          return;
        }

        if (new Date() > new Date(invite.expiresAt)) {
          setStatus("expired");
          setMessage("This invite link has expired.");
          return;
        }

        const acceptResponse = await fetch(`/api/accountability/invite/accept?id=${invite.id}`, {
          method: "POST",
        });

        if (acceptResponse.ok) {
          setStatus("success");
          setMessage("You're now connected! Start supporting each other.");
        } else {
          const errorData = await acceptResponse.json();
          throw new Error(errorData.error || "Failed to accept invite");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Something went wrong.");
      }
    };

    processInvite();
  }, [code, router, supabase]);

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Invite...</h2>
              <p className="text-foreground-muted">Please wait while we connect you.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connected!</h2>
              <p className="text-foreground-muted mb-6">{message}</p>
              <Button onClick={() => router.push("/accountability")}>
                <Users className="w-4 h-4 mr-2" />
                View Partners
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-danger" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Unable to Connect</h2>
              <p className="text-foreground-muted mb-6">{message}</p>
              <Button variant="secondary" onClick={() => router.push("/accountability")}>
                Go Back
              </Button>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-warning" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invite Expired</h2>
              <p className="text-foreground-muted mb-6">{message}</p>
              <Button variant="secondary" onClick={() => router.push("/accountability")}>
                <Users className="w-4 h-4 mr-2" />
                Request New Invite
              </Button>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-foreground-muted/10 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-foreground-muted" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
              <p className="text-foreground-muted mb-6">{message}</p>
              <Button variant="secondary" onClick={() => router.push("/accountability")}>
                <Users className="w-4 h-4 mr-2" />
                Go to Partners
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <PageContainer title="Accept Invite" description="Join an accountability partnership">
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }>
        <AcceptContent />
      </Suspense>
    </PageContainer>
  );
}
