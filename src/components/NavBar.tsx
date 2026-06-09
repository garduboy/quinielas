"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const { user, loading } = useUser();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user?.user_metadata?.display_name
    ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[#1D9E75] text-white text-xs flex items-center justify-center">⚽</span>
        PoolFC
      </span>

      {user && (
        <div className="flex gap-1">
          <Link href="/matches" className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Matches</Link>
          <Link href="/leaderboard" className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Leaderboard</Link>
          <Link href="/results" className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Results</Link>
          <Link href="/reveal" className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Picks</Link>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {!loading && user ? (
          <>
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center justify-center">{initials}</div>
            <span className="text-sm text-gray-600">{user.user_metadata?.display_name ?? user.email}</span>
            <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Sign out</button>
          </>
        ) : !loading && (
          <Link href="/login" className="text-sm text-[#1D9E75] font-medium hover:underline">Sign in</Link>
        )}
      </div>
    </nav>
  );
}
