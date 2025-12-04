"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, User, LogOut, Wallet, Send, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDisconnect, useBalance } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { TokenBalanceDisplay } from "@/components/shared/token-balance-display";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const { address, isConnected, hasTravelerSBT, hasHostSBT, role } = useAuth();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Get user's balance
  const { data: balanceData } = useBalance({
    address: address || undefined,
  });

  const hasAnySBT = hasTravelerSBT || hasHostSBT;

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Base navigation available to everyone
  const baseNavigation = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.explore"), href: "/explore" },
  ];

  // Additional navigation for connected users with SBTs
  const authenticatedNavigation =
    isConnected && hasAnySBT
      ? [
          ...(hasTravelerSBT ? [{ name: t("nav.my_bookings"), href: "/dashboard/traveler" }] : []),
          ...(hasHostSBT ? [{ name: t("nav.my_properties"), href: "/dashboard/host" }] : []),
        ]
      : [];

  const navigation = [...baseNavigation, ...authenticatedNavigation];

  // Clear cache when address changes to prevent showing old user data
  React.useEffect(() => {
    if (address) {
      // Invalidate all queries when address changes
      queryClient.invalidateQueries();
    }
  }, [address, queryClient]);

  const handleDisconnect = () => {
    // Clear all cached queries to prevent showing old user data
    queryClient.clear();
    // Disconnect wallet
    disconnect();
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="from-primary bg-gradient-to-r to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            NomadNodes
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:text-primary text-sm font-medium transition-colors",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Become Host Button - Only show if not connected or doesn't have host SBT */}
          {(!isConnected || !hasHostSBT) && (
            <Link href={isConnected ? "/onboarding" : "/explore"} className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">
                {t("nav.become_host")}
              </Button>
            </Link>
          )}

          <LanguageSwitcher />
          <ThemeToggle />

          {/* Token Balance Display - Only show when connected */}
          {isConnected && address && (
            <TokenBalanceDisplay address={address} variant="compact" className="hidden md:flex" />
          )}

          {/* User Menu or Connect Button */}
          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden md:flex">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Address & Balance */}
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">{formatAddress(address)}</p>
                    {balanceData && (
                      <p className="text-muted-foreground text-xs">
                        {parseFloat(formatEther(balanceData.value)).toFixed(4)} {balanceData.symbol}
                      </p>
                    )}
                    {hasAnySBT && (
                      <p className="text-muted-foreground text-xs">
                        {role === "both"
                          ? "Traveler & Host"
                          : role === "host"
                            ? "Host"
                            : "Traveler"}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Show "Get SBT" if no SBT */}
                {!hasAnySBT ? (
                  <DropdownMenuItem asChild>
                    <Link href="/onboarding" className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      Get Your SBT
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    {/* Profile - Only if has SBT */}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>

                    {/* My Bookings - If has Traveler SBT */}
                    {hasTravelerSBT && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/traveler" className="cursor-pointer">
                          {t("nav.my_bookings")}
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* My Properties - If has Host SBT */}
                    {hasHostSBT && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/host" className="cursor-pointer">
                          {t("nav.my_properties")}
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {/* Get additional SBT if only has one */}
                    {(!hasTravelerSBT || !hasHostSBT) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/onboarding" className="cursor-pointer">
                            <Wallet className="mr-2 h-4 w-4" />
                            Get {!hasTravelerSBT ? "Traveler" : "Host"} SBT
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}

                <DropdownMenuSeparator />

                {/* Wallet Actions */}
                <DropdownMenuItem
                  onClick={() => open({ view: "Account" })}
                  className="cursor-pointer"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  View Wallet
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => open({ view: "Account" })}
                  className="cursor-pointer"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => open({ view: "OnRampProviders" })}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Buy Crypto
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Disconnect */}
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:block">
              <appkit-button />
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="mt-8 flex flex-col space-y-4">
                {/* Address & Balance in Mobile */}
                {isConnected && address && (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{formatAddress(address)}</p>
                      {balanceData && (
                        <p className="text-muted-foreground text-xs">
                          {parseFloat(formatEther(balanceData.value)).toFixed(4)}{" "}
                          {balanceData.symbol}
                        </p>
                      )}
                    </div>
                    {/* Token Balances for Mobile */}
                    <TokenBalanceDisplay address={address} variant="full" showRefresh />
                  </div>
                )}

                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "hover:text-primary text-lg font-medium transition-colors",
                      pathname === item.href ? "text-primary" : ""
                    )}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Conditional mobile menu items */}
                {isConnected && hasAnySBT && (
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t("nav.profile")}
                  </Link>
                )}

                {(!isConnected || !hasHostSBT) && (
                  <Link
                    href={isConnected ? "/onboarding" : "/explore"}
                    onClick={() => setIsOpen(false)}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t("nav.become_host")}
                  </Link>
                )}

                {isConnected && !hasAnySBT && (
                  <Link
                    href="/onboarding"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    Get Your SBT
                  </Link>
                )}

                <div className="border-t pt-4">
                  {isConnected ? (
                    <Button variant="outline" onClick={handleDisconnect} className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  ) : (
                    <appkit-button />
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
