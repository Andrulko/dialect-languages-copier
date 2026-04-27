import React from "react";
import { Link, useMatch } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
function SidebarNavItem({
  to,
  end = false,
  children
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
}) {
  const match = useMatch({ path: to, end });
  const isActive = !!match;
  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link to={to}>{children}</Link>
    </SidebarMenuButton>
  );
}
export function AppSidebar(): JSX.Element {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-3 py-4">
          <img src="/logo.svg" alt="Dialect Copier Logo" className="h-7 w-7 text-[#F38020]" />
          <span className="text-base font-semibold tracking-tight">Dialect Copier</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavItem to="/" end>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
              </SidebarNavItem>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 text-xs text-muted-foreground pb-4">Dialect Copier &copy; {new Date().getFullYear()}</div>
      </SidebarFooter>
    </Sidebar>
  );
}