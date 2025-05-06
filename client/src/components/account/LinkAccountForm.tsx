import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { linkAccountSchema } from '@shared/schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LinkAccountForm() {
  const { toast } = useToast();
  
  // Extended schema with specific validation requirements
  const formSchema = linkAccountSchema.extend({
    accountNumber: z.string().min(4, {
      message: "Account number must be at least 4 characters",
    }),
    accountName: z.string().min(2, {
      message: "Account name must be at least 2 characters",
    }),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Form initialization
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      program: "QANTAS",
      accountNumber: "",
      accountName: "",
    },
  });
  
  // Link account mutation
  const linkMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/link-account", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account linked",
        description: "Your loyalty account has been successfully linked",
      });
      // Reset form
      form.reset();
      // Refresh wallets data
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to link account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: FormValues) => {
    linkMutation.mutate(data);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-4">Connect a New Program</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="program"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loyalty Program</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="QANTAS">Qantas Frequent Flyer</SelectItem>
                    <SelectItem value="GYG">Guzman y Gomez Loyalty</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your account number" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name on the account" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={linkMutation.isPending}>
              {linkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking Account...
                </>
              ) : (
                'Link Account'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
