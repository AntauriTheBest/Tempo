export type UserRole = 'ADMIN' | 'USER';
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    role: UserRole;
    createdAt: string;
    isSuperAdmin?: boolean;
}
export interface AdminUserListItem {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface InviteUserRequest {
    email: string;
    name: string;
    role?: UserRole;
}
export interface SetPasswordRequest {
    token: string;
    password: string;
}
export interface AdminUpdateUserRequest {
    name?: string;
    role?: UserRole;
    isActive?: boolean;
}
export interface UpdateProfileRequest {
    name?: string;
    avatar?: string | null;
    phone?: string | null;
}
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
//# sourceMappingURL=user.types.d.ts.map