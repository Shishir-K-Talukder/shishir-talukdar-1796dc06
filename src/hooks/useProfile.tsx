import { useSiteContent } from "@/hooks/useSiteContent";

function transformImage(url: string, width = 720): string {
  if (!url) return url;
  // Supabase Storage public URL -> use the image render endpoint for on-the-fly resize
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const sep = transformed.includes("?") ? "&" : "?";
    return `${transformed}${sep}width=${width}&quality=75&resize=cover`;
  }
  return url;
}

export function useProfile() {
  const { data, isLoading } = useSiteContent("profile");

  const get = (key: string, fallback: string) =>
    data?.find((d) => d.key === key)?.value ?? fallback;

  const rawImage = get("profile_image", "");
  return {
    name: get("name", "Shishir Kumar Talukder"),
    title: get("title", "Research Microbiologist"),
    subtitle: get("subtitle", "Antimicrobial Resistance Specialist"),
    bio: get("bio", ""),
    profileImage: transformImage(rawImage, 720),
    profileImageThumb: transformImage(rawImage, 128),
    isLoading,
  };
}
