"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnerGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("mkzora_owner_session");

    if (!session) {
      router.replace("/owner");
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Checking access...</div>
      </div>
    );
  }

  return <>{children}</>;
}