import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Gap {
  id: string;
  control: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
}

interface GapTableProps {
  gaps: Gap[];
}

export default function GapTable({ gaps }: GapTableProps) {
  return (
    <Card className="col-span-4 overflow-auto">
      <CardHeader>
        <CardTitle>Control Gaps</CardTitle>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gaps detected 🎉</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium">Control</th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((gap) => (
                <tr key={gap.id} className="border-b last:border-none">
                  <td className="py-2 pr-4 whitespace-nowrap">{gap.control}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={gap.description}>{gap.description}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        gap.severity === 'High'
                          ? 'text-red-600'
                          : gap.severity === 'Medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }
                    >
                      {gap.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}