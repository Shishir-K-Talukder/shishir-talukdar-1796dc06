import { useSiteContent } from "@/hooks/useSiteContent";

export function useProfile() {
  const { data, isLoading } = useSiteContent("profile");

  const get = (key: string, fallback: string) =>
    data?.find((d) => d.key === key)?.value ?? fallback;

  return {
    name: get("name", "Shishir Kumar Talukder"),
    title: get("title", "Research Microbiologist"),
    subtitle: get("subtitle", "Antimicrobial Resistance Specialist"),
    bio: get("bio", ""),
    profileImage: get("profile_image", ""),
    isLoading,
  };
}
