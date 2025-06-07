import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Crown,
  Shield,
  User,
  MoreVertical,
  Copy
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organizationRole: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

export default function Team() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/team/members"],
  });

  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/team/invitations"],
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return await apiRequest("POST", "/api/team/invite", data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Team invitation has been sent successfully.",
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      return await apiRequest("PUT", `/api/team/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest("DELETE", `/api/team/members/${memberId}`);
    },
    onSuccess: () => {
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest("POST", `/api/team/invitations/${invitationId}/resend`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Resent",
        description: "Invitation has been resent successfully.",
      });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (membersLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
        <p className="text-gray-600">Manage your team members and their permissions</p>
      </div>

      {/* Invite New Member */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button 
              onClick={handleInvite}
              disabled={inviteMemberMutation.isPending}
            >
              {inviteMemberMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Team Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({teamMembers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers?.map((member: TeamMember) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    {member.lastLoginAt && (
                      <div className="text-xs text-gray-400">
                        Last active: {new Date(member.lastLoginAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.organizationRole)}
                    <Badge variant={getRoleBadgeVariant(member.organizationRole)}>
                      {member.organizationRole}
                    </Badge>
                  </div>
                  {member.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {member.organizationRole !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => updateMemberRoleMutation.mutate({
                            memberId: member.id,
                            role: member.organizationRole === "admin" ? "member" : "admin"
                          })}
                        >
                          {member.organizationRole === "admin" ? "Make Member" : "Make Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="text-red-600"
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation: Invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div>
                    <div className="font-medium">{invitation.email}</div>
                    <div className="text-sm text-gray-500">
                      Invited as {invitation.role} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pending</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => resendInvitationMutation.mutate(invitation.id)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}