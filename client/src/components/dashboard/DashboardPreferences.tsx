import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define the loyalty programs for the widget
const LOYALTY_PROGRAMS = [
  { id: "QANTAS", name: "Qantas Frequent Flyer" },
  { id: "GYG", name: "GetYourGuide" },
  { id: "XPOINTS", name: "xPoints" },
  { id: "VELOCITY", name: "Velocity" },
  { id: "AMEX", name: "American Express" },
  { id: "FLYBUYS", name: "Flybuys" },
  { id: "HILTON", name: "Hilton Honors" },
  { id: "MARRIOTT", name: "Marriott Bonvoy" },
  { id: "AIRBNB", name: "Airbnb" },
  { id: "DELTA", name: "Delta SkyMiles" },
];

export default function DashboardPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [dashboardLayout, setDashboardLayout] = useState<string[]>([]);

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/user/preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/preferences");
      return response.json();
    },
  });

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { favoritePrograms: string[]; dashboardLayout: string[] }) => {
      const response = await apiRequest("PUT", "/api/user/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferences"] });
      toast({
        title: "Preferences Updated",
        description: "Your dashboard layout has been saved successfully.",
        variant: "success",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "There was a problem updating your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize state from preferences when data loads
  useEffect(() => {
    if (preferences) {
      setSelectedPrograms(preferences.favoritePrograms || []);
      setDashboardLayout(preferences.dashboardLayout || []);
    }
  }, [preferences]);

  // Handle drag and drop for reordering
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(dashboardLayout);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDashboardLayout(items);
  };

  // Toggle program selection
  const toggleProgram = (programId: string) => {
    if (selectedPrograms.includes(programId)) {
      setSelectedPrograms(selectedPrograms.filter((id) => id !== programId));
      setDashboardLayout(dashboardLayout.filter((id) => id !== programId));
    } else {
      setSelectedPrograms([...selectedPrograms, programId]);
      setDashboardLayout([...dashboardLayout, programId]);
    }
  };

  // Save preferences
  const savePreferences = () => {
    updatePreferencesMutation.mutate({
      favoritePrograms: selectedPrograms,
      dashboardLayout,
    });
  };

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="ml-auto bg-white/90 hover:bg-white"
          >
            Customize Dashboard
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Customize Your Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Select which loyalty programs to display and drag to reorder how they appear on your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <h3 className="mb-2 font-medium">Select Programs</h3>
            <div className="grid grid-cols-2 gap-2">
              {LOYALTY_PROGRAMS.map((program) => (
                <div key={program.id} className="flex items-center space-x-2">
                  <Switch
                    id={`program-${program.id}`}
                    checked={selectedPrograms.includes(program.id)}
                    onCheckedChange={() => toggleProgram(program.id)}
                  />
                  <Label htmlFor={`program-${program.id}`}>{program.name}</Label>
                </div>
              ))}
            </div>

            {dashboardLayout.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 font-medium">Arrange Order</h3>
                <Card>
                  <CardContent className="p-2">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="dashboard-layout">
                        {(provided) => (
                          <ul
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-1"
                          >
                            {dashboardLayout.map((programId, index) => {
                              const program = LOYALTY_PROGRAMS.find(
                                (p) => p.id === programId
                              );
                              return (
                                <Draggable
                                  key={programId}
                                  draggableId={programId}
                                  index={index}
                                >
                                  {(provided) => (
                                    <li
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center rounded-md border bg-white p-2"
                                    >
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mr-2"
                                      >
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <span>{program ? program.name : programId}</span>
                                    </li>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </ul>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={savePreferences} disabled={updatePreferencesMutation.isPending}>
              {updatePreferencesMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Save Changes
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}