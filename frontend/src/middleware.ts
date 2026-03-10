import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add all protected tool paths here
const protectedPaths = [
  '/pdf-to-xml',
  '/pdf-to-word',
  '/pdf-to-tiff',
  '/pdf-split',
  '/ocr',
  '/xml-editor',
  '/epub2',
  '/epub3',
  '/admin' // Admin is protected too
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = request.cookies.get('token');
    if (!token) {
      // Missing token, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
