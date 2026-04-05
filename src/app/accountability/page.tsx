"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Badge } from "@/components/ui";
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle, 
  Clock, 
  UserPlus,
  TrendingUp,
  CheckSquare,
  Flame
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Partner {
  id: string;
  name: string;
  email: string;
  stats: {
    completedToday: number;
    weeklyCompleted: number;
    streak: number;
  };
}

interface Invite {
  id: string;
  code: string;
  message: string | null;
  status: string;
  createdAt: string;
  fromUser: { name: string | null; email: string | null } | null;
  toUser: { name: string | null; email: string | null } | null;
}

export default function AccountabilityPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Invite[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const supabase = createClient();

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [partnersRes, invitesRes] = await Promise.all([
      fetch("/api/accountability/partners"),
      fetch("/api/accountability/invites"),
    ]);

    if (partnersRes.ok) {
      const data = await partnersRes.json();
      setPartners(data.partners || []);
    }
    if (invitesRes.ok) {
      const data = await invitesRes.json();
      setInvites(data.sent || []);
      setPendingRequests(data.received || []);
    }
  };

  const generateInvite = async () => {
    setIsGenerating(true);
    const response = await fetch("/api/accountability/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inviteMessage }),
    });

    if (response.ok) {
      const data = await response.json();
      setInviteCode(data.code);
      setInviteMessage("");
      loadData();
    }
    setIsGenerating(false);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/accountability/accept?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showNotification("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cancelInvite = async (inviteId: string) => {
    const response = await fetch(`/api/accountability/invite?id=${inviteId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadData();
      showNotification("Invite cancelled");
    }
  };

  const acceptInvite = async (inviteId: string) => {
    const response = await fetch(`/api/accountability/invite/accept?id=${inviteId}`, {
      method: "POST",
    });
    if (response.ok) {
      loadData();
      showNotification("Partner connected!");
    }
  };

  const removePartner = async (partnerId: string) => {
    const response = await fetch(`/api/accountability/partners?id=${partnerId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      loadData();
      showNotification("Partner removed");
    }
  };

  return (
    <PageContainer 
      title="Accountability Partners" 
      description="Connect with others to track and support each other's progress."
    >
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-success text-white rounded-lg shadow-lg">
          {notification}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Create Invite Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Add a personal message (optional)"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={generateInvite} 
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Link"}
                </Button>
              </div>
              {inviteCode && (
                <div className="p-4 rounded-lg bg-background-tertiary space-y-3">
                  <p className="text-sm text-foreground-muted">Share this link with your accountability partner:</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/accountability/accept?code=${inviteCode}`}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="secondary" onClick={copyInviteLink}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary">
                    <div>
                      <p className="font-medium">{invite.fromUser?.name || "Someone"}</p>
                      {invite.message && (
                        <p className="text-sm text-foreground-muted">"{invite.message}"</p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => acceptInvite(invite.id)}>
                      Accept
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sent Invites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary">
                    <div className="flex items-center gap-3">
                      <Badge variant={invite.status === "ACCEPTED" ? "success" : "warning"}>
                        {invite.status}
                      </Badge>
                      {invite.toUser && (
                        <span className="text-sm">{invite.toUser.name || invite.toUser.email}</span>
                      )}
                    </div>
                    {invite.status === "PENDING" && (
                      <Button size="sm" variant="secondary" onClick={() => cancelInvite(invite.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Partners ({partners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partners.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-foreground-muted mb-3" />
                  <p className="text-foreground-muted">No partners yet</p>
                  <p className="text-sm text-foreground-muted">Generate an invite link to connect</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div key={partner.id} className="p-4 rounded-lg bg-background-tertiary">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {partner.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{partner.name || "Anonymous"}</p>
                            <p className="text-sm text-foreground-muted">{partner.email}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removePartner(partner.id)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded bg-background-secondary">
                          <CheckSquare className="w-4 h-4 mx-auto text-success mb-1" />
                          <p className="text-lg font-semibold">{partner.stats.completedToday}</p>
                          <p className="text-xs text-foreground-muted">Today</p>
                        </div>
                        <div className="text-center p-2 rounded bg-background-secondary">
                          <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
                          <p className="text-lg font-semibold">{partner.stats.weeklyCompleted}</p>
                          <p className="text-xs text-foreground-muted">This Week</p>
                        </div>
                        <div className="text-center p-2 rounded bg-background-secondary">
                          <Flame className="w-4 h-4 mx-auto text-warning mb-1" />
                          <p className="text-lg font-semibold">{partner.stats.streak}</p>
                          <p className="text-xs text-foreground-muted">Day Streak</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground-secondary">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <p>Generate a unique invite link and share it with someone you trust.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <p>They accept the invite - your personal info stays hidden until accepted.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <p>Both of you can see each other's daily progress, weekly plans, and streaks.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
