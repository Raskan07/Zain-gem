import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Download, Calendar, Filter, PieChart, LineChart } from "lucide-react";

export default function ReportsPage() {
  const reportData = [
    { id: 1, name: "Monthly Sales Report", type: "Sales", lastGenerated: "2024-01-15", status: "Ready", size: "2.4 MB" },
    { id: 2, name: "Inventory Status Report", type: "Inventory", lastGenerated: "2024-01-14", status: "Ready", size: "1.8 MB" },
    { id: 3, name: "Customer Analytics Report", type: "Analytics", lastGenerated: "2024-01-13", status: "Processing", size: "3.2 MB" },
    { id: 4, name: "Financial Summary Report", type: "Financial", lastGenerated: "2024-01-12", status: "Ready", size: "4.1 MB" },
    { id: 5, name: "Performance Metrics Report", type: "Performance", lastGenerated: "2024-01-11", status: "Ready", size: "2.9 MB" },
    { id: 6, name: "Trend Analysis Report", type: "Analytics", lastGenerated: "2024-01-10", status: "Ready", size: "3.7 MB" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-300">Generate and view comprehensive business reports</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-300">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">+23%</p>
                <p className="text-sm text-gray-300">Growth Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-gray-300">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-gray-300">Report Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription className="text-gray-300">
              Monthly sales trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
              <div className="text-center text-gray-400">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>Sales Chart</p>
                <p className="text-sm">Line chart visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription className="text-gray-300">
              Revenue breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
              <div className="text-center text-gray-400">
                <PieChart className="h-12 w-12 mx-auto mb-2" />
                <p>Revenue Chart</p>
                <p className="text-sm">Pie chart visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription className="text-gray-300">
            Generate and download business reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium">Report Name</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Last Generated</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Size</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((report) => (
                  <tr key={report.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium">{report.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.type === 'Sales' 
                          ? 'bg-green-500/20 text-green-300'
                          : report.type === 'Inventory'
                          ? 'bg-blue-500/20 text-blue-300'
                          : report.type === 'Analytics'
                          ? 'bg-purple-500/20 text-purple-300'
                          : report.type === 'Financial'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{report.lastGenerated}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'Ready' 
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{report.size}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {report.status === 'Ready' ? (
                          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" disabled>
                            Processing...
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          Regenerate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
