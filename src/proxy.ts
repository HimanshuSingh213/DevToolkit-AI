import { NextResponse } from "next/server";
import { auth } from "./auth";

export const proxy = auth((req) => {
    const isLoggedIn = !!req.auth;

    const isLoginRoute = req.nextUrl.pathname === "/login";
    const isWorkspaceRoute = req.nextUrl.pathname.startsWith("/workspace");

    const isNotARoute = req.nextUrl.pathname !== "/" && req.nextUrl.pathname !== "/login" && !req.nextUrl.pathname.startsWith("/workspace");

    if(isLoggedIn && isLoginRoute){
        return NextResponse.redirect(new URL("/workspace", req.nextUrl))
    }

    if(!isLoggedIn && isWorkspaceRoute){
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    if(isNotARoute){
        if(isLoggedIn){
            return NextResponse.redirect(new URL("/workspace", req.nextUrl))
        }
        
        return NextResponse.redirect(new URL("/", req.nextUrl))
    }

    return
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}