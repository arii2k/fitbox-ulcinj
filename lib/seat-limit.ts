import { supabase } from "@/lib/supabase";

export async function canAddStaff(gymId: string): Promise<boolean> {

  const { data: subscription } = await supabase
    .from("gym_subscriptions")
    .select("seat_limit")
    .eq("gym_id", gymId)
    .single();

  if (!subscription) return false;

  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId);

  return (count ?? 0) < subscription.seat_limit;
}