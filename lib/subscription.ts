import { supabase } from "@/lib/supabase";

export async function checkSubscription(): Promise<boolean> {
  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      console.log("No authenticated user");
      return false;
    }

    // Get user's gym_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("gym_id")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData?.gym_id) {
      console.log("No gym_id found for user");
      return false;
    }

    // Get subscription (NO .single() to avoid hard failure)
    const { data: subscriptions, error: subError } = await supabase
      .from("gym_subscriptions")
      .select("*")
      .eq("gym_id", userData.gym_id);

    if (subError) {
      console.log("Subscription query error:", subError);
      return false;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscription row found");
      return false;
    }

    const subscription = subscriptions[0];

    if (subscription.status !== "active") {
      console.log("Subscription not active");
      return false;
    }

    if (
      subscription.expires_at &&
      new Date(subscription.expires_at) < new Date()
    ) {
      console.log("Subscription expired");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Subscription check failed:", err);
    return false;
  }
}