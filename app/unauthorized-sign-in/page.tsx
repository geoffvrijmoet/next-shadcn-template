import Link from 'next/link';
import { AlertTriangle, Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedSignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Unauthorized Sign-In Detected
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              We detected a sign-in attempt from an unrecognized device or location. 
              For your security, this session has been revoked.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Security Notice
                </h3>
                                 <p className="text-xs text-blue-700">
                   If this was you, please sign in again from a trusted device. 
                   If this wasn&apos;t you, your account remains secure.
                 </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/sign-in">
                Sign In Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>

          <div className="text-center">
                         <p className="text-xs text-gray-500">
               Need help? Contact support if you&apos;re having trouble accessing your account.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 