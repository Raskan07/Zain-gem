import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Settings } from "lucide-react";

export default function RemaindersPage() {
  const notifications = [
    { id: 1, type: "Low Stock", message: "Ruby collection is running low on stock", priority: "High", time: "2 hours ago", read: false },
    { id: 2, type: "Payment Due", message: "Invoice #1234 is due in 3 days", priority: "Medium", time: "4 hours ago", read: false },
    { id: 3, type: "New Order", message: "New order received from Sarah Johnson", priority: "Low", time: "6 hours ago", read: true },
    { id: 4, type: "System Update", message: "Database backup completed successfully", priority: "Info", time: "1 day ago", read: true },
    { id: 5, type: "Maintenance", message: "Scheduled maintenance in 2 days", priority: "Medium", time: "1 day ago", read: false },
    { id: 6, type: "Stock Alert", message: "Diamond inventory needs replenishment", priority: "High", time: "2 days ago", read: false },
  ];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case "Medium":
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case "Low":
        return <Info className="h-5 w-5 text-blue-400" />;
      case "Info":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-red-500/30 bg-red-500/10";
      case "Medium":
        return "border-yellow-500/30 bg-yellow-500/10";
      case "Low":
        return "border-blue-500/30 bg-blue-500/10";
      case "Info":
        return "border-green-500/30 bg-green-500/10";
      default:
        return "border-gray-500/30 bg-gray-500/10";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Remainders & Notifications</h1>
          <p className="text-gray-300">Stay updated with important alerts and notifications</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-300">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-300">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-300">Medium Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-gray-300">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription className="text-gray-300">
            Latest alerts and system notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'ring-2 ring-white/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getPriorityIcon(notification.priority)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-white">{notification.type}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          notification.priority === 'High' 
                            ? 'bg-red-500/20 text-red-300'
                            : notification.priority === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : notification.priority === 'Low'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{notification.message}</p>
                      <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        Mark Read
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      Action
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
