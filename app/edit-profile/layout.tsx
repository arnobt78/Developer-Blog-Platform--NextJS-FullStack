import { auth } from "@/lib/auth";
import EditProfile from "./page";

export default async function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user || null;
  // DEBUG: Log SSR session and user for edit-profile

  console.log(
    "[SSR] edit-profile/layout.tsx session:",
    JSON.stringify(session)
  );

  console.log(
    "[SSR] edit-profile/layout.tsx user for EditProfile:",
    JSON.stringify(user)
  );
  // Render EditProfile with SSR user prop
  return <EditProfile user={user} />;
}
