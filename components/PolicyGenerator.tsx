import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PolicyGenerator() {
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);

    // Fake progress for demo purposes
    const interval = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Policy Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Automatically generate SOC 2 compliant policies tailored to your
          organization.
        </p>
        {generating && <Progress value={progress} />}
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Policies'}
        </Button>
      </CardContent>
    </Card>
  );
}