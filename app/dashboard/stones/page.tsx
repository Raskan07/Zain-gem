import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Gem } from "lucide-react";

export default function StonesPage() {
  const stones = [
    { id: 1, name: "Sapphire", type: "Precious", weight: "2.5 carats", price: "$1,200", stock: 15, status: "In Stock" },
    { id: 2, name: "Ruby", type: "Precious", weight: "1.8 carats", price: "$950", stock: 8, status: "Low Stock" },
    { id: 3, name: "Emerald", type: "Precious", weight: "3.2 carats", price: "$1,800", stock: 12, status: "In Stock" },
    { id: 4, name: "Diamond", type: "Precious", weight: "1.5 carats", price: "$3,500", stock: 5, status: "Low Stock" },
    { id: 5, name: "Amethyst", type: "Semi-Precious", weight: "4.0 carats", price: "$450", stock: 25, status: "In Stock" },
    { id: 6, name: "Topaz", type: "Semi-Precious", weight: "2.8 carats", price: "$380", stock: 18, status: "In Stock" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Stones Management</h1>
          <p className="text-gray-300">Manage your gem and stone inventory</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Stone
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 border-white/20 text-white mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search stones..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gem className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">83</p>
                <p className="text-sm text-gray-300">Total Stones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gem className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">67</p>
                <p className="text-sm text-gray-300">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gem className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">13</p>
                <p className="text-sm text-gray-300">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Gem className="h-8 w-8 text-red-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-gray-300">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stones Table */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Stone Inventory</CardTitle>
          <CardDescription className="text-gray-300">
            Complete list of all stones in your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Weight</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stones.map((stone) => (
                  <tr key={stone.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Gem className="h-5 w-5 text-blue-400 mr-2" />
                        {stone.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stone.type === 'Precious' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {stone.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{stone.weight}</td>
                    <td className="py-3 px-4 font-medium">{stone.price}</td>
                    <td className="py-3 px-4">{stone.stock}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stone.status === 'In Stock' 
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {stone.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          View
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
