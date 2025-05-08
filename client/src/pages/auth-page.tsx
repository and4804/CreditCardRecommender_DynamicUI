import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerName, setRegisterName] = useState("");
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginUsername, loginPassword);
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      username: registerUsername,
      password: registerPassword,
      email: registerEmail,
      name: registerName,
    });
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#1A1F71] to-[#2C3E50]">
      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
        {/* Left column: Auth form */}
        <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-[#1A1F71]">
                Welcome to CardSavvy
              </CardTitle>
              <CardDescription className="text-center">
                Your AI-powered credit card companion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input 
                        id="login-username" 
                        type="text" 
                        placeholder="Enter your username"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        id="login-password" 
                        type="password" 
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#1A1F71] hover:bg-[#141A5E]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input 
                        id="register-name" 
                        type="text" 
                        placeholder="Enter your full name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input 
                        id="register-username" 
                        type="text" 
                        placeholder="Choose a username"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        placeholder="Choose a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#1A1F71] hover:bg-[#141A5E]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-gray-500">
              {activeTab === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("register");
                    }} 
                    className="text-[#1A1F71] hover:underline"
                  >
                    Register
                  </a>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("login");
                    }} 
                    className="text-[#1A1F71] hover:underline"
                  >
                    Login
                  </a>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column: Hero */}
        <div className="hidden md:flex md:w-1/2 bg-opacity-10 p-6 items-center justify-center">
          <div className="text-white max-w-md p-6">
            <h2 className="text-3xl font-bold mb-4">
              Maximize Your Credit Card Benefits
            </h2>
            <p className="mb-6">
              CardSavvy uses AI to help you get the most out of your premium credit cards. 
              Our intelligent assistant will guide you to optimal travel bookings, 
              shopping offers, and exclusive benefits.
            </p>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg mb-4">
              <h3 className="text-xl text-[#FFB700] font-semibold mb-2">Personalized Recommendations</h3>
              <p>Get tailored card suggestions based on your spending patterns and travel preferences.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg mb-4">
              <h3 className="text-xl text-[#FFB700] font-semibold mb-2">Smart Travel Planning</h3>
              <p>Find the best flight and hotel deals that maximize your reward points and card benefits.</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="text-xl text-[#FFB700] font-semibold mb-2">Exclusive Shopping Offers</h3>
              <p>Discover special discounts and cashback opportunities only available to cardholders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}