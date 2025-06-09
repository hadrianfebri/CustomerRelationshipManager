import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import AddTaskModal from "@/components/modals/add-task-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckSquare, Clock, AlertTriangle, Trash, Edit, Filter, Search, MoreHorizontal, Calendar, Bell, Users, CheckCircle2 } from "lucide-react";
import { Task, Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Task metrics
  const taskMetrics = useMemo(() => {
    const now = new Date();
    return {
      total: tasks.length,
      completed: tasks.filter((t: Task) => t.status === "completed").length,
      pending: tasks.filter((t: Task) => t.status === "pending").length,
      overdue: tasks.filter((t: Task) => {
        if (!t.dueDate || t.status === "completed") return false;
        return new Date(t.dueDate) < now;
      }).length,
    };
  }, [tasks]);

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
  });

  const bulkUpdateTasksMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[]; updates: any }) => {
      const response = await apiRequest("PATCH", "/api/tasks/bulk", { ids, updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setSelectedTasks([]);
      toast({
        title: "Tasks updated",
        description: "Selected tasks have been updated successfully.",
      });
    },
  });

  const createFollowUpTaskMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest("POST", "/api/tasks/follow-up", { contactId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Follow-up scheduled",
        description: "Automated follow-up task has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create follow-up task.",
        variant: "destructive",
      });
    },
  });

  const bulkCreateFollowUpsMutation = useMutation({
    mutationFn: async (contactIds: number[]) => {
      const results = await Promise.all(
        contactIds.map(async (contactId) => {
          try {
            const response = await apiRequest("POST", "/api/tasks/follow-up", { contactId });
            return response.json();
          } catch (error) {
            console.error(`Failed to create follow-up for contact ${contactId}:`, error);
            return null;
          }
        })
      );
      return results.filter(Boolean);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Bulk follow-ups created",
        description: `Successfully created ${results.length} follow-up tasks.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bulk follow-up tasks.",
        variant: "destructive",
      });
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Medium</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Cancelled</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Pending</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate: Date | string | null, status: string) => {
    if (!dueDate || status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  const getContactName = (contactId: number | null) => {
    if (!contactId) return "Unassigned";
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "Unknown Contact";
  };

  const handleSelectTask = (taskId: number, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedTasks.length === 0) return;

    switch (action) {
      case "complete":
        bulkUpdateTasksMutation.mutate({ ids: selectedTasks, updates: { status: "completed" } });
        break;
      case "pending":
        bulkUpdateTasksMutation.mutate({ ids: selectedTasks, updates: { status: "pending" } });
        break;
      case "high-priority":
        bulkUpdateTasksMutation.mutate({ ids: selectedTasks, updates: { priority: "high" } });
        break;
      case "delete":
        selectedTasks.forEach(id => deleteTaskMutation.mutate(id));
        setSelectedTasks([]);
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Tasks & Follow-ups" 
        subtitle="Manage your tasks and follow-up activities"
        onAddClick={() => setIsAddTaskOpen(true)}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        {/* Task Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskMetrics.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{taskMetrics.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{taskMetrics.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{taskMetrics.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedTasks.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction("complete")}>
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("pending")}>
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("high-priority")}>
                      Set High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction("delete")}
                      className="text-red-600"
                    >
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 dark:text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p>Create your first task to get started.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task: Task) => (
                    <TableRow key={task.id} className={isOverdue(task.dueDate, task.status || "pending") ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-foreground">
                            {task.title}
                            {isOverdue(task.dueDate, task.status || "pending") && (
                              <AlertTriangle className="inline h-4 w-4 text-red-500 ml-2" />
                            )}
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-500 dark:text-muted-foreground">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(task.priority || "medium")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status || "pending")}
                      </TableCell>
                      <TableCell>
                        <div className={isOverdue(task.dueDate, task.status || "pending") ? "text-red-600 font-medium" : ""}>
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getContactName(task.contactId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: task.status === "completed" ? "pending" : "completed" })}
                              >
                                {task.status === "completed" ? "Mark as Pending" : "Mark as Completed"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => task.contactId && createFollowUpTaskMutation.mutate(task.contactId)}
                                disabled={!task.contactId}
                              >
                                Create Follow-up
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                className="text-red-600"
                              >
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Quick Actions for Follow-ups */}
        <div className="mt-6 bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Quick Follow-up Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => {
                const newLeads = contacts.filter(c => c.leadStatus === "new" || c.leadStatus === "contacted");
                if (newLeads.length > 0) {
                  bulkCreateFollowUpsMutation.mutate(newLeads.map(c => c.id));
                } else {
                  toast({
                    title: "No new leads found",
                    description: "All leads already have follow-up tasks or are closed.",
                  });
                }
              }}
              disabled={bulkCreateFollowUpsMutation.isPending}
            >
              <Users className="h-6 w-6 mb-2 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Follow-up New Leads</div>
                <div className="text-sm text-gray-500">
                  {contacts.filter(c => c.leadStatus === "new" || c.leadStatus === "contacted").length} leads available
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => {
                const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status || "pending"));
                const contactIds = overdueTasks.map(t => t.contactId).filter(Boolean) as number[];
                if (contactIds.length > 0) {
                  bulkCreateFollowUpsMutation.mutate(contactIds);
                } else {
                  toast({
                    title: "No overdue tasks found",
                    description: "All tasks are up to date.",
                  });
                }
              }}
              disabled={bulkCreateFollowUpsMutation.isPending}
            >
              <Calendar className="h-6 w-6 mb-2 text-orange-600" />
              <div className="text-left">
                <div className="font-medium">Reschedule Overdue</div>
                <div className="text-sm text-gray-500">Create new tasks for overdue items</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => setIsAddTaskOpen(true)}
            >
              <CheckSquare className="h-6 w-6 mb-2 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Create Custom Task</div>
                <div className="text-sm text-gray-500">Add a new task manually</div>
              </div>
            </Button>
          </div>
        </div>
      </main>
      
      <AddTaskModal 
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
      />
    </div>
  );
}