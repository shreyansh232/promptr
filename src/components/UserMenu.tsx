"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { User, SignOut } from "@phosphor-icons/react/dist/ssr";

function getInitials(name: string | null | undefined): string {
  if (!name) return "P";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu({
  name,
  image,
}: {
  name: string | null | undefined;
  image: string | null | undefined;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
          {image ? (
            <Image
              className="h-full w-full object-cover"
              width={40}
              height={40}
              alt="user image"
              src={image}
            />
          ) : (
            <span className="text-sm font-semibold text-[#f5efe6]">
              {getInitials(name)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-none border border-white/10 bg-[#060706] p-1 text-[#f7f2e8] z-[9999]"
      >
        <DropdownMenuItem asChild className="!rounded-none">
          <Link
            href="/profile?from=landing"
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#abb4a4] hover:bg-[#b7ff5a]/10 hover:text-[#c8ff76] focus:bg-[#b7ff5a]/10 focus:text-[#c8ff76] w-full"
          >
            <User size={14} className="shrink-0 text-[#b7ff5a]" />
            <span>View profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout()}
          className="flex cursor-pointer items-center gap-2.5 !rounded-none px-3 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#ff7777] hover:bg-[#ff5a5a]/10 hover:text-[#ff9b9b] focus:bg-[#ff5a5a]/10 focus:text-[#ff9b9b]"
        >
          <SignOut size={14} className="shrink-0" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

