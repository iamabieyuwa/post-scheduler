// lib/handleApiResponse.js
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export function useHandleApiResponse() {
  const router = useRouter();

  return async function handleApiResponse(res) {
    const data = await res.json();

    if (data.authError) {
      toast.error("Session expired. Please log in again.");
      router.push("/");
      return null;
    }

    if (!res.ok) {
      toast.error(data.error || "Something went wrong");
      return null;
    }

    return data;
  };
}
