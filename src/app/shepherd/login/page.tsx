"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShepherdLoginRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/church/login");
    }, [router]);

    return null;
}
