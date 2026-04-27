/* This is a demo sidebar. **COMPULSORY** Edit this file to customize the sidebar OR remove it from appLayout OR don't use appLayout at all */
import React from "react";
import { Link, useMatch } from "react-router-dom";
import { Home, Layers, Compass, Star, Settings, LifeBuoy } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarInput,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
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
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500" />
          <span className="text-sm font-medium">Demo Sidebar</span>
        </div>
        <SidebarInput placeholder="Search" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavItem to="/" end>
                <Home /> <span>Home</span>
              </SidebarNavItem>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavItem to="/projects">
                <Layers /> <span>Projects</span>
              </SidebarNavItem>
              <SidebarMenuAction>
                <Star className="size-4" />
              </SidebarMenuAction>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarNavItem to="/explore">
                <Compass /> <span>Explore</span>
              </SidebarNavItem>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavItem to="/starred">
                <Star /> <span>Starred</span>
              </SidebarNavItem>
              <SidebarMenuBadge>5</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">A simple shadcn sidebar</div>
      </SidebarFooter>
    </Sidebar>
  );
}
