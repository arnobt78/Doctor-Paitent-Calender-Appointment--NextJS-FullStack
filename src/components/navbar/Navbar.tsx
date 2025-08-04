"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null);
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="w-full flex items-center justify-between px-8 py-3 border-b bg-white mb-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center">
          <svg fill="#fff" viewBox="-307.2 -307.2 1638.40 1638.40" xmlns="http://www.w3.org/2000/svg" stroke="#fff" width="48" height="48" style={{display:'block'}}><g id="SVGRepo_bgCarrier" strokeWidth="0" transform="translate(0,0), scale(1)"><path transform="translate(-307.2, -307.2), scale(51.2)" d="M16,27.634730153850146C18.57510626892635,28.230153364713914,20.859640590533747,30.813828646648528,23.409179138802745,30.1170113914162C25.833421565654746,29.454438960399735,26.776403475143113,26.486396841541318,28.074717281614802,24.33457555936723C29.314284060569427,22.280121418669687,30.51241246847017,20.178880351745832,30.839600677235083,17.801853744456288C31.169292240414375,15.406640234671332,30.704834234771905,13.006402192742522,29.950168360447016,10.709398992392678C29.173349460545666,8.344967844950242,28.226006939459413,5.952186026461902,26.393275621945666,4.26841698884296C24.549114276578962,2.5741469428034063,22.130086134835544,1.4924900945684394,19.63893693012256,1.2362525163144262C17.261196462190817,0.9916800683587893,14.956975855721735,1.91807995007894,12.762859189931048,2.866403456082473C10.796642031522566,3.7162260650157553,9.296207689284815,5.221493347070933,7.549560626350285,6.461425771929752C5.598361722050423,7.846568105565066,2.9055610257977196,8.488340014974327,1.8314095481619344,10.626562419604518C0.7554667199228986,12.768350714217792,1.5316496796336323,15.343587810052291,1.8975806854330965,17.712343721406615C2.2548247233459486,20.024866883398257,2.393588773607786,22.569595923901737,3.946765085965044,24.319747351665747C5.478605248498615,26.04585676128937,7.96930352226964,26.449484674406403,10.194490375274654,27.06147441840195C12.097095522134257,27.584745008095926,14.077473081556956,27.190198149651092,16,27.634730153850146" fill="#39c5f3" strokeWidth="0"></path></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="12.288"></g><g id="SVGRepo_iconCarrier"><path d="M960 95.888l-256.224.001V32.113c0-17.68-14.32-32-32-32s-32 14.32-32 32v63.76h-256v-63.76c0-17.68-14.32-32-32-32s-32 14.32-32 32v63.76H64c-35.344 0-64 28.656-64 64v800c0 35.343 28.656 64 64 64h896c35.344 0 64-28.657 64-64v-800c0-35.329-28.656-63.985-64-63.985zm0 863.985H64v-800h255.776v32.24c0 17.679 14.32 32 32 32s32-14.321 32-32v-32.224h256v32.24c0 17.68 14.32 32 32 32s32-14.32 32-32v-32.24H960v799.984zM736 511.888h64c17.664 0 32-14.336 32-32v-64c0-17.664-14.336-32-32-32h-64c-17.664 0-32 14.336-32 32v64c0 17.664 14.336 32 32 32zm0 255.984h64c17.664 0 32-14.32 32-32v-64c0-17.664-14.336-32-32-32h-64c-17.664 0-32 14.336-32 32v64c0 17.696 14.336 32 32 32zm-192-128h-64c-17.664 0-32 14.336-32 32v64c0 17.68 14.336 32 32 32h64c17.664 0 32-14.32 32-32v-64c0-17.648-14.336-32-32-32zm0-255.984h-64c-17.664 0-32 14.336-32 32v64c0 17.664 14.336 32 32 32h64c17.664 0 32-14.336 32-32v-64c0-17.68-14.336-32-32-32zm-256 0h-64c-17.664 0-32 14.336-32 32v64c0 17.664 14.336 32 32 32h64c17.664 0 32-14.336 32-32v-64c0-17.68-14.336-32-32-32zm0 255.984h-64c-17.664 0-32 14.336-32 32v64c0 17.68 14.336 32 32 32h64c17.664 0 32-14.32 32-32v-64c0-17.648-14.336-32-32-32z"></path></g></svg>
        </span>
        <Link href="/" className="text-lg font-semibold">Vocare Calendar</Link>
      </div>
      <div className="flex items-center gap-4">
        {/* Navbar Titles */}
        <nav className="flex items-center gap-2 mr-4">
          <Link href="/" className="text-md font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
            Dashboard
          </Link>
          <Link href="/control-panel" className="text-md font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
            Control Panel
          </Link>
          <Link href="/api-docs" className="text-md font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
            API Docs
          </Link>
          <Link href="/api-status" className="text-md font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
            API Status
          </Link>
        </nav>
        {/* User Email */}
        {userEmail && <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded-md font-medium">{userEmail}</span>}
        {/* Logout Button */}
        <Button variant="outline" size="lg" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
