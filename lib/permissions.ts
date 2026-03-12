import { supabase } from "@/lib/supabase";

export type Permission =
  | "can_manage_members"
  | "can_manage_payments"
  | "can_manage_plans"
  | "can_manage_trainers"
  | "can_manage_expenses"
  | "can_view_reports"
  | "can_manage_sessions";

export async function checkPermission(
  permission: Permission
): Promise<boolean> {
  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return false;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData?.role_id) {
      return false;
    }

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", userData.role_id)
      .single();

    if (roleError || !role) {
      return false;
    }

    const roleName = role.name?.trim().toLowerCase();

    // Owner = full access
    if (roleName === "owner") {
      return true;
    }

    return role[permission] === true;

  } catch (err) {
    console.error("Permission check failed:", err);
    return false;
  }
}