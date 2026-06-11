import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type ProfileInput = {
  visa_status: string;
  school_level: string;
  school_name?: string;
  email: string;
};

export type SavedScan = {
  id: string;
  user_id: string;
  title: string;
  opportunity_type: string;
  analysis_json: Record<string, unknown>;
  checklist_progress: Record<string, boolean> | null;
  created_at: string;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function saveProfile(userId: string, profile: ProfileInput) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...profile })
    .select()
    .single();
  return { data, error };
}

export async function saveScan(
  userId: string,
  title: string,
  opportunityType: string,
  analysisJson: object
): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("saved_scans")
    .insert({
      user_id: userId,
      title,
      opportunity_type: opportunityType,
      analysis_json: analysisJson,
    })
    .select("id")
    .single();
  return { id: data?.id ?? null, error };
}

export async function getUserScans(
  userId: string
): Promise<{ data: SavedScan[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("saved_scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: data as SavedScan[] | null, error };
}
