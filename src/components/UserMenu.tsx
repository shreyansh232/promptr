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
        <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
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
        className="w-48 border-white/10 bg-[#1a1a1a] text-[#f5efe6]"
      >
        <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
          <Link href="/profile" className="w-full">
            View profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer text-red-400 hover:bg-white/10 focus:bg-white/10"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
