export type InvitationType = "appointment" | "dashboard";
export type InvitationPermission = "read" | "write" | "full";

export interface InvitationRequest {
  type: InvitationType;
  email: string;
  resourceId: string; // appointmentId or ownerUserId
  permission: InvitationPermission;
}
