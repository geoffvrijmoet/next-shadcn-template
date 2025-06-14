import { DeploymentForm } from '@/components/deployment-form';
import { APIKeySetup } from '@/components/api-key-setup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Web App Generator
          </h1>
          <p className="text-xl text-gray-600">
            Deploy full-stack applications with one click
          </p>
        </div>

        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">API Setup</TabsTrigger>
            <TabsTrigger value="deploy">Deploy App</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="mt-6">
            <APIKeySetup />
          </TabsContent>
          
          <TabsContent value="deploy" className="mt-6">
            <DeploymentForm />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
