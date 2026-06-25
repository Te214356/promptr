"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export default function NotFound() {
  const [isAR, setIsAR] = useState(true)

  useEffect(() => {
    setIsAR(document.documentElement.lang === "ar")
  }, [])

  return (
    <div
      className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]"
      style={{ backgroundColor: "#080810" }}
    >
      <h1 style={{ color: "#ffffff", fontSize: "1.5rem", fontWeight: 600 }}>
        {isAR ? "الصفحة غير موجودة" : "Page not found"}
      </h1>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
        {isAR
          ? "السلة التي تحاول الوصول إليها غير موجودة. امسح الكوكيز وحاول مجدداً."
          : "The cart you tried to access does not exist. Clear your cookies and try again."}
      </p>
      <Link
        href="/"
        style={{
          color: "#00CFFF",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          textDecoration: "underline",
        }}
      >
        {isAR ? "العودة للرئيسية" : "Go to frontpage"}
      </Link>
    </div>
  )
}
