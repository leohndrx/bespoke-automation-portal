'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { testAdminFunctionality } from '../actions';
import { createClient } from '@supabase/supabase-js';

export default function DebugAdminPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<any>(null);
  
  const handleTestAdmin = async () => {
    setIsLoading(true);
    try {
      const testResult = await testAdminFunctionality();
      setResult(testResult);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDirectTest = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setDirectTestResult({
          success: false,
          error: 'Missing environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey
          }
        });
        return;
      }
      
      // Create standard Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test sign in - this should work
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'test@example.com',
        options: {
          // Don't actually send - just test API
          shouldCreateUser: false,
        }
      });
      
      setDirectTestResult({
        success: !error,
        result: data || error,
        message: error ? error.message : 'Auth API test successful'
      });
    } catch (error: any) {
      setDirectTestResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Debug Admin API</h1>
      
      <div className="flex space-x-4">
        <Button 
          onClick={handleTestAdmin}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test Admin API'}
        </Button>
        
        <Button 
          onClick={handleDirectTest}
          disabled={isLoading}
          variant="outline"
        >
          Test Direct Auth API
        </Button>
      </div>
      
      {result && (
        <div className="border rounded-md p-4 mt-4">
          <h2 className="font-medium mb-2">Admin Test Result:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      {directTestResult && (
        <div className="border rounded-md p-4 mt-4">
          <h2 className="font-medium mb-2">Direct Auth Test Result:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(directTestResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 