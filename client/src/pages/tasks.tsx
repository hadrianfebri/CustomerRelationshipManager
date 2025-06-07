import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TopBar from "@/components/layout/topbar";
import AddTaskModal from "@/components/modals/add-task-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, AlertTriangle, Trash, Edit } from "lucide-react";
import { Task } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

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

  return (
    <div className="flex-1 flex flex-col">
      <TopBar 
        title="Tasks & Follow-ups" 
        subtitle="Manage your tasks and follow-up activities"
        onAddClick={() => setIsAddTaskOpen(true)}
      />
      
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-background">
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : !tasks || tasks.length === 0 ? (
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
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: Task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-foreground">
                            {task.title}
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
                        {formatDate(task.dueDate)}
                      </TableCell>
                      <TableCell>
                        {task.assignedTo || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <AddTaskModal 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen} 
      />
    </div>
  );
}
