import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <nav className="grid gap-2 text-lg font-medium">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            href="/cards" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Cards
          </Link>
          <Link 
            href="/travel" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Travel
          </Link>
          <Link 
            href="/shopping" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Shopping
          </Link>
          <Link 
            href="/chat" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Chat
          </Link>
          <Link 
            href="/financial-profile" 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            onClick={() => setOpen(false)}
          >
            Financial Profile
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
} 